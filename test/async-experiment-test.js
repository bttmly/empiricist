require("babel/register");

let _ = require("lodash");
let expect = require("chai").expect;
let sinon = require("sinon");

let asyncExperiment = require("../src/async-experiment");
let syncExperiment = require("../src/sync-experiment");
let Experiment = require("../src/experiment");

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

});


