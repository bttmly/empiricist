var experimentContext = require("./exp-ctx");

function asyncExperiment (name, init) {

  var params = {};

  var _experiment = experimentContext(params);

  // in init function, allow access to experiment object either under this or as argument
  // @try @use might be nicer in CoffeeScript, fluent e.use().try() chaining probably better for JS
  init.call(_experiment, _experiment);

  return function (...args) {

    // does babel not support (...args, cb) ?? why?
    var finish = args.pop();

    // if no context is provided, fallback to whatever `this` is present
    var ctx = params.context || this;

    // early return with no trial recording if no candidate or candidate not enabled
    if (!_experiment.enabled()) {
      return params.control.apply(ctx, args.concat(finish));
    }

    var trial = {};

    function makeObservation (fn, context, args, options, cb) {
      var start = Date.now();
      var observation = {name, args, metadata: params.metadata};

      // usually async functions don't return usable values, but not always
      // (for example, return an object with callback indicating obj is properly initialized)
      observation.returned = fn.apply(context, args.concat(next))

      function next (...cbArgs) {
        observation.cbArgs = cbArgs;
        observation.duration = Date.now() - start;
        trial[options.which] = observation;

        // signal to callback this is the control result by calling with arguments
        if (options.which == "control") return cb(...cbArgs);

        // otherwise call back with no arguments
        cb();
      }

      return observation.returned;
    }

    // coordinates when to call the final `finish` 
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
