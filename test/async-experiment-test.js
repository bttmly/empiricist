require("babel/register");

let _ = require("lodash");
let expect = require("must");
let sinon = require("sinon");

let {
  asyncExperiment,
  syncExperiment,
} = require("../lib/");

let {omitNonDeterministic} = require("./helpers");

describe("asyncExperiment 'factory'", function () {

  describe("error handling", function () {

    const obj = {key: "value"};

    function throwInCallback (cb) {
      setTimeout(function () {
        throw new Error("Thrown in callback");
      }, 5);
    }

    function callbackWithError (cb) {
      setTimeout(function () {
        cb(new Error("Callback with error"));
      }, 5);
    }

    function callbackWithObj (cb) {
      setTimeout(function () {
        cb(null, obj);
      });
    }

    it("it handles thrown errors in candidate callbacks", function (done) {

      let trial, exp;

      let fn = asyncExperiment("test", function (ex) {
        ex.use(callbackWithObj).try(throwInCallback);
        ex.on("trial", (t) => trial = t);
        exp = ex;
      });

      fn(function (err, result) {

        expect(err).to.not.exist();
        expect(result).to.equal(obj);

        delete trial.candidate.error.domain;
        delete trial.candidate.error.domainThrown;

        expect(omitNonDeterministic(trial)).to.eql({
          name: "test",
          control: {
            args: [],
            metadata: {},
            cbArgs: [null, obj],
            result: obj
          },
          candidate: {
            args: [],
            metadata: {},
            cbArgs: [],
            error: new Error("Thrown in callback")
          }
        });

        done();
      });
    });

    it("it handles candidate calling back with errors", function (done) {

      let trial, exp;

      let fn = asyncExperiment("test", function (ex) {
        ex.use(callbackWithObj).try(callbackWithError);
        ex.on("trial", (t) => trial = t);
        exp = ex;
      });

      fn(function (err, result) {

        expect(err).to.not.exist();
        expect(result).to.equal(obj);

        expect(omitNonDeterministic(trial)).to.eql({
          name: "test",
          control: {
            args: [],
            metadata: {},
            cbArgs: [null, obj],
            result: obj
          },
          candidate: {
            args: [],
            metadata: {},
            error: new Error("Callback with error"),
            cbArgs: [new Error("Callback with error")]
          }
        });

        done();
      });
    });

  });

});


