var assert = require("assert");

let makeId = () =>
  Date.now() + "-" + Math.random().toString(16).slice(2);

let isFunction = (f) => typeof f === "function";

let isString = (s) => typeof s === "string";

let shouldRun = (experiment, args) =>
  isFunction(experiment.candidate) && experiment._enabled(...args);

module.exports = {
  shouldRun,
  makeId,
  isFunction,
  isString
};
