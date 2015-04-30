"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");
var async = require("async");

var _require = require("./util");

var makeId = _require.makeId;
var shouldRun = _require.shouldRun;

var experimentProto = require("./experiment-proto");

function asyncExperimentFactory(name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert.equal(typeof init, "function", "second argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    assert.equal(typeof experiment.control, "function", "Can't run experiment without control");

    var finish = args.pop(),
        ctx = experiment._context || this,
        trial = { name: name, id: makeId() };

    if (!shouldRun(experiment, args)) {
      experiment.control.apply(ctx, args.concat(finish));
      return;
    }

    var options = { trial: trial, ctx: ctx, metadata: experiment._metadata };

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

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, _ref) {
      var _ref2 = _slicedToArray(_ref, 1);

      var args = _ref2[0];

      experiment._report(experiment._clean(trial));
      finish.apply(undefined, _toConsumableArray(args));
    });
  }

  return experiment;
}

function makeAsyncObservation(options, cb) {
  var start = Date.now();

  var fn = options.fn;
  var trial = options.trial;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;

  var observation = { args: args, metadata: metadata };

  if (which === "candidate") {
    // this wants a domain, but write a test to verify async throw crashes it first
    try {
      fn.apply(ctx, args.concat(next));
    } catch (e) {
      observation.error = e;
    }
  } else {
    fn.apply(ctx, args.concat(next));
  }

  function next() {
    for (var _len2 = arguments.length, cbArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      cbArgs[_key2] = arguments[_key2];
    }

    observation.cbArgs = cbArgs;
    observation.duration = Date.now() - start;
    trial[which] = observation;
    cb(null, cbArgs);
  }
}

module.exports = asyncExperimentFactory;