var assert = require("assert");

var util = require("util");

module.exports = {
  shouldRun (experiment) {
    return (
      typeof experiment.candidate === "function" &&
      experiment._enabled()
    );
  },

  assertFn (maybeFn) {
    assert.equal(typeof maybeFn, "function", "Argument must be a function.");
  }
};