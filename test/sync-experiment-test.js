require("babel/register");

let _ = require("lodash");
// let expect = require("chai").expect;

let expect = require("must");
let sinon = require("sinon");

let syncExperiment = require("../lib/sync-experiment");
let Experiment = require("../lib/experiment");


let {
  omitNonDeterministic,
  spyEvent
} = require("./helpers");

function noop () {}
function id (x) { return x; }
function no () { return false; }
function yes () { return true; }
function add (a, b) { return a + b; }
function multiply (a, b) { return a * b; }

// minimum amount of work required to initialize an experiment
function executor (e) { e.use(noop); }

describe("syncExperiment 'constructor'", function () {

  it("takes a `name` string as it's required first argument", function () {
    expect(() => syncExperiment()).to.throw(/argument must be a string/i);
  });

  it("takes an `executor` function as it's required second argument", function () {
    expect(() => syncExperiment("")).to.throw(/argument must be a function/i);
    expect(() => syncExperiment("", "")).to.throw(/argument must be a function/i);
  });

  it("returns a function", function () {
    expect(typeof syncExperiment("", executor)).to.equal("function");
  });

  it("copies own enumerable properties from the control to the experiment", function () {

    function f () {}

    var a = {}, b = {};

    Object.defineProperties(f, {
      "a": {enumerable: true, value: a},
      "b": {value: b}
    });

    var exp = syncExperiment("test", function (e) {
      e.use(f);
    });

    expect(exp.a).to.equal(a);
    expect(exp.hasOwnProperty("b")).to.equal(false);

  });

  describe("executor function invocation", function () {

    it("executor's `this` context and executor's argument are the same object", function () {
      let ctx = {};
      let arg = {};

     syncExperiment("test", function (e) {
        e.use(noop);
        ctx = this;
        arg = e;
      });

      expect(arg).to.equal(ctx);
    });

    it("the argument/context is an instance of Experiment", function () {
      let exp;

      syncExperiment("test", function (e) {
        e.use(noop);
        exp = e;
      });

      expect(exp instanceof Experiment).to.equal(true);
    });

  });

});




