// Generated by CoffeeScript 1.9.2
var AsyncControl, AsyncObservation,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

AsyncObservation = require("./").AsyncObservation;

AsyncControl = (function(superClass) {
  extend(AsyncControl, superClass);

  function AsyncControl(_experiment, fn, context, args) {
    this._experiment = _experiment;
    AsyncControl.__super__.constructor.call(this, fn, context, args);
  }

  return AsyncControl;

})(AsyncObservation);

module.exports = AsyncControl;