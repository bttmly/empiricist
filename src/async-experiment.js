let assert = require("assert");
let domain = require("domain");

let async = require("async");

let {
  makeId,
  shouldRun,
  isFunction,
  isString
} = require("./util");

let experimentProto = require("./experiment-proto");

function asyncExperimentFactory (name, init) {

  assert(isString(name), "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert(isFunction(init), "second argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment (...args) {

    assert(isFunction(experiment.control), "Can't run experiment without control")

    let finish = args.pop(),
        ctx    = experiment._context || this,
        trial  = {name, id: makeId()};

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!shouldRun(experiment, args)) {
      experiment.control.apply(ctx, args.concat(finish));
      return;
    }

    let options = {trial, ctx, metadata: experiment._metadata};

    let controlOptions = Object.assign({
      fn: experiment.control,
      which: "control",
      args: args
    }, options);

    let candidateArgs = experiment._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    let candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, results) {
      let args = results[0];
      experiment._report(experiment._clean(trial));
      finish(...args);
    });
  }

  return experiment;
}

function makeAsyncObservation (options, cb) {
  let {fn, trial, ctx, args, metadata, which} = options;

  let start = Date.now(),
      observation = {args, metadata},
      d;

  function next (...cbArgs) {
    if (d) d.exit();
    observation.cbArgs = cbArgs;
    observation.duration = Date.now() - start;
    trial[which] = observation;
    cb(null, cbArgs);
  }

  if (which === "candidate") {
    d = domain.create();
    d.enter();
    d.on("error", function (e) {
      observation.error = e;
      next();
    });

    return fn.apply(ctx, args.concat(next));
  }

  fn.apply(ctx, args.concat(next));

}

module.exports = asyncExperimentFactory;