describe("invocation of Experiment instance methods", function () {

  describe("#use", function () {
    let exp;

    it("sets the experiment's control behavior", function () {
      let fn = syncExperiment("test", (e) => {
        exp = e.use(yes);
      });
      expect(exp.control).to.equal(yes);
      expect(fn()).to.equal(yes());
    });

    it("an experiment whose control behavior throws an error will throw that error", function () {
      let fn = syncExperiment("test", function (e) {
        e.use(function () {
          throw new Error("Kaboom!");
        });
      });
      expect(fn).to.throw(/kaboom/i);
    });
  });




  describe("#try", function () {

    let ySpy, nSpy, exp, fn;

    beforeEach(() => {
      ySpy = sinon.spy(yes);
      nSpy = sinon.spy(no);
      fn = syncExperiment("test", (e) => {
        exp = e.use(ySpy).try(nSpy);
      });
    });

    it("sets the experiment's control behavior", function () {
      expect(exp.candidate).to.equal(nSpy);
      expect(fn()).to.equal(ySpy());
    });

    it("it is invoked when the experiment is called", function () {
      fn();
      expect(ySpy.callCount).to.equal(1);
      expect(nSpy.callCount).to.equal(1);
    });

    it("an experiment whose candidate behavior throws an error will not throw", function () {

      fn = syncExperiment("test", (e) => {
        e.use(yes);
        e.try(() => { throw new Error("Kaboom!"); });
        exp = e;
      });

      expect(fn()).to.equal(true);
    });

  });




  describe("#context", function () {

    it("sets the experiment's `this` context", function () {
      let ctx;
      let obj = {};
      let fn = syncExperiment("test", (e) => {
        e.use(function () { ctx = this; });
        e.setContext(obj);
      });

      fn();
      expect(ctx).to.equal(obj);
    });

    it("overrides calling context if set", function () {
      let ctx;
      let obj1 = {};
      let obj2 = {};

      let fn = syncExperiment("test", (e) => {
        e.use(function () { ctx = this; }).setContext(obj1);
      });

      fn.call(obj2);
      expect(ctx).to.equal(obj1);

    });

    it("defers to the calling context if unset", function () {
      let ctx;
      let obj = {};

      let fn = syncExperiment("test", (e) => {
        e.use(function () { ctx = this; });
      });

      fn.call(obj);
      expect(ctx).to.equal(obj);

    });

    it("works properly for null", function () {
      let ctx;
      let obj = {};

      let fn = syncExperiment("test", (e) => {
        e.use(function () { ctx = this; }).setContext(null);
      });

      fn.call(obj);
      expect(ctx).to.equal(null);
    });

  });

  describe("#metadata", function () {

    it("merges the argument into the experiment's metadata", function () {
      let trial;

      syncExperiment("test", function (e) {
        e.use(add).try(noop);
        e.setMetadata({a: 1});
        e.setMetadata({a: 2, b: 3});
        e.on("trial", (t) => trial = t);
      })();

      expect(trial).to.exist();
      expect(trial.candidate.metadata.a).to.equal(2);
      expect(trial.control.metadata.a).to.equal(2);
    });
  });

  describe("#enabled", function () {
    it("is run to see if the candidate should be executed", function () {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(no);

      let fn = syncExperiment("test", (ex) => {
        ex.use(add).try(candidate);
        ex.enabled = enabler;
      });

      fn(2, 3);

      expect(enabler.callCount).to.equal(1);
      expect(candidate.callCount).to.equal(0);

    });

    it("is passed the calling arguments", function () {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(yes);

      let fn = syncExperiment("test", (ex) => {
        ex.use(add).try(candidate);
        ex.enabled = enabler;
      });

      fn(2, 3);

      expect(enabler.args[0]).to.eql([2, 3]);
    });
  });



  describe("#beforeRun", function () {
    let sid, exp, fn;

    beforeEach(() => {
      sid = sinon.spy(id);
      fn = syncExperiment("test", (e) => {
        e.use(id);
        e.beforeRun = sid;
        exp = e;
      });
    });


    it("runs only if the candidate is going to run (no candidate)", function () {
      fn([1, 2, 3]);
      expect(sid.callCount).to.equal(0);
    });

    it("runs only if the candidate is going to run (candidate disabled)", function () {
      let candidate = sinon.spy(noop);
      exp.enabled = no;
      exp.try(candidate);

      fn([1, 2, 3]);
      expect(candidate.callCount).to.equal(0);
      expect(sid.callCount).to.equal(0);
    });

    it("receives the arguments as an array", function () {
      let o = {};
      exp.try(noop);

      fn(o);
      expect(Array.isArray(sid.args[0][0])).to.equal(true);
      expect(sid.args[0][0][0]).to.equal(o);
    });

    it("defaults to returning the arguments array", function () {
      let trial, o = {};
      exp.try(noop).on("trial", t => trial = t);
      fn(o);

      expect(trial.control.args[0]).to.equal(o);
      expect(trial.candidate.args[0]).to.equal(o);
    });

    it("the candidate is called with the result of beforeRun", function () {
      let o = {};

      before = sinon.spy((args) => {
        return args.map(_.clone);
      });

      let candidate = sinon.spy(id);
      let control = sinon.spy(id);

      fn = syncExperiment("test", (ex) => {
        ex.use(control).try(candidate);
        ex.beforeRun = before;
      });

      fn(o);
      expect(before.returnValues[0][0]).to.equal(candidate.args[0][0]);
      expect(control.args[0][0]).to.equal(o);
      expect(candidate.args[0][0]).to.not.equal(o);
    });

    it("if the beforeRun function doesn't return an array, an exception is thrown", function () {
      exp.beforeRun = noop;
      exp.try(noop);
      expect(fn).to.throw(/must return an array/i);
    });

  });

  describe("events", function () {

    describe("skip", function () {
      it("is emitted when an experiment is skip (candidate is not run)", function () {
        let stub;

        syncExperiment("test", (e) => {
          stub = sinon.stub();
          e.use(noop).on("skip", stub);
        })();

        expect(stub.callCount).to.equal(1);
      });

      it("not emitted when an experiemnt runs", function () {
        let stub;

        syncExperiment("test", (e) => {
          stub = sinon.stub();
          e.use(noop).try(noop).on("skip", stub);
        })();

        expect(stub.callCount).to.equal(0);
      });
    });

    describe("trial", function () {
      xit("is emitted whenever an experiment runs", function () {

      });
    });

    describe("match", function () {
      xit("is emitted whenever a trial satisfies the experiment's match method", function () {

      });
    });

    describe("mismatch", function () {
      xit("is emitted whenever a trial does not satisfy the experiment's match method", function () {

      });
    });

  });
});





