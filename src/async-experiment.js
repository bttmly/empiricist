var assert = require("assert");
var async = require("async");

var experimentProto = require("./experiment-proto");

// internal callback chain:
// makeObservation(control) -> next() -> done()
// makeObservation(candidate) -> next() -> done()
// after 2 calls to done(), finish()

function asyncExperimentFactory (name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");
  
  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert.equal(typeof init, "function", "second argument must be a function");
    init.call(experiment, experiment);
  }

  // this function is what gets returned, decorated with all the experiment properties and methods
  // last argument is assumed to be the callback, as is customary
  function experiment (...args) {

    var finish = args.pop(),
        ctx    = experiment._context || this,
        trial  = {name};

    if (!experiment._enabled()) {
      experiment.control.apply(ctx, args.concat(finish));
      return;
    }

    var options = {trial, args, ctx, metadata: experiment._metadata};

    var controlOptions = Object.assign({
      fn: experiment.control,
      which: "control"
    }, options);

    var candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate"
    }, options);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, [args]) {
      experiment._report(experiment._clean(trial));
      finish(...args);
    });
  }

  return experiment;
}

function makeAsyncObservation (options, cb) {
  var start = Date.now();

  var {fn, trial, ctx, args, metadata, which} = options

  var observation = {args, metadata};

  if (which === "candidate") {
    try {
      fn.apply(ctx, args.concat(next));
    } catch (e) {
      observation.error = e;
    }
  } else {
    fn.apply(ctx, args.concat(next));
  }

  function next (...cbArgs) {
    observation.cbArgs = cbArgs;
    observation.duration = Date.now() - start;
    trial[which] = observation;
    cb(null, cbArgs);
  }
}

module.exports = asyncExperimentFactory;
