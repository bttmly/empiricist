var assert = require("assert");

var util = require("util");

module.exports = {
  shouldRun (experiment) {
    return (
      typeof experiment.candidate === "function" &&
      experiment._enabled()
    );
  },

  makeId () {
    return Date.now() + "-" + Math.random().toString(16).slice(2);
  },

  assertFn (maybeFn) {
    assert.equal(typeof maybeFn, "function", "Argument must be a function.");
  }
};