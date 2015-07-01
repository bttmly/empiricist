const domain = require("domain");

const async = require("async");

const wrapObserver = require("./wrap-observer");
const {isFunction} = require("./pkg-util");

function observeAsyncExperiment (exp, params) {
  const finish = popActualCallbacks(params);
  async.map([params.control, params.candidate], makeAsyncObservation, function (_, observations) {
    exp.emitTrial(...observations);
    finish(...observations[0].cbArgs);
  });
}

function popActualCallbacks (params) {
  const cb = params.control.args.pop();
  params.candidate.args.pop();
  if (!isFunction(cb)) throw new TypeError("Callback must be a function");
  return cb;
}

function makeAsyncObservation (options, cb) {
  const {fn, ctx, args, metadata, which} = options;
  const start = Date.now();
  const observation = {args, metadata};
  let d;

  function next (...cbArgs) {
    if (d) d.exit();

    observation.duration = Date.now() - start;
    const [error, result] = observation.cbArgs = cbArgs;

    if (error) observation.error = error;
    if (result) observation.result = result;

    cb(null, observation);
  }

  const execute = fn.bind(ctx, ...args.concat(next));

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

module.exports = wrapObserver(observeAsyncExperiment);
module.exports.observer = observeAsyncExperiment;
