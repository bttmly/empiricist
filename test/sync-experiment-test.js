require("babel/register");

let _ = require("lodash");
let expect = require("chai").expect;
let sinon = require("sinon");

let syncExperiment = require("../lib/sync-experiment");
let Experiment = require("../lib/experiment");


let {omitNonDeterministic} = require("./helpers");

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

  it("it supports wrapping constructors", function () {

    class Coffee {
      constructor () {
        this.hot = true;
        this.caffeine = 5;
      }
    }

    class Tea {
      constructor () {
        this.hot = true;
        this.caffeine = 1;
      }
    }

    var BeverageExperiment = syncExperiment("coffee", function (e) {
      e.use(Coffee).try(Tea);
    });

    var bev = new BeverageExperiment();

    expect(bev.hot).to.equal(true);
    expect(bev.caffeine).to.equal(5);
    expect(bev instanceof Coffee).to.equal(true);

    // You should avoid ever exposing both the underlying control function and the
    // experiment function. However, in the case with `new`, the returned object
    // is actually constructed by the control function, and so the control function
    // can be accessed through instance.constructor or reflection (Object.getPrototypeOf)
    //
    // We use a wonky trick to ensure that objects returned by new ExperimentalFn()
    // show up as instanceof ExperimentalFn

    expect(bev instanceof BeverageExperiment).to.equal(true);
  });

  describe("executor function invocation", function () {

    it("executor's `this` context and executor's argument are the same object", function () {
      let ctx = {};
      let arg = {};

      let fn = syncExperiment("test", function (e) {
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




describe("instance methods", function () {

  describe("#use", function () {
    let exp;

    it("sets the experiment's control behavior", function () {
      let fn = syncExperiment("test", (e) => {
        e.use(yes)
        exp = e;
      });
      expect(exp.control).to.equal(yes);
      expect(fn()).to.equal(yes());
    });

    it("an experiment whose control behavior throws an error will throw that error", function () {
      let fn = syncExperiment("test", function (e) {
        e.use(() => { throw new Error("Kaboom!") })
      });
      expect(fn).to.throw(/kaboom/i);
    });
  });




  describe("#try", function () {

    let ySpy, nSpy, exp, fn;

    beforeEach(() => {
      ySpy  = sinon.spy(yes)
      nSpy = sinon.spy(no)
      fn = syncExperiment("test", (e) => {
        e.use(ySpy)
        e.try(nSpy)
        exp = e;
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

      let fn = syncExperiment("test", (e) => {
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
        e.context = obj;
      });

      fn();
      expect(ctx).to.equal(obj);
    });

    it("overrides calling context if set", function () {
      let ctx;
      let obj1 = {};
      let obj2 = {};

      let fn = syncExperiment("test", (e) => {
        e.use(function () { ctx = this; });
        e.context = obj1;
      });

      fn.call(obj2)
      expect(ctx).to.equal(obj1);

    });

    it("defers to the calling context if unset", function () {
      let ctx;
      let obj = {};

      let fn = syncExperiment("test", (e) => {
        e.use(function () { ctx = this; });
      });

      fn.call(obj)
      expect(ctx).to.equal(obj);

    });

  });

  xdescribe("#metadata", function () {

    it("merges the argument into the experiment's metadata", function () {
      let m;
      syncExperiment("test", function (e) {
        m = e._metadata;
        e.metadata({a: 1});
        e.use(noop);
      });

      expect(m.a).to.equal(1);
    });
  });


  describe("#report", function () {
    let trials = [];

    let spy = sinon.spy((x) => trials.push(x))

    it("sets the experiment's trial reporter", function () {

      let fn = syncExperiment("test", (ex) => {
        ex.use(add).try(multiply);
        ex.report = spy;
      });

      fn(2, 3);

      expect(spy.calledOnce).to.equal(true);
      expect(trials.length).to.equal(1);

      expect(omitNonDeterministic(trials[0])).to.deep.equal({
        name: "test",
        control: {
          type: "control",
          args: [ 2, 3 ],
          metadata: {},
          result: 5,
        },
        candidate: {
          type: "candidate",
          args: [ 2, 3 ],
          metadata: {},
          result: 6,
        }
      });
    });
  });




  describe("#clean", function () {
    it("is applied to a trial object before it gets to the reporter", function () {
      let trials = [];
      let reporter = sinon.spy((arg) => trials.push(arg));

      let cleaner = sinon.spy(function (result) {
        return {
          name: result.name,
          control: result.control.result,
          candidate: result.candidate.result
        };
      });

      let fn = syncExperiment("test", (ex) => {
        ex.use(add).try(multiply)
        ex.report = reporter;
        ex.clean = cleaner;
      });

      fn(2, 3);

      expect(reporter.callCount).to.equal(1);
      expect(cleaner.callCount).to.equal(1);
      expect(trials.length).to.equal(1);

      expect(omitNonDeterministic(cleaner.args[0][0])).to.deep.equal({
        name: "test",
        control: {
          type: "control",
          args: [ 2, 3 ],
          metadata: {},
          result: 5,
        },
        candidate: {
          type: "candidate",
          args: [ 2, 3 ],
          metadata: {},
          result: 6,
        }
      });

      expect(reporter.args[0][0]).to.deep.equal({
        name: "test",
        control: 5,
        candidate: 6
      });

    });
  });




  describe("#enabled", function () {
    it("is run to see if the candidate should be executed", function () {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(no);

      let fn = syncExperiment("test", (ex) => {
        ex.use(add).try(candidate)
        ex.enabled = enabler;
      })

      fn(2, 3);

      expect(enabler.callCount).to.equal(1);
      expect(candidate.callCount).to.equal(0);

    });

    it("is passed the calling arguments", function () {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(yes);

      let fn = syncExperiment("test", (ex) => {
        ex.use(add).try(candidate)
        ex.enabled = enabler;
      })

      fn(2, 3);

      expect(enabler.args[0]).to.deep.equal([2, 3]);
    });
  });



  describe("#beforeRun", function () {
    let id, exp, fn;

    beforeEach(() => {
      id = sinon.spy(x => x);
      fn = syncExperiment("test", (e) => {
        e.use(x => x)
        e.beforeRun = id;
        exp = e;
      });
    });


    it("runs only if the candidate is going to run (no candidate)", function () {
      // we have no candidate
      fn([1, 2, 3]);
      expect(id.callCount).to.equal(0);
    });

    it("runs only if the candidate is going to run (candidate disabled)", function () {
      let id = sinon.spy(x => x);
      let candidate = sinon.spy(noop);

      let fn = syncExperiment("test", (ex) => {
        ex.use(x => x)
          .try(candidate)

        ex.beforeRun = id;
        ex.enabled = no;
      });

      fn([1, 2, 3]);
      expect(candidate.callCount).to.equal(0);
      expect(id.callCount).to.equal(0);
    });

    it("receives the arguments as an array", function () {
      let id = sinon.spy(x => x);
      let candidate = sinon.spy(noop);
      let o = {};

      let fn = syncExperiment("test", (ex) => {
        ex.use(x => x)
          .try(noop)

        ex.beforeRun = id;
      });

      fn(o);
      expect(Array.isArray(id.args[0][0])).to.equal(true);
      expect(id.args[0][0][0]).to.equal(o);
    });

    it("defaults to returning the arguments array", function () {
      let candidate = sinon.spy(noop);
      let o = {};
      let trial;

      let fn = syncExperiment("test", (ex) => {
        ex.use(x => x).try(noop)
        ex.report = (t) => trial = t
      });

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

      let fn = syncExperiment("test", (ex) => {
        ex.use(control).try(candidate)

        ex.beforeRun = before;
      });

      fn(o);

      expect(before.returnValues[0][0]).to.equal(candidate.args[0][0]);

      expect(control.args[0][0]).to.equal(o);
      expect(candidate.args[0][0]).to.not.equal(o)
    });

    it("if the beforeRun function doesn't return an array, an exception is thrown", function () {

      let fn = syncExperiment("test", (ex) => {
        ex.use(noop).try(noop)
        ex.beforeRun = noop;
      });

      expect(fn).to.throw(/must return an array/i);
    });

  });
});





