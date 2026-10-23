export function computePeaks(buffer: AudioBuffer, buckets: number) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const size = Math.max(1, Math.floor(buffer.length / buckets));
  const peaks = new Float32Array(buckets);
  for (let b = 0; b < buckets; b++) {
    let max = 0;
    for (const data of channels) {
      for (let i = b * size, end = Math.min(i + size, data.length); i < end; i++) {
        const v = Math.abs(data[i]);
        if (v > max) max = v;
      }
    }
    peaks[b] = max;
  }
  return peaks;
}

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
