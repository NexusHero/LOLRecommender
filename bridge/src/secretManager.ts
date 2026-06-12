import { randomBytes } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const SECRET_DIR = join(homedir(), ".lolcoach");
const SECRET_FILE = join(SECRET_DIR, ".secret");

export function loadOrCreateSecret(): string {
  if (existsSync(SECRET_FILE)) {
    return readFileSync(SECRET_FILE, "utf-8").trim();
  }
  const secret = randomBytes(32).toString("hex");
  mkdirSync(SECRET_DIR, { recursive: true });
  writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
  return secret;
}

export function secretFilePath(): string {
  return SECRET_FILE;
}
