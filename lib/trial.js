"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _require = require("./pkg-util");

var makeId = _require.makeId;

function validateObservations() {}

module.exports = (function () {
  function Trial(exp, obs) {
    _classCallCheck(this, Trial);

    validateObservations(obs);
    this.name = exp.name;
    this.id = makeId();

    var _obs = _slicedToArray(obs, 2);

    this.control = _obs[0];
    this.candidate = _obs[1];
  }

  _createClass(Trial, null, [{
    key: "ofExperiment",
    value: function ofExperiment(exp) {
      var _this = this;

      return function (obs) {
        return new _this(exp, obs);
      };
    }
  }]);

  return Trial;
})();