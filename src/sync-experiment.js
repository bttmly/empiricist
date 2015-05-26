const assert = require("assert");

const assign = require("object-assign");

const Experiment = require("./experiment");
const {createOptions, createExperiment} = require("./shared");
const {shouldRun, makeId} = require("./pkg-util");

function wrapSyncExperiment (_exp) {

  function func (...args) {

    const ctx = _exp._context || this;
    const trial = {name: _exp.name, id: makeId()}

    if (!shouldRun(_exp, args)) {
      return _exp.control.apply(ctx, args);
    }

    const {controlOptions, candidateOptions} = createOptions(_exp, args, ctx);

    if (this instanceof func) {
      candidateOptions.construct =
      controlOptions.construct =
      true;
    }

    trial.control = makeSyncObservation(controlOptions),
    trial.candidate = makeSyncObservation(candidateOptions)

    _exp._report(_exp._clean(trial));
    return trial.control.returned;
  };

  // now make the returned function look superficially like the control...
  assign(func, _exp.control);
  swapPrototypes(func, _exp.control);

  return func;
}

function makeSyncObservation (options) {
  const {fn, ctx, args, metadata, which, construct} = options
  const observation = {args, metadata, type: which};
  const start = Date.now();

  if (which === "candidate") {
    try {
      observation.returned = construct ?
        new fn(...args) :
        fn.apply(ctx, args);
    } catch (e) {
      observation.returned = null;
      observation.threw = e;
    }
  } else {
    observation.returned = construct ?
      new fn(...args) :
      fn.apply(ctx, args);
  }

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

function swapPrototypes (experiment, control) {
  const orig = control.prototype;
  const derived = Object.create(orig);
  experiment.prototype = orig;
  control.prototype = derived;
}

module.exports = createExperiment(wrapSyncExperiment);
