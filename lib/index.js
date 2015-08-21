"use strict";

var wrapObserver = require("./wrap-observer");
var Experiment = require("./experiment");
var observeSync = require("./observe-sync");
var observeAsync = require("./observe-async");
var observePromise = require("./observe-promise");

module.exports = {
  Experiment: Experiment,
  observeSync: observeSync,
  observeAsync: observeAsync,
  observePromise: observePromise,
  syncExperiment: wrapObserver(observeSync, Experiment),
  asyncExperiment: wrapObserver(observeAsync, Experiment),
  promiseExperiment: wrapObserver(observePromise, Experiment)
};