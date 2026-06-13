import { randomBytes } from "crypto";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock("os", () => ({ homedir: () => "/home/test" }));

import * as fs from "fs";
import * as path from "path";
import { loadOrCreateSecret, secretFilePath } from "../secretManager";

const EXPECTED_DIR = path.join("/home/test", ".lolcoach");
const EXPECTED_FILE = path.join(EXPECTED_DIR, ".secret");

describe("secretManager", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("loadOrCreateSecret", () => {
    it("loadOrCreateSecret_FileExists_ReturnsExistingSecret", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue("  existing-secret  ");

      const result = loadOrCreateSecret();

      expect(result).toBe("existing-secret");
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("loadOrCreateSecret_FileNotExists_WritesNewSecret", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = loadOrCreateSecret();

      expect(fs.mkdirSync).toHaveBeenCalledWith(EXPECTED_DIR, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        EXPECTED_FILE,
        expect.any(String),
        { mode: 0o600 },
      );
      expect(result).toHaveLength(64); // 32 bytes hex
    });

    it("loadOrCreateSecret_FileNotExists_GeneratesUniqueSecretEachCall", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const first = loadOrCreateSecret();
      const second = loadOrCreateSecret();

      expect(first).not.toBe(second);
    });
  });

  describe("secretFilePath", () => {
    it("secretFilePath_ReturnsExpectedPath", () => {
      expect(secretFilePath()).toBe(EXPECTED_FILE);
    });
  });
});
