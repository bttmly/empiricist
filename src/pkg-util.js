const {isFunction} = require("util");

function makeId () {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}

function shouldRun (experiment, args) {
  return isFunction(experiment.candidate) && experiment._enabled(...args);
}

function isThennable (p) {
  return (
    p &&
    isFunction(p.then) &&
    isFunction(p.catch)
  );
}

function isGenerator (f) {
  return isFunction(f) && /^function\s*\*/.test(f.toString());
}

module.exports = {
  shouldRun,
  makeId,
};
