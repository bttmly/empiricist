const domain = require("domain");

const async = require("async");

const wrapObserver = require("./wrap-observer");
const {isFunction} = require("./pkg-util");

function observeAsync (exp, {control, candidate}) {
  const finish = popActualCallbacks({control, candidate});
  async.map([control, candidate], makeAsyncObservation, function (_, observations) {
    exp.emitTrial(...observations);
    finish(...observations[0].cbArgs);
  });
}

function popActualCallbacks ({control, candidate}) {
  const cb = control.args.pop();
  candidate.args.pop();
  if (!isFunction(cb)) throw new TypeError("Callback must be a function");
  return cb;
}

function makeAsyncObservation (options, cb) {
  const {fn, ctx, args, metadata, which} = options;
  const start = Date.now();
  const observation = {args, metadata};
  let d = domain.create();

  d.on("error", (e) => {
    observation.error = e;
    next();
  });

  d.run(fn.bind(ctx, ...args, next));
  
  function next (...cbArgs) {
    d.exit();

    observation.duration = Date.now() - start;
    const [error, result] = observation.cbArgs = cbArgs;

    if (error) observation.error = error;
    if (result) observation.result = result;

    cb(null, observation);
  }
}

module.exports = observeAsync;

