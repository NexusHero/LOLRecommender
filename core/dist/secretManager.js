"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOrCreateSecret = loadOrCreateSecret;
exports.secretFilePath = secretFilePath;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const SECRET_DIR = (0, path_1.join)((0, os_1.homedir)(), ".lolcoach");
const SECRET_FILE = (0, path_1.join)(SECRET_DIR, ".secret");
function loadOrCreateSecret() {
    if ((0, fs_1.existsSync)(SECRET_FILE)) {
        return (0, fs_1.readFileSync)(SECRET_FILE, "utf-8").trim();
    }
    const secret = (0, crypto_1.randomBytes)(32).toString("hex");
    (0, fs_1.mkdirSync)(SECRET_DIR, { recursive: true });
    (0, fs_1.writeFileSync)(SECRET_FILE, secret, { mode: 0o600 });
    return secret;
}
function secretFilePath() {
    return SECRET_FILE;
}
