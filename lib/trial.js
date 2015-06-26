"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./pkg-util");

var makeId = _require.makeId;

function validateObservations() {}

module.exports = function Trial(exp, obs) {
  _classCallCheck(this, Trial);

  validateObservations(obs);
  this.name = exp.name;
  this.id = makeId();
  var _obs = obs;

  var _obs2 = _slicedToArray(_obs, 2);

  this.control = _obs2[0];
  this.candidate = _obs2[1];
};