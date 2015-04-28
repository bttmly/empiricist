function noop () {}

function id (x) { return x; }

function alwaysTrue () { return true; }

function asyncExperiment (name, fn) {
  
  var control,
      candidate,
      context,
      results = [],
      metadata = {},
      cleaner = id,
      reporter = noop,
      enabled = alwaysTrue

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


  return function (...args) {

    var cb = args.pop();

    if (typeof candidate !== "function") {
      return control.apply(context, args.concat(cb));
    }

    var trial = {};

    function makeObservation (fn, context, args, options, cb) {
      var start = Date.now();
      var observation = {args, metadata, name};

      fn.apply(context, args.concat(next))
      
      function next (...cbArgs) {      
        observation.result = cbArgs;
        observation.duration = Date.now() - start;
        trial[options.which] = observation;

        // signal to callback this is the control
        if (options.which == "control") return cb(...cbArgs);
        
        // otherwise call back with no arguments
        cb();
      }
    }

    // called after control and candidate; once called twice,
    // reports out the trial result and invokes the original callback
    var done = (function () {
      var count = 2, // 1 control, 1 candidate
          controlArgs;

      return function (...args) {
        if (args.length) {
          controlArgs = args;
        }
        
        count -= 1;

        if (count === 0) {
          reporter(cleaner(trial));
          cb(...controlArgs);
        }
      };
    })();

    makeObservation(control, context, args, {which: "control"}, done);
    makeObservation(control, context, args, {which: "candidate"}, done);
  };
}

module.exports = experiment;