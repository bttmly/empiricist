const {createOptions, createExperimentFactory} = require("./shared");
const {isThennable} = require("./pkg-util");

function wrapPromiseExperiment (exp) {
  const trial  = {name: exp.name, id: makeId()};
  const ctx    = exp._context || this;

  function experiment (...args) {

    if (!exp.enabled(args)) {
      return exp.control.apply(ctx, args);
    }

    const {controlOptions, candidateOptions} = createOptions(exp, args, ctx);
    const promises = [controlOptions, candidateOptions].map(makePromiseObservation);

    return Promise.all(promises).then(function (observations) {
      trial.control = observations[0];
      trial.candidate = observations[1];
      exp._report(exp._clean(trial));
      return trial.control.returned
    });

  }

  assign(experiment, exp.control);
  return experiment;

}

function makePromiseObservation (options) {

  const {fn, trial, ctx, args, metadata, which} = options;
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
