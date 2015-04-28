function id (x) {
  return x;
}

function noop () {}

function asyncExperiment (name, fn) {
  
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
}

module.exports = experiment;