/**
 * codeExecutor.js — the grading engine (the heart of the judge).
 * Writes the submitted code to a temp folder, compiles/runs it against every test case,
 * and returns a verdict. Can run locally OR inside a locked-down Docker sandbox
 * (no network, capped CPU/memory, dropped privileges) when USE_DOCKER=true.
 */
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm, realpath, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Language configuration.
 * `compile` is optional. `{file}`, `{dir}`, `{bin}` are substituted at runtime.
 * The same commands are used on the host (local mode) and inside the container
 * (Docker mode) — only the paths differ.
 */
const LANGUAGES = {
  cpp: {
    source: "main.cpp",
    compile: ["g++", "-O2", "-std=c++17", "-o", "{bin}", "{file}"],
    run: ["{bin}"],
    bin: "main",
  },
  python: {
    source: "main.py",
    compile: null,
    run: ["python3", "{file}"],
    bin: "main",
  },
  java: {
    // Java requires the public class name to match the file name.
    source: "Main.java",
    compile: ["javac", "{file}"],
    run: ["java", "-cp", "{dir}", "Main"],
    bin: "main",
  },
};

const DEFAULT_TIMEOUT = Number(process.env.EXECUTION_TIMEOUT_MS || 5000);
const COMPILE_TIMEOUT = Number(process.env.COMPILE_TIMEOUT_MS || 20000);

// ---- Docker sandbox configuration -----------------------------------------
const USE_DOCKER = String(process.env.USE_DOCKER).toLowerCase() === "true";
const DOCKER_IMAGE = process.env.DOCKER_IMAGE || "online-judge-executor";
const DOCKER_MEMORY = process.env.DOCKER_MEMORY || "256m"; // hard memory cap
const DOCKER_CPUS = process.env.DOCKER_CPUS || "1.0"; // CPU cap (cores)
const DOCKER_PIDS_LIMIT = process.env.DOCKER_PIDS_LIMIT || "128"; // fork-bomb guard
const SANDBOX_MOUNT = "/sandbox";

// Monotonic counter for unique container names (avoids collisions across submissions).
let containerSeq = 0;
const nextContainerName = () => `oj-run-${process.pid}-${containerSeq++}`;

const MAX_OUTPUT = 1 << 20; // 1 MB cap to avoid memory blowups

const substitute = (args, vars) =>
  args.map((a) =>
    a.replace("{file}", vars.file).replace("{dir}", vars.dir).replace("{bin}", vars.bin)
  );

/**
 * Spawn a process, feed it stdin, enforce a wall-clock timeout, and cap output.
 * `onTimeout` runs extra cleanup (e.g. `docker kill`) before the child is killed.
 * Resolves with { stdout, stderr, code, signal, timedOut, timeMs }.
 */
function runProcess(cmd, args, { input = "", timeoutMs = DEFAULT_TIMEOUT, onTimeout } = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      if (onTimeout) {
        try {
          onTimeout();
        } catch {
          /* best-effort cleanup */
        }
      }
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      if (stdout.length < MAX_OUTPUT) stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      if (stderr.length < MAX_OUTPUT) stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: String(err.message), code: -1, signal: null, timedOut, timeMs: Date.now() - start });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, signal, timedOut, timeMs: Date.now() - start });
    });

    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

/**
 * Build the `docker run` argument list for a sandboxed command.
 * Security posture:
 *   --network=none           no network access whatsoever
 *   --memory / --memory-swap  hard RAM cap, swap disabled (swap==memory)
 *   --cpus                    CPU quota
 *   --pids-limit              fork-bomb protection
 *   --cap-drop=ALL            drop all Linux capabilities
 *   --security-opt no-new-privileges  block privilege escalation
 *   read-only mount for run; writable only for compile output
 */
function dockerArgs({ name, hostDir, command, writable, interactive }) {
  const args = [
    "run",
    "--rm",
    "--name", name,
    "--network=none",
    `--memory=${DOCKER_MEMORY}`,
    `--memory-swap=${DOCKER_MEMORY}`,
    `--cpus=${DOCKER_CPUS}`,
    `--pids-limit=${DOCKER_PIDS_LIMIT}`,
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "-v", `${hostDir}:${SANDBOX_MOUNT}${writable ? "" : ":ro"}`,
    "-w", SANDBOX_MOUNT,
  ];
  if (interactive) args.push("-i");
  args.push(DOCKER_IMAGE, ...command);
  return args;
}

/**
 * Run one command either locally or inside the Docker sandbox depending on USE_DOCKER.
 * `command` is the full argv built with the correct (container vs host) paths.
 */
