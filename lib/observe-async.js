"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var domain = require("domain");

var async = require("async");

var wrapObserver = require("./wrap-observer");

var _require = require("./pkg-util");

var isFunction = _require.isFunction;

function observeAsync(exp, params) {
  var finish = popActualCallbacks(params);
  async.map([params.control, params.candidate], makeAsyncObservation, function (_, observations) {
    exp.emitTrial.apply(exp, _toConsumableArray(observations));
    finish.apply(undefined, _toConsumableArray(observations[0].cbArgs));
  });
}

function popActualCallbacks(params) {
  var cb = params.control.args.pop();
  params.candidate.args.pop();
  if (!isFunction(cb)) throw new TypeError("Callback must be a function");
  return cb;
}

function makeAsyncObservation(options, cb) {
  var fn = options.fn;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;

  var start = Date.now();
  var observation = { args: args, metadata: metadata };
  var execute = fn.bind.apply(fn, [ctx].concat(_toConsumableArray(args.concat(next))));

  var d = undefined;

  function next() {
    if (d) d.exit();

    observation.duration = Date.now() - start;

    for (var _len = arguments.length, cbArgs = Array(_len), _key = 0; _key < _len; _key++) {
      cbArgs[_key] = arguments[_key];
    }

    var _observation$cbArgs = observation.cbArgs = cbArgs;

    var _observation$cbArgs2 = _slicedToArray(_observation$cbArgs, 2);

    var error = _observation$cbArgs2[0];
    var result = _observation$cbArgs2[1];

    if (error) observation.error = error;
    if (result) observation.result = result;

    cb(null, observation);
  }

  if (which === "candidate") {
    d = domain.create();
    d.on("error", function (e) {
      observation.error = e;
      next();
    });
    return d.run(execute);
  }

  execute();
}

module.exports = observeAsync;