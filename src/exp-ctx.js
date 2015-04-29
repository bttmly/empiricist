function noop () {}

function id (x) { return x; }

function alwaysTrue () { return true; }

var experimentProto = {
  use: function (fn) {
    this.control = fn;
    return this;
  },

  try: function (fn) {
    this.candidate = fn;
    return this;
  },

  metadata: function (obj) {
    assign(this.metadata, obj);
    return this;
  },

  context: function (ctx) {
    this.context = ctx;
    return this;
  },

  enabled: function (fn) {
    if (fn == null) {
      return typeof this.candidate === "function" && this.enabler();
    }
    this.enabler = fn;
    return this;
  },

  report: function (fn) {
    this.reporter = fn;
    return this;
  },

  clean: function (fn) {
    this.cleaner = fn;
    return this;
  }
};


function makeExperiment () {
  return Object.assign({
    results: [],
    metadata: {},
    cleaner: id,
    reporter: noop,
    enabler: alwaysTrue
  }, experimentProto);
}

module.exports = makeExperiment;
