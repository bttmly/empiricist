"use strict";

var Experiment = require("./experiment");
var syncExperiment = require("./sync-experiment");
var asyncExperiment = require("./async-experiment");
var promiseExperiment = require("./promise-experiment");

module.exports = Object.defineProperties({
  Experiment: Experiment,
  syncExperiment: syncExperiment,
  asyncExperiment: asyncExperiment
}, {
  promiseExperiment: {
    get: function get() {
      if (typeof Promise === "undefined") {
        throw new Error("Promise experiments require a global promise polyfill.");
      }
      return promiseExperiment;
    },
    configurable: true,
    enumerable: true
  }
});