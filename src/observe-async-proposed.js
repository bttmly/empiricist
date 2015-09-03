const domain = require("domain");

const async = require("async");

const wrapObserver = require("./wrap-observer");
const {isFunction} = require("./pkg-util");

function observeAsync (exp, {control, candidate}) {
  const finish = popActualCallbacks({control, candidate});

  const d1 = domain.create();
  const d2 = domain.create();

  function final (...args) {
    console.log("Final called!");
    try {
      finish(...args);
    } catch (e) {
      console.log("SYNC THROWN IN FINISHING CALLBACK");
      throw e;
    }
  }

  var tasks = [
    function runControl (cb) {
      d1.enter();
      makeAsyncObservation(d1, control, function (obs) {
        cb(null, obs)
      });
    },
    function runCandidate (cb) {
      d2.enter()
      makeAsyncObservation(d2, candidate, function (obs) {
        cb(null, obs);
      });
    },
  ]

  async.series(tasks, function (_, observations) {
    console.log("EXITING DOMAINS...");
    d2.exit();
    d1.exit();
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

function makeAsyncObservation (d, options, cb) {
  const {fn, ctx, args, metadata, which} = options;
  const start = Date.now();
  const observation = {args, metadata};

  d.on("error", (e) => {
    console.log("CAUGHT BY", which, e);
    observation.error = e;
    next();
  });

  fn.call(ctx, ...args, next);
  
  function next (...cbArgs) {
    observation.duration = Date.now() - start;
    const [error, result] = observation.cbArgs = cbArgs;

    if (error) observation.error = error;
    if (result) observation.result = result;

    cb(observation);
  }
};


module.exports = observeAsync;

