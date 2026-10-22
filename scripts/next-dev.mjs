import { spawn } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!url || url === "[SENSITIVE]" || !/^postgres(ql)?:\/\//i.test(url)) {
  delete process.env.DATABASE_URL;
}

const child = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
