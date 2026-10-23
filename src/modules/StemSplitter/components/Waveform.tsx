import { useEffect, useRef, type FC, type PointerEvent } from "react";

interface Props {
  peaks: Float32Array;
  color: string;
  progress: number;
  dimmed: boolean;
  onSeek: (fraction: number) => void;
}

function draw(canvas: HTMLCanvasElement, peaks: Float32Array, color: string, alpha: number) {
  const dpr = window.devicePixelRatio || 1;
  const { clientWidth: w, clientHeight: h } = canvas;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const g = canvas.getContext("2d")!;
  g.scale(dpr, dpr);
  g.fillStyle = color;
  g.globalAlpha = alpha;
  const bar = 2;
  const step = 3;
  const bars = Math.floor(w / step);
  for (let i = 0; i < bars; i++) {
    const peak = peaks[Math.floor((i / bars) * peaks.length)];
    const bh = Math.max(1, peak * h * 0.95);
    g.fillRect(i * step, (h - bh) / 2, bar, bh);
  }
}

const Waveform: FC<Props> = ({ peaks, color, progress, dimmed, onSeek }) => {
  const base = useRef<HTMLCanvasElement>(null);
  const played = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Canvas can't resolve var(), so read the computed value of the custom property set on the wrapper.
    const resolved = getComputedStyle(base.current!).getPropertyValue("--wave").trim() || "#fff";
    const render = () => {
      draw(base.current!, peaks, resolved, 0.5);
      draw(played.current!, peaks, resolved, 1);
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(base.current!);
    return () => observer.disconnect();
  }, [peaks, color]);

  const seekFrom = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
  };

  return (
    <div
      aria-hidden
      className="relative h-14 cursor-pointer transition-opacity duration-200"
      style={{ opacity: dimmed ? 0.2 : 1, ["--wave" as string]: color }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seekFrom(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && seekFrom(e)}
    >
      <canvas ref={base} className="absolute inset-0 size-full" />
      <canvas
        ref={played}
        className="absolute inset-0 size-full"
        style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
      />
    </div>
  );
};

export default Waveform;
