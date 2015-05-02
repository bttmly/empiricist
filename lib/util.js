"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");

var makeId = function makeId() {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
};

var isFunction = function isFunction(f) {
  return typeof f === "function";
};

var isString = function isString(s) {
  return typeof s === "string";
};

var shouldRun = function shouldRun(experiment, args) {
  return isFunction(experiment.candidate) && experiment._enabled.apply(experiment, _toConsumableArray(args));
};

module.exports = {
  shouldRun: shouldRun,
  makeId: makeId,
  isFunction: isFunction,
  isString: isString
};