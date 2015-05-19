require("babel/register");

let _ = require("lodash");
let expect = require("chai").expect;
let sinon = require("sinon");

let experiment = require("../src/experiment");

let {omitNonDeterministic} = require("./helpers");

function noop () {}
function id (x) { return x; }
function no () { return false; }
function yes () { return true; }
function add (a, b) { return a + b; }
function multiply (a, b) { return a * b; }

// minimum amount of work required to initialize an experiment
function executor (e) { e.use(noop); }

describe("experiment 'constructor'", function () {

  it("takes a `name` string as it's required first argument", function () {
    expect(() => experiment()).to.throw(/argument must be a string/i);
  });

  it("takes an `executor` function as it's required second argument", function () {
    expect(() => experiment("")).to.throw(/argument must be a function/i);
    expect(() => experiment("", "")).to.throw(/argument must be a function/i);
  });

  it("returns a function", function () {
    expect(typeof experiment("", executor)).to.equal("function");
  });

  it("copies own enumerable properties from the control to the experiment", function () {

    function f () {}

    var a = {}, b = {};

    Object.defineProperties(f, {
      "a": {enumerable: true, value: a},
      "b": {value: b}
    });

    var exp = experiment("test", function (e) {
      e.use(f);
    });

    expect(exp.a).to.equal(a);
    expect(exp.hasOwnProperty("b")).to.equal(false);

  });

  describe("init function invocation", function () {

    it("init's `this` context, init's argument are the same object", function () {
      let ctx = {};
      let arg = {};

      let fn = experiment("test", function (e) {
        e.use(noop);
        ctx = this;
        arg = e;
      });

      expect(arg).to.equal(ctx);
    });

  });

});




describe("instance methods", function () {




  describe("#use", function () {
    let exp;

    it("sets the experiment's control behavior", function () {
      let fn = experiment("test", (e) => {
        e.use(yes)
        exp = e;
      });
      expect(exp.control).to.equal(yes);
      expect(fn()).to.equal(yes());
    });

    it("an experiment whose control behavior throws an error will throw that error", function () {
      let fn = experiment("test", function (e) {
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
      fn = experiment("test", (e) => {
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

      let fn = experiment("test", (e) => {
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
      let fn = experiment("test", (e) => {
        e.use(function () { ctx = this; });
        e.context(obj);
      });

      fn();
      expect(ctx).to.equal(obj);
    });

    it("overrides calling context if set", function () {
      let ctx;
      let obj1 = {};
      let obj2 = {};

      let fn = experiment("test", (e) => {
        e.use(function () { ctx = this; })
        e.context(obj1)
      });

      fn.call(obj2)
      expect(ctx).to.equal(obj1);

    });

    it("defers to the calling context if unset", function () {
      let ctx;
      let obj = {};

      let fn = experiment("test", (e) => {
        e.use(function () { ctx = this; });
      });

      fn.call(obj)
      expect(ctx).to.equal(obj);

    });

  });

  describe("#metadata", function () {
    xit("merges the argument into the experiment's metadata", function () {

    });
  });


  describe("#report", function () {
    let trials = [];

    let spy = sinon.spy((x) => trials.push(x))

    it("sets the experiment's trial reporter", function () {

      let fn = experiment("test", (ex) => {
        ex.use(add)
          .try(multiply)
          .report(spy);
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
          returned: 5,
        },
        candidate: {
          type: "candidate",
          args: [ 2, 3 ],
          metadata: {},
          returned: 6,
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
          control: result.control.returned,
          candidate: result.candidate.returned
        };
      });

      let fn = experiment("test", (ex) => {
        ex.use(add)
          .try(multiply)
          .report(reporter)
          .clean(cleaner);
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
          returned: 5,
        },
        candidate: {
          type: "candidate",
          args: [ 2, 3 ],
          metadata: {},
          returned: 6,
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

      experiment("test", (ex) => {
        ex.use(add)
          .try(candidate)
          .enabled(enabler)
      })(2, 3);

      expect(enabler.callCount).to.equal(1);
      expect(candidate.callCount).to.equal(0);

    });

    it("is passed the calling arguments", function () {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(yes);

      experiment("test", (ex) => {
        ex.use(add)
          .try(candidate)
          .enabled(enabler)
      })(2, 3);

      expect(enabler.args[0]).to.deep.equal([2, 3]);
    });
  });



  describe("#beforeRun", function () {
    let id, exp, fn;

    beforeEach(() => {
      id = sinon.spy(x => x);
      fn = experiment("test", (e) => {
        e.use(x => x)
         .beforeRun(id)
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

      let fn = experiment("test", (ex) => {
        ex.use(x => x)
          .beforeRun(id)
          .try(candidate)
          .enabled(no)
      });

      fn([1, 2, 3]);
      expect(candidate.callCount).to.equal(0);
      expect(id.callCount).to.equal(0);
    });

    it("receives the arguments as an array", function () {
      let id = sinon.spy(x => x);
      let candidate = sinon.spy(noop);
      let o = {};

      let fn = experiment("test", (ex) => {
        ex.use(x => x)
          .beforeRun(id)
          .try(noop)
      });

      fn(o);
      expect(Array.isArray(id.args[0][0])).to.equal(true);
      expect(id.args[0][0][0]).to.equal(o);
    });

    it("defaults to returning the arguments array", function () {
      let candidate = sinon.spy(noop);
      let o = {};
      let trial;

      let fn = experiment("test", (ex) => {
        ex.use(x => x)
          .try(noop)
          .report((t) => trial = t)
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

      let fn = experiment("test", (ex) => {
        ex.use(control)
          .try(candidate)
          .beforeRun(before);
      });

      fn(o);

      expect(before.returnValues[0][0]).to.equal(candidate.args[0][0]);

      expect(control.args[0][0]).to.equal(o);
      expect(candidate.args[0][0]).to.not.equal(o)
    });

    it("if the beforeRun function doesn't return an array, an exception is thrown", function () {
      exp.try(id).beforeRun(noop);

      let fn = experiment("test", (ex) => {
        ex.use(noop).try(noop).beforeRun(noop);
      });

      expect(fn).to.throw(/must return an array/i);
    });

  });
});





