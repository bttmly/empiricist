require("babel/register");

var _ = require("lodash");
var expect = require("chai").expect;
var sinon = require("sinon");

var asyncExperiment = require("../src/async-experiment");

var {omitNonDeterministic} = require("./helpers");

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

      var exp = asyncExperiment("test", (e) => {
        e.use(callbackWithTrue);
        e.try(throwInCallback);
        e.report((x) => trials.push(x));
      });

      exp((_, x) => {
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

    it("it handles candidate calling back with errors", (done) => {

      var trials = [];

      var exp = asyncExperiment("test", (e) => {
        e.use(callbackWithTrue);
        e.try(callbackWithError);
        e.report((x) => trials.push(x));
      });

      exp((_, x) => {
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
