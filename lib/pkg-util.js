"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _require = require("util");

var isFunction = _require.isFunction;

function makeId() {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}

function shouldRun(experiment, args) {
  return isFunction(experiment.candidate) && experiment._enabled.apply(experiment, _toConsumableArray(args));
}

function isThennable(p) {
  return p && isFunction(p.then) && isFunction(p["catch"]);
}

function isGenerator(f) {
  return isFunction(f) && /^function\s*\*/.test(f.toString());
}

module.exports = {
  shouldRun: shouldRun,
  makeId: makeId };