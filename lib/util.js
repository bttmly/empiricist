"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

function makeId() {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}

function isFunction(f) {
  return typeof f === "function";
}

function isString(s) {
  return typeof s === "string";
}

function shouldRun(experiment, args) {
  return isFunction(experiment.candidate) && experiment._enabled.apply(experiment, _toConsumableArray(args));
}

module.exports = {
  shouldRun: shouldRun,
  makeId: makeId,
  isFunction: isFunction,
  isString: isString
};