let assert = require("assert");

let assign = require("object-assign");

let Experiment = require("./experiment");

let {
  isFunction,
  isString,
  shouldRun,
  makeId
} = require("./util");



function syncExperimentFactory (name, executor) {

  assert(isString(name), `'name' argument must be a string, found ${name}`);
  assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

  var _exp = new Experiment();
  executor.call(_exp, _exp);

  assert(isFunction(_exp.control), "Experiment's control function must be set with `e.use()`");

  function experiment (...args) {

    let ctx = _exp._context || this;

    if (!shouldRun(_exp, args)) {
      return _exp.control.apply(ctx, args);
    }

    let options = {ctx, metadata: _exp._metadata};

    let controlOptions = assign({
      fn: _exp.control,
      which: "control",
      args: args
    }, options);

    let candidateArgs = _exp._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    let candidateOptions = assign({
      fn: _exp.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    if (this instanceof experiment) {
      candidateOptions.construct =
      controlOptions.construct =
      true;
    }

    let trial = {
      name: name,
      id: makeId(),
      control: makeSyncObservation(controlOptions),
      candidate: makeSyncObservation(candidateOptions)
    };

    _exp._report(_exp._clean(trial));

    return trial.control.returned;
  };

  // now make the returned function look superficially like the control...
  assign(experiment, _exp.control);
  swapPrototypes(experiment, _exp.control);

  return experiment;
}

function makeSyncObservation (options) {
  let {args, fn, which, metadata, ctx, construct} = options

  let start = Date.now(),
      observation = {args, metadata, type: which};

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
  var orig = control.prototype;
  var derived = Object.create(orig);
  experiment.prototype = orig;
  control.prototype = derived;
}

module.exports = syncExperimentFactory;
