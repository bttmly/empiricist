require("babel/register");

var _ = require("lodash");
var expect = require("chai").expect;
var sinon = require("sinon");

var asyncExperiment = require("../src/async-experiment");

// function stripRandomFields (obj) {
//   var ret = _.omit(obj, "id")
//   ret.control = _.omit(ret.control, "duration");
//   ret.candidate = _.omit(ret.candidate, "duration");
//   return ret;
// }

describe("asyncExperiment 'factory'", () => {

  describe("error handling", () => {

    var throwInCallback = (cb) => {
      setTimeout(() => {
        throw new Error("Thrown in callback");
        cb();
      }, 5)
    };

    var callbackWithError = (cb) => {
      setTimeout(() => {
        cb(new Error("Callback with error"));
      }, 5);
    };

    var callbackWithTrue = (cb) => {
      setTimeout(() => {
        cb(null, true);
      })
    }

    it("it handles thrown errors in candidate callbacks", (done) => {

      var trials = [];

      var exp = asyncExperiment("test", function (e) {
        e.use(callbackWithTrue);
        e.try(throwInCallback);
        e.report((args) => trials.push(args));
      });

      exp((_, x) => {
        expect(x).to.equal(true);
        var [t] = trials;
        expect(t.candidate.error).to.exist;
        expect(t.candidate.error.message).to.equal("Thrown in callback");
        expect(t.candidate.cbArgs.length).to.equal(0);
        done();
      });
    });

    it("it handles candidate calling back with errors", (done) => {

      var trials = [];

      var exp = asyncExperiment("test", function (e) {
        e.use(callbackWithTrue);
        e.try(callbackWithError);
        e.report((args) => trials.push(args));
      });

      exp((_, x) => {
        expect(x).to.equal(true);
        var [t] = trials;
        expect(t.candidate.error).to.not.exist;
        expect(t.candidate.cbArgs.length).to.equal(1);
        expect(t.candidate.cbArgs[0].message).to.equal("Callback with error");
        done();
      });
    });

  });

});
