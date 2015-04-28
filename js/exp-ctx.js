function noop () {}

function id (x) { return x; }

function alwaysTrue () { return true; }

function experimentContext (props) {

  Object.assign(props, {
    results: [],
    metadata: {},
    cleaner: id,
    reporter: noop,
    enabled: alwaysTrue
  });

  var _experiment = {
    use: function (fn) {
      props.control = fn;
      return _experiment;
    },

    try: function (fn) {
      props.candidate = fn;
      return _experiment;
    },

    metadata: function (obj) {
      assign(props.metadata, obj);
      return _experiment;
    },

    context: function (ctx) {
      props.context = ctx;
      return _experiment;
    },

    report: function (fn) {
      props.reporter = fn;
      return _experiment;
    },

    clean: function (fn) {
      props.cleaner = fn;
      return _experiment;
    }
  };

  return _experiment;

}

module.exports = experimentContext;
