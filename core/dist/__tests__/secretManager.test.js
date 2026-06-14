"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("fs", () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
}));
jest.mock("os", () => ({ homedir: () => "/home/test" }));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const secretManager_1 = require("../secretManager");
const EXPECTED_DIR = path.join("/home/test", ".lolcoach");
const EXPECTED_FILE = path.join(EXPECTED_DIR, ".secret");
describe("secretManager", () => {
    beforeEach(() => jest.clearAllMocks());
    describe("loadOrCreateSecret", () => {
        it("loadOrCreateSecret_FileExists_ReturnsExistingSecret", () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue("  existing-secret  ");
            const result = (0, secretManager_1.loadOrCreateSecret)();
            expect(result).toBe("existing-secret");
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });
        it("loadOrCreateSecret_FileNotExists_WritesNewSecret", () => {
            fs.existsSync.mockReturnValue(false);
            const result = (0, secretManager_1.loadOrCreateSecret)();
            expect(fs.mkdirSync).toHaveBeenCalledWith(EXPECTED_DIR, { recursive: true });
            expect(fs.writeFileSync).toHaveBeenCalledWith(EXPECTED_FILE, expect.any(String), { mode: 0o600 });
            expect(result).toHaveLength(64); // 32 bytes hex
        });
        it("loadOrCreateSecret_FileNotExists_GeneratesUniqueSecretEachCall", () => {
            fs.existsSync.mockReturnValue(false);
            const first = (0, secretManager_1.loadOrCreateSecret)();
            const second = (0, secretManager_1.loadOrCreateSecret)();
            expect(first).not.toBe(second);
        });
    });
    describe("secretFilePath", () => {
        it("secretFilePath_ReturnsExpectedPath", () => {
            expect((0, secretManager_1.secretFilePath)()).toBe(EXPECTED_FILE);
        });
    });
});
