function noop () {}

function id (x) { return x; }

function alwaysTrue () { return true; }

function experimentContext (params) {

  Object.assign(params, {
    results: [],
    metadata: {},
    cleaner: id,
    reporter: noop,
    enabled: alwaysTrue
  });

  var _experiment = {
    use: function (fn) {
      params.control = fn;
      return _experiment;
    },

    try: function (fn) {
      params.candidate = fn;
      return _experiment;
    },

    metadata: function (obj) {
      assign(params.metadata, obj);
      return _experiment;
    },

    context: function (ctx) {
      params.context = ctx;
      return _experiment;
    },

    enabled: function (fn) {
      if (fn == null) {
        return typeof params.candidate === "function" && params.enabled();
      }
      params.enabled = fn;
      return _experiment;
    },

    report: function (fn) {
      params.reporter = fn;
      return _experiment;
    },

    clean: function (fn) {
      params.cleaner = fn;
      return _experiment;
    }
  };

  return _experiment;

}

module.exports = experimentContext;