function runStep({ command, input, timeoutMs, hostDir, writable, interactive }) {
  if (!USE_DOCKER) {
    const [cmd, ...rest] = command;
    return runProcess(cmd, rest, { input, timeoutMs });
  }
  const name = nextContainerName();
  const args = dockerArgs({ name, hostDir, command, writable, interactive });
  // On timeout the `docker run` client is killed, but the container can linger —
  // force-remove it so it cannot keep consuming CPU after TLE.
  const onTimeout = () => spawn("docker", ["rm", "-f", name], { stdio: "ignore" });
  return runProcess("docker", args, { input, timeoutMs, onTimeout });
}

const normalize = (s) =>
  s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, "")) // trim trailing whitespace per line
    .join("\n")
    .replace(/\n+$/g, ""); // trim trailing blank lines

/**
 * Compile (if needed) and run `source` against an array of test cases.
 * @returns {Promise<{verdict, passedCount, totalCount, timeMs, message}>}
 */
export async function grade({ language, source, testCases, timeLimitMs }) {
  const config = LANGUAGES[language];
  if (!config) {
    return { verdict: "Internal Error", passedCount: 0, totalCount: 0, timeMs: 0, message: `Unsupported language: ${language}` };
  }

  let dir = await mkdtemp(join(tmpdir(), "oj-"));
  // Resolve symlinks (macOS /var/folders -> /private/var/folders) so Docker's
  // file-sharing sees a path it can bind-mount.
  dir = await realpath(dir);
  // Let the container's unprivileged `runner` user read/write the mount.
  await chmod(dir, 0o777).catch(() => {});

  const timeout = timeLimitMs || DEFAULT_TIMEOUT;

  // Paths the *command* should reference: container paths in Docker mode, host paths otherwise.
  const base = USE_DOCKER ? SANDBOX_MOUNT : dir;
  const filePath = `${base}/${config.source}`;
  const binPath = `${base}/${config.bin}`;
  const dirPath = base;

  // Where we actually write the source on the host.
  const hostFilePath = join(dir, config.source);

  try {
    await writeFile(hostFilePath, source);
    await chmod(hostFilePath, 0o666).catch(() => {});

    // ---- Compile step ----
    if (config.compile) {
      const command = substitute(config.compile, { file: filePath, dir: dirPath, bin: binPath });
      const comp = await runStep({
        command,
        timeoutMs: COMPILE_TIMEOUT,
        hostDir: dir,
        writable: true, // compiler writes the binary / .class files into the mount
        interactive: false,
      });
      if (comp.code !== 0 || comp.timedOut) {
        return {
          verdict: "Compilation Error",
          passedCount: 0,
          totalCount: testCases.length,
          timeMs: comp.timeMs,
          message: (comp.timedOut ? "Compilation timed out\n" : "") + (comp.stderr.slice(0, 4000) || "Compilation failed"),
        };
      }
    }

    const runCommand = substitute(config.run, { file: filePath, dir: dirPath, bin: binPath });

    let passed = 0;
    let maxTime = 0;
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const res = await runStep({
        command: runCommand,
        input: tc.input ?? "",
        timeoutMs: timeout,
        hostDir: dir,
        writable: false, // run step only reads the compiled artifacts
        interactive: true, // keep stdin open to pipe the test input
      });
      maxTime = Math.max(maxTime, res.timeMs);

      if (res.timedOut) {
        return { verdict: "Time Limit Exceeded", passedCount: passed, totalCount: testCases.length, timeMs: maxTime, message: `Test ${i + 1}: time limit exceeded` };
      }
      // Docker reports OOM-kills and other failures via non-zero exit codes.
      if (res.code !== 0) {
        return { verdict: "Runtime Error", passedCount: passed, totalCount: testCases.length, timeMs: maxTime, message: `Test ${i + 1}: ${res.stderr.slice(0, 2000) || `exit code ${res.code}`}` };
      }
      if (normalize(res.stdout) !== normalize(tc.output ?? "")) {
        return { verdict: "Wrong Answer", passedCount: passed, totalCount: testCases.length, timeMs: maxTime, message: `Test ${i + 1}: wrong answer` };
      }
      passed++;
    }

    return { verdict: "Accepted", passedCount: passed, totalCount: testCases.length, timeMs: maxTime, message: "All test cases passed" };
  } catch (err) {
    return { verdict: "Internal Error", passedCount: 0, totalCount: testCases.length, timeMs: 0, message: String(err.message) };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGES);
export const EXECUTION_MODE = USE_DOCKER ? "docker" : "local";
