"""Separate one audio file into stems, streaming JSON lines on stdout for the Electron main process."""

import argparse
import contextlib
import json
import os
import sys
from pathlib import Path

import sphn
import torch
from demucs.audio import convert_audio, save_audio

SAMPLERATE = 44100
MODELS = ["bs_roformer_sw", "htdemucs_ft", "htdemucs_6s", "htdemucs"]
STEMS = ["vocals", "drums", "bass", "keys", "guitar", "lead_guitar", "rhythm_guitar"]
RENAME = {"piano": "keys"}
PROTOCOL_OUT = sys.stdout


def emit(**msg):
    print(json.dumps(msg), file=PROTOCOL_OUT, flush=True)


def device():
    return "cuda" if torch.cuda.is_available() else "cpu"


def load_audio(path: Path):
    data, sr = sphn.read(str(path))
    return convert_audio(torch.from_numpy(data), int(sr), SAMPLERATE, 2)


def separate_demucs(model: str, wav: torch.Tensor, shifts: int, overlap: float):
    from demucs.api import Separator

    def on_progress(info):
        done = info["model_idx_in_bag"] + info["segment_offset"] / info["audio_length"]
        emit(type="progress", value=round(min(done / info["models"], 1.0), 3))

    separator = Separator(model=model, device=device(), shifts=shifts, overlap=overlap, callback=on_progress)
    emit(type="status", value="separating")
    _, stems = separator.separate_tensor(wav, SAMPLERATE)
    return stems


def separate_roformer(wav: torch.Tensor):
    import yaml
    from bs_roformer import DEFAULT_MODEL, demix_track, ensure_model_assets, get_model_from_config
    from bs_roformer.inference import SafeLoaderWithTuple
    from bs_roformer.utils import load_checkpoint_state
    from ml_collections import ConfigDict

    ckpt, config_path = ensure_model_assets(DEFAULT_MODEL)
    with open(config_path) as f:
        config = ConfigDict(yaml.load(f, Loader=SafeLoaderWithTuple))
    model = get_model_from_config("bs_roformer", config)
    model.load_state_dict(load_checkpoint_state(ckpt))
    model.to(device()).eval()

    # Mirrors demix_track's chunking so a forward hook can report progress it doesn't expose.
    chunk = getattr(config.inference, "chunk_size", None) or config.audio.chunk_size
    step = chunk // config.inference.num_overlap
    border = chunk - step
    length = wav.shape[1] + (2 * border if wav.shape[1] > 2 * border else 0)
    total = -(-length // step)
    calls = 0

    def on_forward(*_):
        nonlocal calls
        calls += 1
        emit(type="progress", value=round(min(calls / total, 1.0), 3))

    model.register_forward_hook(on_forward)
    emit(type="status", value="separating")
    result, _ = demix_track(config, model, wav, device())
    return {name: torch.from_numpy(audio) for name, audio in result.items()}


def split_by_pan(guitar: torch.Tensor, n_fft: int = 4096):
    """Split a stereo guitar stem into centre-panned (lead) and side-panned (rhythm) parts.

    Uses the inter-channel similarity of each STFT bin (Avendano 2003); rhythm guitars are
    usually double-tracked and panned hard left/right while the lead sits near the centre.
    """
    # ponytail: panning heuristic, not a trained model; a mono or centre-mixed rhythm part ends up in "lead".
    window = torch.hann_window(n_fft)
    spec = torch.stft(guitar, n_fft, hop_length=n_fft // 4, window=window, return_complex=True)
    left, right = spec[0], spec[1]
    similarity = 2 * (left * right.conj()).abs() / (left.abs() ** 2 + right.abs() ** 2 + 1e-8)
    lead = torch.istft(spec * similarity**4, n_fft, hop_length=n_fft // 4, window=window, length=guitar.shape[-1])
    return lead, guitar - lead


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("outdir", type=Path)
    parser.add_argument("--model", choices=MODELS, default="bs_roformer_sw")
    parser.add_argument("--stems", default="vocals,drums,bass", help=f"comma separated subset of {STEMS}")
    parser.add_argument("--shifts", type=int, default=1)
    parser.add_argument("--overlap", type=float, default=0.25)
    args = parser.parse_args()

    wanted = set(args.stems.split(","))
    if not wanted <= set(STEMS):
        raise ValueError(f"Unknown stems: {sorted(wanted - set(STEMS))}")

    torch.set_num_threads(os.cpu_count() or 1)
    wav = load_audio(args.input)

    emit(type="status", value="loading-model")
    if args.model == "bs_roformer_sw":
        stems = separate_roformer(wav)
    else:
        stems = separate_demucs(args.model, wav, args.shifts, args.overlap)
    stems = {RENAME.get(name, name): audio.cpu() for name, audio in stems.items()}

    if wanted & {"lead_guitar", "rhythm_guitar"} and "guitar" in stems:
        stems["lead_guitar"], stems["rhythm_guitar"] = split_by_pan(stems.pop("guitar"))

    # Unselected instruments fold into "other" so the stems still sum back to the original mix.
    output = {name: audio for name, audio in stems.items() if name in wanted}
    rest = [audio for name, audio in stems.items() if name not in wanted]
    if rest:
        output["other"] = torch.stack(rest).sum(0)

    emit(type="status", value="saving")
    args.outdir.mkdir(parents=True, exist_ok=True)
    for name, audio in output.items():
        save_audio(audio, args.outdir / f"{name}.wav", SAMPLERATE, bits_per_sample=24)
    emit(type="done", stems=list(output))


if __name__ == "__main__":
    try:
        # Libraries print progress to stdout; keep it on stderr so stdout stays pure JSON lines.
        with contextlib.redirect_stdout(sys.stderr):
            main()
    except Exception as err:
        emit(type="error", message=str(err))
        sys.exit(1)
