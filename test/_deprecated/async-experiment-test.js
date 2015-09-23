require("babel/register");

let _ = require("lodash");
let expect = require("must");
let sinon = require("sinon");

// let {
//   asyncExperiment,
//   syncExperiment,
// } = require("../lib/");

let wrapObserver = require("../lib/wrap-observer");
let Experiment = require("../lib/experiment");
let observeAsync = require("../lib/observe-async");
// let observeAsync = require("../lib/observe-async-proposed");

let asyncExperiment = wrapObserver(observeAsync, Experiment);

// for async experiments, lets the domain exit before doing anything
let {omitNonDeterministic} = require("./helpers");

describe("asyncExperiment 'factory'", function () {

  describe("error handling", function () {

    const DURATION = 5;
    const obj = {key: "value"};
    const throwInCallback = cb => setTimeout(() => { throw new Error("Thrown in callback")}, DURATION);
    const callbackWithError = cb => setTimeout(() => cb(new Error("Callback with error")), DURATION);
    const callbackWithObj = cb => setTimeout(() => cb(null, obj), DURATION);

    it("it handles thrown errors in candidate callbacks", function (done) {

      let trial, exp;

      let fn = asyncExperiment("test", function (ex) {
        (exp = ex)
          .use(callbackWithObj)
          .try(throwInCallback)
          .on("trial", (t) => trial = t);
      });

      function expectations (err, result) {
        expect(err).to.not.exist();
        expect(result).to.equal(obj);

        delete trial.candidate.error.domain;
        delete trial.candidate.error.domainThrown;

        let e = new Error("Thrown in callback");

        expect(omitNonDeterministic(trial)).to.eql({
          name: "test",
          metadata: {},
          control: {
            args: [],
            cbArgs: [null, obj],
            result: obj,
          },
          candidate: {
            args: [],
            cbArgs: [e],
            error: e,
          },
        });

        done();
      }

      fn(expectations);
    });

    it("it handles candidate calling back with errors", function (done) {

      let trial, exp;

      let fn = asyncExperiment("test", function (ex) {
        ex.use(callbackWithObj).try(callbackWithError);
        ex.on("trial", (t) => trial = t);
        exp = ex;
      });

      function expectations (err, result) {
        expect(err).to.not.exist();
        expect(result).to.equal(obj);

        let e = new Error("Callback with error");

        expect(omitNonDeterministic(trial)).to.eql({
          name: "test",
          metadata: {},
          control: {
            args: [],
            cbArgs: [null, obj],
            result: obj,
          },
          candidate: {
            args: [],
            error: e,
            cbArgs: [e],
          },
        });

        done();
      }

      fn(expectations);

      // fn(defer(expectations))
    });

  });

});


