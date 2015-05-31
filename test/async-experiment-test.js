require("babel/register");

let _ = require("lodash");
let expect = require("chai").expect;
let sinon = require("sinon");

let asyncExperiment = require("../src/async-experiment");
let syncExperiment = require("../src/sync-experiment");

let {omitNonDeterministic} = require("./helpers");

describe("asyncExperiment 'factory'", function () {

  describe("error handling", function () {

    function throwInCallback (cb) {
      setTimeout(function () {
        throw new Error("Thrown in callback");
        cb();
      }, 5)
    };

    function callbackWithError (cb) {
      setTimeout(function () {
        cb(new Error("Callback with error"));
      }, 5);
    };

    function callbackWithTrue (cb) {
      setTimeout(function () {
        cb(null, true);
      })
    }

    it("it handles thrown errors in candidate callbacks", function (done) {

      let trial, exp;

      let fn = asyncExperiment("test", function (ex) {
        ex.use(callbackWithTrue).try(throwInCallback);
        ex.report = (x) => trial = x
        exp = ex;
      });

      fn(function (err, result) {

        expect(err).to.not.exist;
        expect(result).to.equal(true);

        expect(trial.candidate.error).to.exist;
        expect(trial.candidate.error.message).to.equal("Thrown in callback");
        delete trial.candidate.error;

        expect(omitNonDeterministic(trial)).to.deep.equal({
          name: "test",
          control: {
            args: [],
            metadata: {},
            cbArgs: [ null, true ],
            result: true
          },
          candidate: {
            args: [],
            metadata: {},
            cbArgs: [],
          }
        });

        done();
      });
    });

    it("it handles candidate calling back with errors", function (done) {

      let trial, exp;

      let fn = asyncExperiment("test", function (ex) {
        ex.use(callbackWithTrue).try(callbackWithError)
        ex.report = (x) => trial = x
        exp = ex;
      });

      fn(function (err, result) {

        expect(err).to.not.exist;
        expect(result).to.equal(true);

        expect(omitNonDeterministic(trial)).to.deep.equal({
          name: "test",
          control: {
            args: [],
            metadata: {},
            cbArgs: [ null, true ],
            result: true
          },
          candidate: {
            args: [],
            metadata: {},
            error: new Error("Callback with error"),
            cbArgs: [ new Error("Callback with error") ],
          }
        });

        done();
      });
    });

  });

});


