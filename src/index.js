const wrapObserver = require("./wrap-observer");
const Experiment = require("./experiment");
const observeSync = require("./observe-sync");
const observeAsync = require("./observe-async");
const observePromise = require("./observe-promise");

module.exports = {
  Experiment,
  observeSync,
  observeAsync,
  observePromise,
  syncExperiment: wrapObserver(observeSync, Experiment),
  asyncExperiment: wrapObserver(observeAsync, Experiment),
  promiseExperiment: wrapObserver(observePromise, Experiment),
};
