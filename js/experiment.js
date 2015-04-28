function id (x) {
  return x;
}

function noop () {}

function experiment (name, fn) {
  
  var control,
      candidate,
      context,
      results = [],
      metadata = {},
      cleaner = id,
      reporter = noop

  var _experiment = {
    use: function (fn) {
      control = fn;
      return _experiment;
    },

    try: function (fn) {
      candidate = fn;
      return _experiment;
    },

    metadata: function (obj) {
      assign(metadata, obj);
      return _experiment;
    },

    context: function (ctx) {
      context = ctx;
      return _experiment;
    },

    report: function (fn) {
      reporter = fn;
      return _experiment;
    },

    clean: function (fn) {
      cleaner = fn;
      return _experiment;
    }
  };

  fn.call(_experiment, _experiment);

  function makeObservation (fn, context, args) {
    var start = Date.now();
    var observation = {args, metadata, name};
    observation.result = fn.apply(context, args);
    observation.duration = Date.now() - start;
    return observation;
  }

  return function (...args) {
    if (typeof control !== "function") {
      throw new Error("Can't run experiment without control function.");
    }

    if (typeof candidate !== "function") {
      return control.apply(context, args);
    }

    var trial = {
      control: makeObservation(control, context, args),
      candidate: makeObservation(control, context, args)
    };

    reporter(clean(trial));

    return trial.control.result;
  }
}

module.exports = experiment;