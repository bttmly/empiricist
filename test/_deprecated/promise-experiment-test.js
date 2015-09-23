if (typeof Promise === "undefined") {
  require("es6-promise").polyfill();
}

require("babel/register");

const expect = require("must");
const sinon = require("sinon");

const {
  promiseExperiment,
  Experiment,
} = require("../lib");

const NAME = "test";
const DELAY = 5;

let noop = () => {};
let yep = () => true;
let nope = () => false;
let id = (x) => x;

let resolved = v => Promise.resolve(v);
let rejected = v => Promise.reject(v);
  
let willResolve = val => () => new Promise(resolve => setTimeout(() => resolve(val), DELAY));
let willReject = val => () => new Promise((__, reject) => setTimeout(() => reject(val), DELAY));
let willThrow = msg => () => new Promise(() => { throw new Error(msg); });


describe("Promise experiment 'constructor'", () => {

  it("takes a `name` string as it's required first argument", function () {
    expect(() => promiseExperiment()).to.throw(/argument must be a string/i);
  });

  it("takes an `executor` function as it's required second argument", function () {
    expect(() => promiseExperiment("")).to.throw(/argument must be a function/i);
    expect(() => promiseExperiment("", "")).to.throw(/argument must be a function/i);
  });

  it("returns a function", function () {
    expect(typeof promiseExperiment("", (e) => e.use(noop))).to.equal("function");
  });

  describe("executor function invocation", function () {

    it("executor's `this` context and executor's argument are the same object", function () {
      let ctx = {}, arg = {};

     promiseExperiment("test", function (e) {
        e.use(noop);
        ctx = this;
        arg = e;
      });

      expect(arg).to.equal(ctx);
    });

    it("the argument/context is an instance of Experiment", function () {
      let exp;

      promiseExperiment("test", function (e) {
        e.use(noop);
        exp = e;
      });

      expect(exp instanceof Experiment).to.equal(true);
    });

  });

});


describe("behavior on experiment invocation", () => {

  let control, candidate;

  beforeEach(() => {
    control = {};
    candidate = {};
  });

  it("propogates control resolution properly when candidate also resolves", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willResolve(control));
      e.try(willResolve(candidate));
    });

    exp().then(result => {
      expect(result).to.equal(control);
      done();
    });
  });

  it("propogates control resolution properly when candidate rejects", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willResolve(control));
      e.try(willReject(candidate));
    });

    exp().then(result => {
      expect(result).to.equal(control);
      done();
    });
  });

  it("propogates control resolution properly when candidate rejects", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willResolve(control));
      e.try(willThrow(candidate));
    });

    exp().then(result => {
      expect(result).to.equal(control);
      done();
    });
  });


  it("propgates control rejection properly when candidate also rejects", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willReject(control));
      e.try(willReject(candidate));
    });

    exp().catch(err => {
      expect(err).to.equal(control);
      done();
    });
  });

  it("propgates control rejection properly when candidate resolves", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willReject(control));
      e.try(willResolve(candidate));
    });

    exp().catch(err => {
      expect(err).to.equal(control);
      done();
    });
  });

  it("propgates control rejection properly when candidate throws", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willReject(control));
      e.try(willThrow("candidate"));
    });

    exp().catch(err => {
      expect(err).to.equal(control);
      done();
    });
  });


  it("propogates control exceptions properly when candidate resolves", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willThrow("control"));
      e.try(willResolve(candidate));
    });

    exp().catch(err => {
      expect(err.message).to.equal("control");
      done();
    });
  });

  it("propogates control exceptions properly when candidate rejects", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willThrow("control"));
      e.try(willReject(candidate));
    });

    exp().catch(err => {
      expect(err.message).to.equal("control");
      done();
    });
  });

  it("propogates control exceptions properly when candidate throws", done => {
    let exp = promiseExperiment(NAME, e => {
      e.use(willThrow("control"));
      e.try(willThrow("candidate"));
    });

    exp().catch(err => {
      expect(err.message).to.equal("control");
      done();
    });
  });

});
