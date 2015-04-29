var assert = require("assert");

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

    // does babel not support (...args, cb)?? why?
    var finish = args.pop(),
        ctx    = experiment._context || this,
        trial  = {},
        count  = 2,
        controlArgs;

    // early return without running the trial if no candidate or candidate not enabled
    if (!experiment._enabled()) {
      return experiment.control.apply(ctx, args.concat(finish));
    }

    // done is the callback after each of control/candidate runs
    // it will call the final callback (finish) once both run
    function done (...args) {
      if (args.length) controlArgs = args;
      if (--count) return;
      experiment._report(experiment._clean(trial));
      finish(...controlArgs);
    }

    // make observation is run for each of control and candidate
    // it records characteristics about each and saves them to the trial object
    function makeObservation (fn, context, args, options, cb) {
      var start = Date.now();
      var observation = {name, args, metadata: experiment._metadata};

      if (options.which === "candidate") {
        // need a try/catch around candidate to avoid throwing if candidate throws
        // plus, we want to report out the error
        try {
          observation.returned = fn.apply(context, args.concat(next));
        } catch (e) {
          observation.error = e;
          observation.returned = null;
        }
      } else {
        // no try/catch on control so as to not change behavior
        observation.returned = fn.apply(context, args.concat(next));
      }

      function next (...cbArgs) {
        observation.cbArgs = cbArgs;
        observation.duration = Date.now() - start;
        trial[options.which] = observation;

        // signal to callback this is the control result by calling with arguments
        if (options.which === "control") return done(...cbArgs);

        // otherwise call back with no arguments
        done();
      }

      return observation.returned;
    }

    makeObservation(experiment.candidate, ctx, args, {which: "candidate"}, done);
    return makeObservation(experiment.control, ctx, args, {which: "control"}, done);
  }

  return experiment;
}

module.exports = asyncExperimentFactory;
