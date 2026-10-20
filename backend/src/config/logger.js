function writeLog(level, message, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };

  const output = JSON.stringify(entry);

  if (level === "error" || level === "fatal") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = Object.freeze({
  info: (message, metadata) => writeLog("info", message, metadata),

  warn: (message, metadata) => writeLog("warn", message, metadata),

  error: (message, metadata) => writeLog("error", message, metadata),

  fatal: (message, metadata) => writeLog("fatal", message, metadata),

  debug: (message, metadata) => {
    if (process.env.NODE_ENV !== "production") {
      writeLog("debug", message, metadata);
    }
  },
});
