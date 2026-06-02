/**
 * Shim for react-aria on React Native (web-only react-dom import).
 * Only flushSync is used from animation utilities.
 */
function flushSync(callback) {
  return callback();
}

module.exports = {
  flushSync,
  createPortal: children => children,
  version: '19.0.0-shim',
};

module.exports.flushSync = flushSync;
module.exports.default = module.exports;
