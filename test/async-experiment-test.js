require("babel/register");

let _ = require("lodash");
let expect = require("chai").expect;
let sinon = require("sinon");

let asyncExperiment = require("../src/async-experiment");
let syncExperiment = require("../src/sync-experiment");

let {omitNonDeterministic} = require("./helpers");

function noop () {}

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

      let trials = [];
      let exp;

      let fn = asyncExperiment("test", function (ex) {
        ex.use(callbackWithTrue)
          .try(throwInCallback)
          .report((x) => trials.push(x));
        exp = ex;
      });

      fn(function (_, x) {

        expect(x).to.equal(true);
        expect(trials[0].candidate.threw.message).to.equal("Thrown in callback");
        delete trials[0].candidate.threw;

        expect(omitNonDeterministic(trials[0])).to.deep.equal({
          name: "test",
          control: {
            args: [],
            metadata: {},
            cbArgs: [ null, true ]
          },
          candidate: {
            args: [],
            metadata: {},
            cbArgs: []
          }
        });

        done();
      });
    });

    it("it handles candidate calling back with errors", function (done) {

      let trials = [];
      let exp;

      let fn = asyncExperiment("test", function (ex) {
        ex.use(callbackWithTrue)
          .try(callbackWithError)
          .report((x) => trials.push(x));

        exp = ex;
      });

      fn(function (_, x) {
        expect(x).to.equal(true);

        expect(omitNonDeterministic(trials[0])).to.deep.equal({
          name: "test",
          control: {
            args: [],
            metadata: {},
            cbArgs: [ null, true ]
          },
          candidate: {
            args: [],
            metadata: {},
            cbArgs: [ new Error("Callback with error") ],
          }
        });

        done();
      });
    });

  });

  // the tests here only demonstrate that the instance methods of an async experiment
  // are exactly the same as those of a regular experiment. Thus the tests in
  // experiment-test.js hold true for async experiment instances.
  describe("methods", function () {

    let asyncInner, syncInner

    syncExperiment("", function (e) { e.use(noop); syncInner = e });
    asyncExperiment("", function (e) { e.use(noop); asyncInner = e });

    it("asyncExperiment#use === experiment#use", function () {
      expect(asyncInner.use).to.equal(syncInner.use)
    });

    it("asyncExperiment#try === experiment#try", function () {
      expect(asyncInner.try).to.equal(syncInner.try)
    });

    it("asyncExperiment#context === experiment#context", function () {
      expect(asyncInner.context).to.equal(syncInner.context)
    });

    it("asyncExperiment#report === experiment#report", function () {
      expect(asyncInner.report).to.equal(syncInner.report)
    });

    it("asyncExperiment#clean === experiment#clean", function () {
      expect(asyncInner.clean).to.equal(syncInner.clean)
    });

    it("asyncExperiment#enabled === experiment#enabled", function () {
      expect(asyncInner.enabled).to.equal(syncInner.enabled)
    });
  });

});


