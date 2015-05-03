function makeId () {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}

function isFunction (f) {
  typeof f === "function";
}

function isString (s) {
  return typeof s === "string";
}

function shouldRun (experiment, args) {
  return isFunction(experiment.candidate) && experiment._enabled(...args);
}

module.exports = {
  shouldRun,
  makeId,
  isFunction,
  isString
};
