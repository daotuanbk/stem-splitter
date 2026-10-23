import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import type { JobEvent, ModelId, SeparateOptions, StemId } from "../src/shared/types/stem-api";

const MODELS = new Set<ModelId>(["bs_roformer_sw", "htdemucs_ft", "htdemucs_6s", "htdemucs"]);
const STEMS = new Set<StemId>(["vocals", "drums", "bass", "keys", "guitar", "lead_guitar", "rhythm_guitar"]);
const JOB_ID = /^[0-9a-f-]{36}$/;
const STEM = /^[a-z_]+$/;

const resourcesRoot = app.isPackaged ? process.resourcesPath : app.getAppPath();
const PYTHON =
  process.env.STEM_SPLITTER_PYTHON ??
  path.join(resourcesRoot, app.isPackaged ? "python/.venv/bin/python" : ".venv/bin/python");
const SCRIPT = path.join(resourcesRoot, "python/separate.py");
const JOBS_DIR = path.join(app.getPath("userData"), "jobs");

const running = new Map<string, ChildProcess>();
let win: BrowserWindow | null = null;

function jobDir(jobId: string) {
  if (!JOB_ID.test(jobId)) throw new Error("Invalid job id");
  return path.join(JOBS_DIR, jobId);
}

function stemPath(jobId: string, stem: string) {
  if (!STEM.test(stem)) throw new Error("Invalid stem name");
  return path.join(jobDir(jobId), `${stem}.wav`);
}

function send(event: JobEvent) {
  win?.webContents.send("job-event", event);
}

function startJob(input: string, { model, stems }: SeparateOptions) {
  if (!MODELS.has(model)) throw new Error(`Unknown model ${model}`);
  if (!stems.length || !stems.every((s) => STEMS.has(s))) throw new Error("Invalid stem selection");
  const jobId = randomUUID();
  const args = [SCRIPT, input, jobDir(jobId), "--model", model, "--stems", stems.join(",")];
  const child = spawn(PYTHON, args, {
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  running.set(jobId, child);

  let finished = false;
  let stderrTail = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderrTail = (stderrTail + chunk.toString()).slice(-2000);
  });
  readline.createInterface({ input: child.stdout }).on("line", (line) => {
    try {
      const msg = JSON.parse(line);
      if (msg.type === "done" || msg.type === "error") finished = true;
      send({ jobId, ...msg });
    } catch {
      // Library output that slipped onto stdout, not a protocol message.
    }
  });
  child.on("error", (err) => {
    finished = true;
    send({ jobId, type: "error", message: `Cannot start Python (${PYTHON}): ${err.message}` });
  });
  child.on("close", (code, signal) => {
    running.delete(jobId);
    if (finished || signal === "SIGTERM") return;
    send({ jobId, type: "error", message: stderrTail.trim() || `Separation exited with code ${code}` });
  });

  send({ jobId, type: "status", value: "starting" });
  return jobId;
}

function safeFileName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[/\\?%*:|"<>]/g, "_") || "song";
}

ipcMain.handle("separate", (_, input: string, options: SeparateOptions) => startJob(input, options));

ipcMain.handle("cancel", (_, jobId: string) => {
  running.get(jobId)?.kill("SIGTERM");
  return fs.rm(jobDir(jobId), { recursive: true, force: true });
});

ipcMain.handle("read-stem", async (_, jobId: string, stem: string) => {
  const buf = await fs.readFile(stemPath(jobId, stem));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
});

ipcMain.handle("export-stem", async (_, jobId: string, stem: string, songName: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win!, {
    defaultPath: `${safeFileName(songName)} - ${stem}.wav`,
    filters: [{ name: "WAV", extensions: ["wav"] }],
  });
  if (canceled || !filePath) return false;
  await fs.copyFile(stemPath(jobId, stem), filePath);
  return true;
});

ipcMain.handle("export-all", async (_, jobId: string, stems: string[], songName: string) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    title: "Choose a folder for the stems",
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || !filePaths[0]) return false;
  const base = safeFileName(songName);
  await Promise.all(
    stems.map((stem) => fs.copyFile(stemPath(jobId, stem), path.join(filePaths[0], `${base} - ${stem}.wav`))),
  );
  return true;
});

ipcMain.handle("reveal-job", (_, jobId: string) => shell.openPath(jobDir(jobId)));

function createWindow() {
  win = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 640,
    minHeight: 560,
    title: "Stem Splitter",
    backgroundColor: "#0b0b16",
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(import.meta.dirname, "preload.cjs"), spellcheck: false },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(import.meta.dirname, "../dist/index.html"));
  win.on("closed", () => (win = null));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  running.forEach((child) => child.kill("SIGTERM"));
  app.quit();
});
