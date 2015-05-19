let assert = require("assert");

let assign = require("object-assign");

let Experiment = require("./experiment-proto");

let {
  isFunction,
  isString,
  shouldRun,
  makeId
} = require("./util");

function experimentFactory (name, executor) {

  assert(isString(name), `'name' argument must be a string, found ${name}`);
  assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

  // the experiment object is private, it is only revealed to the caller inside the executor function
  var exp = new Experiment();
  executor.call(exp, exp);

  assert(isFunction(exp.control), "Experiment's control function must be set with `e.use()`");

  var result = function (...args) {

    let ctx = exp._context || this;

    if (!shouldRun(exp, args))
      return exp.control.apply(ctx, args);

    let options = {ctx, metadata: exp._metadata};

    let controlOptions = assign({
      fn: exp.control,
      which: "control",
      args: args
    }, options);

    let candidateArgs = exp._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    let candidateOptions = assign({
      fn: exp.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    let trial = {
      name: name,
      id: makeId(),
      control: makeObservation(controlOptions),
      candidate: makeObservation(candidateOptions)
    };

    exp._report(exp._clean(trial));

    return trial.control.returned;
  };

  // copy own properties from control over to the returned function
  assign(result, exp.control);

  return result;
}

function makeObservation (options) {
  let {args, fn, which, metadata, ctx} = options

  let start = Date.now(),
      observation = {args, metadata, type: which};

  if (which === "candidate") {
    try {
      observation.returned = fn.apply(ctx, args);
    } catch (e) {
      observation.returned = null;
      observation.threw = e;
    }
  } else {
    observation.returned = fn.apply(ctx, args);
  }

  observation.duration = Date.now() - start;
  return observation;
}

module.exports = experimentFactory;
