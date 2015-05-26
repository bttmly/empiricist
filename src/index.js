const Experiment = require("./experiment");
const syncExperiment = require("./sync-experiment");
const asyncExperiment = require("./async-experiment");
const promiseExperiment = require("./promise-experiment");

module.exports = {
  Experiment,
  syncExperiment,
  asyncExperiment,
  get promiseExperiment () {
    if (typeof Promise === "undefined") {
      throw new Error("Promise experiments require a global promise polyfill.");
    }

    return promiseExperiment;
  }
};
