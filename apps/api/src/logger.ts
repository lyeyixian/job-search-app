import pino from "pino";
import { config } from "./config.js";

// One JSON line per event on standard output. Do not log note content.
export const logger = pino({
  level: config.logLevel,
  base: { service: "api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
