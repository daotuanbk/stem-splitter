import { AUDIO_EXTENSIONS } from "./constants/models";

export const stemApi = window.stemApi;

export const isAudioFile = (path: string) => AUDIO_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));

export const baseName = (path: string) => path.split(/[\\/]/).pop() ?? path;
