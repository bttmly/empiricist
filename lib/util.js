"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");

var util = require("util");

module.exports = {
  shouldRun: function shouldRun(experiment, args) {
    return typeof experiment.candidate === "function" && experiment._enabled.apply(experiment, _toConsumableArray(args));
  },

  makeId: function makeId() {
    return Date.now() + "-" + Math.random().toString(16).slice(2);
  },

  assertFn: function assertFn(maybeFn) {
    assert.equal(typeof maybeFn, "function", "Argument must be a function.");
  }
};