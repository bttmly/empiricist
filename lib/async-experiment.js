"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var experimentContext = require("./experiment-proto");

function asyncExperiment(name, init) {

  var params = {};

  var _experiment = experimentContext(params);

  // in init function, allow access to experiment object either under this or as argument
  // @try @use might be nicer in CoffeeScript, fluent e.use().try() chaining probably better for JS
  init.call(_experiment, _experiment);

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    // does babel not support (...args, cb) ?? why?
    var finish = args.pop();

    // if no context is provided, fallback to whatever `this` is present
    var ctx = params.context || this;

    // early return with no trial recording if no candidate or candidate not enabled
    if (!_experiment.enabled()) {
      return params.control.apply(ctx, args.concat(finish));
    }

    var trial = {};

    function makeObservation(fn, context, args, options, cb) {
      var start = Date.now();
      var observation = { name: name, args: args, metadata: params.metadata };

      // usually async functions don't return usable values, but not always
      // (for example, return an object with callback indicating obj is properly initialized)
      observation.returned = fn.apply(context, args.concat(next));

      function next() {
        for (var _len2 = arguments.length, cbArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          cbArgs[_key2] = arguments[_key2];
        }

        observation.cbArgs = cbArgs;
        observation.duration = Date.now() - start;
        trial[options.which] = observation;

        // signal to callback this is the control result by calling with arguments
        if (options.which == "control") {
          return cb.apply(undefined, cbArgs);
        } // otherwise call back with no arguments
        cb();
      }

      return observation.returned;
    }

    // coordinates when to call the final `finish`
    var done = (function () {
      var count = 2,
          // 1 control, 1 candidate
      controlArgs;

      return function () {
        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        if (args.length) {
          controlArgs = args;
        }

        count -= 1;

        if (count) return;

        params.reporter(params.cleaner(trial));
        finish.apply(undefined, _toConsumableArray(controlArgs));
      };
    })();

    makeObservation(params.candidate, ctx, args, { which: "candidate" }, done);
    return makeObservation(params.control, ctx, args, { which: "control" }, done);
  };
}

module.exports = asyncExperiment;