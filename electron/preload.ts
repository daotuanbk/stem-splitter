import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from "electron";
import type { JobEvent, StemApi } from "../src/shared/types/stem-api";

const api: StemApi = {
  pathForFile: (file) => webUtils.getPathForFile(file),
  separate: (input, options) => ipcRenderer.invoke("separate", input, options),
  cancel: (jobId) => ipcRenderer.invoke("cancel", jobId),
  readStem: (jobId, stem) => ipcRenderer.invoke("read-stem", jobId, stem),
  exportStem: (jobId, stem, songName) => ipcRenderer.invoke("export-stem", jobId, stem, songName),
  exportAll: (jobId, stems, songName) => ipcRenderer.invoke("export-all", jobId, stems, songName),
  revealJob: (jobId) => ipcRenderer.invoke("reveal-job", jobId),
  onJobEvent: (listener) => {
    const handler = (_: IpcRendererEvent, event: JobEvent) => listener(event);
    ipcRenderer.on("job-event", handler);
    return () => ipcRenderer.off("job-event", handler);
  },
};

contextBridge.exposeInMainWorld("stemApi", api);
