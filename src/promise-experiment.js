const {createOptions, createExperiment} = require("./shared");
const {isThennable} = require("./pkg-util");

function wrapPromiseExperiment (_exp) {
  const trial  = {name: _exp.name, id: makeId()};
  const ctx    = _exp._context || this;

  function experiment (...args) {

    if (!shouldRun(_exp, args)) {
      return _exp.control.apply(ctx, args);
    }

    const {controlOptions, candidateOptions} = createOptions(_exp, args, ctx);
    const promises = [controlOptions, candidateOptions].map(makePromiseObservation);

    return Promise.all(promises).then(function (observations) {
      trial.control = observations[0];
      trial.candidate = observations[1];
      _exp._report(_exp._clean(trial));
      return trial.control.returned
    });

  }

  assign(experiment, _exp.control);
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

module.exports = createExperiment(wrapPromiseExperiment);
