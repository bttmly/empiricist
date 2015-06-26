const assign = require("object-assign");

const {createOptions, createExperimentFactory} = require("./shared");
const Trial = require("./trial");

function wrapPromiseExperiment (exp) {
  const ctx = exp._context || this;

  function experimentFunc (...args) {

    if (!exp.enabled(args)) {
      return exp.control.apply(ctx, args);
    }

    const {controlOptions, candidateOptions} = createOptions(exp, args, ctx);
    const promises = [controlOptions, candidateOptions].map(makePromiseObservation);

    // I dont think this currently handles errors in the control properly
    return Promise.all(promises).then(function (observations) {
      const trial = new Trial(exp, observations);
      exp.emitTrial(trial);
      return trial.control.returned;
    });

  }

  assign(experimentFunc, exp.control);
  return experimentFunc;

}

function makePromiseObservation (options) {

  const {fn, ctx, args, metadata} = options;
  const observation = {args, metadata};
  const start = Date.now();

  function onSuccess (d) {
    observation.returned = d;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  function onError (e) {
    observation.error = e;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  return fn.apply(ctx, args).then(onSuccess, onError);
}

module.exports = createExperimentFactory(wrapPromiseExperiment);
