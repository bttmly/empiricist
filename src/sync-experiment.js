const assign = require("object-assign");

const {createOptions, createExperimentFactory} = require("./shared");
const {makeId} = require("./pkg-util");

function wrapSyncExperiment (exp) {

  function experimentFunc (...args) {

    const ctx = exp.context || this;
    const trial = {name: exp.name, id: makeId()};

    if (!exp.enabled(...args)) {
      return exp.control.apply(ctx, args);
    }

    const {controlOptions, candidateOptions} = createOptions(exp, args, ctx);

    if (this instanceof experimentFunc) {
      candidateOptions.construct =
      controlOptions.construct =
      true;
    }

    trial.control = makeSyncObservation(controlOptions);
    trial.candidate = makeSyncObservation(candidateOptions);

    exp.report(exp.clean(trial));
    return trial.control.result;
  }

  // now make the returned function look superficially like the control...
  assign(experimentFunc, exp.control);
  swapPrototypes(experimentFunc, exp.control);

  return experimentFunc;
}

function makeSyncObservation (options) {
  const {fn, ctx, args, metadata, which, construct} = options;
  const observation = {args, metadata, type: which};
  const start = Date.now();

  /* eslint-disable new-cap */
  if (which === "candidate") {
    try {
      observation.result = construct ?
        new fn(...args) :
        fn.apply(ctx, args);
    } catch (e) {
      observation.result = null;
      observation.error = e;
    }
  } else {
    observation.result = construct ?
      new fn(...args) :
      fn.apply(ctx, args);
  }
  /* eslint-enable new-cap */

  observation.duration = Date.now() - start;
  return observation;
}

// this essentially steals the control's prototoype, and sort of
// makes the control inherit from the experiment. The outcome is
// that an instance of the experiment reports as such, since the
// experiment is now above the control in the prototype chain
//
// This might be really stupid.
//
// Is there a way to avoid doing this mumbo-jumbo for "vanilla"
// functions (i.e. those not intended to be called with `new`)?
// Alternately, perhaps the caller should ask for it to be performed
// by configuring something in the executor. Maybe we just document
// that constructors aren't supported.


// ExperimentalMammal = syncExperiment(Mammal);
// Original hierarchy: Animal -> Mammal
// New hierarchy: Animal -> ExperimentalMammal -> Mammal

function swapPrototypes (experiment, control) {
  const orig = control.prototype;
  const derived = Object.create(orig);
  experiment.prototype = orig;
  control.prototype = derived;
}

module.exports = createExperimentFactory(wrapSyncExperiment);
