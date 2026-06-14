"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static info(message, ...optionalParams) {
        console.log(message, ...optionalParams);
    }
    static warn(message, ...optionalParams) {
        console.warn(message, ...optionalParams);
    }
    static error(message, ...optionalParams) {
        console.error(message, ...optionalParams);
    }
    static debug(message, ...optionalParams) {
        // Falls später Debug-Loglevel eingeführt wird
        // console.debug(message, ...optionalParams);
    }
}
exports.Logger = Logger;
