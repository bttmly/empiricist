"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var assert = require("assert");
var domain = require("domain");

var async = require("async");
var assign = require("object-assign");

var _require = require("./shared");

var createParams = _require.createParams;
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
    var ctx = exp.contextWasSet ? exp.context : this;

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!exp.enabled.apply(exp, args)) {
      exp.control.apply(ctx, args.concat(finish));
      return;
    }

    var _createParams = createParams(exp, args, ctx);

    var controlParams = _createParams.controlParams;
    var candidateParams = _createParams.candidateParams;

    async.map([controlParams, candidateParams], makeAsyncObservation, function (_, observations) {
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

    var _observation$cbArgs = observation.cbArgs = cbArgs;

    var _observation$cbArgs2 = _slicedToArray(_observation$cbArgs, 2);

    var error = _observation$cbArgs2[0];
    var result = _observation$cbArgs2[1];

    if (error) observation.error = error;
    if (result) observation.result = result;

    cb(null, observation);
  }

  function go() {
    fn.apply(ctx, args.concat(next));
  }

  if (which === "candidate") {
    d = domain.create();
    d.on("error", function (e) {
      observation.error = e;
      next();
    });
    return d.run(go);
  }

  go();
}

module.exports = createExperimentFactory(wrapAsyncExperiment);