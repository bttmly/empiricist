var assert = require("assert");
var domain = require("domain");

var async = require("async");

var {makeId, shouldRun} = require("./util");
var experimentProto = require("./experiment-proto");

function asyncExperimentFactory (name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert.equal(typeof init, "function", "second argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment (...args) {

    assert.equal(typeof experiment.control, "function", "Can't run experiment without control");

    var finish = args.pop(),
        ctx    = experiment._context || this,
        trial  = {name, id: makeId()};

    if (!shouldRun(experiment, args)) {
      experiment.control.apply(ctx, args.concat(finish));
      return;
    }

    var options = {trial, ctx, metadata: experiment._metadata};

    var controlOptions = Object.assign({
      fn: experiment.control,
      which: "control",
      args: args
    }, options);

    var candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate",
      args: experiment._beforeRun(args)
    }, options);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, [args]) {
      experiment._report(experiment._clean(trial));
      finish(...args);
    });
  }

  return experiment;
}

function makeAsyncObservation (options, cb) {
  var {fn, trial, ctx, args, metadata, which} = options;

  var start = Date.now(),
      observation = {args, metadata},
      d;

  if (which === "candidate") {
    d = domain.create();
    d.enter();
    d.on("error", (e) => {
      observation.error = e;
      next();
    });
    return fn.apply(ctx, args.concat(next));
  }

  fn.apply(ctx, args.concat(next));

  function next (...cbArgs) {
    if (d) d.exit();
    observation.cbArgs = cbArgs;
    observation.duration = Date.now() - start;
    trial[which] = observation;
    cb(null, cbArgs);
  }
}

module.exports = asyncExperimentFactory;
