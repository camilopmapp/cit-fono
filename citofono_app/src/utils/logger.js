// src/utils/logger.js
// Logger centralizado — solo imprime en desarrollo (__DEV__)
const logger = {
  log:  (...args) => { if (__DEV__) console.log(...args) },
  warn: (...args) => { if (__DEV__) console.warn(...args) },
  // Los errores siempre se imprimen para facilitar diagnóstico
  error: (...args) => console.error(...args),
}

export default logger
