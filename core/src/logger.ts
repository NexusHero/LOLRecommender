export class Logger {
  static info(message: string, ...optionalParams: any[]) {
    console.log(message, ...optionalParams);
  }

  static warn(message: string, ...optionalParams: any[]) {
    console.warn(message, ...optionalParams);
  }

  static error(message: string, ...optionalParams: any[]) {
    console.error(message, ...optionalParams);
  }

  static debug(message: string, ...optionalParams: any[]) {
    // Falls später Debug-Loglevel eingeführt wird
    // console.debug(message, ...optionalParams);
  }
}
