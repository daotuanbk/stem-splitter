# Stem Splitter

Desktop app that splits a song into separate stems (vocals, drums, bass, keys, guitar, other) locally, with a built-in mixer to solo, mute and export each stem.

Built with Electron + React + Vite. Separation runs in a Python subprocess using [Demucs](https://github.com/facebookresearch/demucs) and BS-RoFormer.

## Models

| Model | Stems | Speed on CPU |
|---|---|---|
| `bs_roformer_sw` (default) | 6, incl. guitar and keys | ~18× song length |
| `htdemucs_ft` | vocals, drums, bass, other | ~4× song length |
| `htdemucs_6s` | 6, lower quality guitar/keys | ~real time |
| `htdemucs` | vocals, drums, bass, other | ~real time |

A CUDA GPU is used automatically when available. Model weights are downloaded on first use.

Supported input: `.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`.

## Requirements

- Node.js + pnpm
- Python 3.12
- Linux (packaging targets `.deb`)

## Setup

```bash
pnpm install
python3 -m venv .venv
.venv/bin/pip install -r python/requirements.txt
```

`python/requirements.txt` installs the CPU build of PyTorch. For GPU, install a CUDA build of `torch`/`torchaudio` instead.

## Development

```bash
pnpm dev
```

The app uses `.venv/bin/python` by default. Override with `STEM_SPLITTER_PYTHON=/path/to/python`.

## Build

```bash
pnpm dist
```

Produces a `.deb` in `release/`. The local `.venv` is bundled into the package, so set it up before building.
