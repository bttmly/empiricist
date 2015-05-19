require("babel/register");

let _ = require("lodash");
let expect = require("chai").expect;
let sinon = require("sinon");

let asyncExperiment = require("../src/async-experiment");
let experiment = require("../src/experiment");

let {omitNonDeterministic} = require("./helpers");

xdescribe("asyncExperiment 'factory'", function () {

  xdescribe("error handling", function () {

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

      let exp = asyncExperiment("test")
        .use(callbackWithTrue)
        .try(throwInCallback)
        .report((x) => trials.push(x));

      exp(function (_, x) {
        expect(x).to.equal(true);

        expect(trials[0].candidate.error.message).to.equal("Thrown in callback");
        delete trials[0].candidate.error;

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

      let exp = asyncExperiment("test")
        .use(callbackWithTrue)
        .try(callbackWithError)
        .report((x) => trials.push(x));

      exp(function (_, x) {
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
  xdescribe("methods", function () {

    let exp = experiment("", function () {});
    let asyncExp = asyncExperiment("", function () {});

    it("asyncExperiment#use === experiment#use", function () {
      expect(asyncExp.use).to.equal(exp.use)
    });

    it("asyncExperiment#try === experiment#try", function () {
      expect(asyncExp.try).to.equal(exp.try)
    });

    it("asyncExperiment#context === experiment#context", function () {
      expect(asyncExp.context).to.equal(exp.context)
    });

    it("asyncExperiment#report === experiment#report", function () {
      expect(asyncExp.report).to.equal(exp.report)
    });

    it("asyncExperiment#clean === experiment#clean", function () {
      expect(asyncExp.clean).to.equal(exp.clean)
    });

    it("asyncExperiment#enabled === experiment#enabled", function () {
      expect(asyncExp.enabled).to.equal(exp.enabled)
    });
  });

});


