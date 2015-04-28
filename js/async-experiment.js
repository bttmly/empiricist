var experimentContext = require("./exp-ctx");

function asyncExperiment (name, fn) {

  var params = {};

  var _experiment = experimentContext(params);

  fn.call(_experiment, _experiment);

  return function (...args) {

    var finish = args.pop();
    var ctx = params.context || this;

    // early return with no trial recording if no candidate or candidate not enabled
    if (!_experiment.enabled()) {
      return params.control.apply(ctx, args.concat(finish));
    }

    var trial = {};

    function makeObservation (fn, context, args, options, cb) {
      var start = Date.now();
      var observation = {name, args, metadata: params.metadata};

      observation.returned = fn.apply(context, args.concat(next))

      function next (...cbArgs) {
        observation.cbArgs = cbArgs;
        observation.duration = Date.now() - start;
        trial[options.which] = observation;

        // signal to callback this is the control
        if (options.which == "control") return cb(...cbArgs);

        // otherwise call back with no arguments
        cb();
      }

      return observation.returned;
    }

    // called after control and candidate; once called twice,
    // reports out the trial result and invokes the original callback
    var done = (function () {
      var count = 2, // 1 control, 1 candidate
          controlArgs;

      return function (...args) {
        if (args.length) {
          controlArgs = args;
        }

        count -= 1;

        if (count) return;

        params.reporter(params.cleaner(trial));
        finish(...controlArgs);
      };
    })();

    makeObservation(params.candidate, ctx, args, {which: "candidate"}, done);
    return makeObservation(params.control, ctx, args, {which: "control"}, done);
  };
}

module.exports = asyncExperiment;
