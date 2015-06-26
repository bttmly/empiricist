"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var assert = require("assert");
var domain = require("domain");

var async = require("async");
var assign = require("object-assign");

var _require = require("./shared");

var createOptions = _require.createOptions;
var createExperimentFactory = _require.createExperimentFactory;

var _require2 = require("./pkg-util");

var isFunction = _require2.isFunction;

var Trial = require("./trial");

function wrapAsyncExperiment(exp) {

  function experimentFunc() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var finish = args.pop();
    var ctx = exp.context || this;

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!exp.enabled.apply(exp, args)) {
      exp.control.apply(ctx, args.concat(finish));
      return;
    }

    var _createOptions = createOptions(exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, observations) {
      var trial = new Trial(exp, observations);
      exp.emitTrial(trial);
      finish.apply(undefined, _toConsumableArray(trial.control.cbArgs));
    });
  }

  assign(experimentFunc, exp.control);

  return experimentFunc;
}

function makeAsyncObservation(options, cb) {
  var fn = options.fn;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;

  var start = Date.now();
  var observation = { args: args, metadata: metadata };
  var d = undefined;

  function next() {
    if (d) d.exit();
    observation.duration = Date.now() - start;

    for (var _len2 = arguments.length, cbArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      cbArgs[_key2] = arguments[_key2];
    }

    var result = cbArgs[0];
    var error = cbArgs[1];

    if (error != null) observation.error = error;
    if (result != null) observation.result = result;

    observation.cbArgs = cbArgs;
    cb(null, observation);
  }

  if (which === "candidate") {
    d = domain.create();
    d.enter();
    d.on("error", function (e) {
      observation.error = e;
      next();
    });
  }

  fn.apply(ctx, args.concat(next));
}

module.exports = createExperimentFactory(wrapAsyncExperiment);