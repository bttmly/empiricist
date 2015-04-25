# {expect} = require "chai"

require("sentence").globals()

{Experiment} = require "../src/"

describe "Experiment", ->


  describe "#constructor", ->

    it "is a constructor", ->
      expect(new Experiment("")) to be an Experiment

    it "can be called without new", ->
      expect(Experiment "") to be an Experiment

    it "requires a string as the first argument", ->
      expect(-> new Experiment) to error

    it "can be invoked without a second argument", ->
      new Experiment("")

    it "calls the function argument", ->
      called = false
      new Experiment "", -> called = true
      expect(called) to equal true

    it "calls the function argument with the instance as the context", ->
      ctx = null
      instance = new Experiment "", -> ctx = @
      expect(instance) to equal ctx

    describe "instance configuration with initialization function", ->

      it "setting a Result class works"
      


  describe "#try", ->

    it "sets the control function for the instance", ->
      fn = ->
      exp = new Experiment "", ->
        @use fn

      expect(exp._control) to equal fn

    it "returns self", ->
      instance = null
      exp = new Experiment "", ->
        instance = @use ->

      expect(exp) to equal instance

    it "throws if invoked more than once", ->
      fn1 = ->
      fn2 = ->
      expect(->
        new Experiment "", ->
          @use fn1
          @use fn2
      ) to error


  describe "#use", ->

    it "adds a function to the candidate array", ->
      fn = ->
      exp = new Experiment "", ->
        @try fn

      expect(exp._candidates) to contain fn

    it "returns self", ->
      instance = null
      exp = new Experiment "", ->
        instance = @try ->

      expect(exp) to equal instance

    it "can add more than one candidate", ->
      fn1 = ->
      fn2 = ->
      exp = new Experiment "", ->
        @try fn1
        @try fn2

      expect(exp._candidates) to contain fn1
      expect(exp._candidates) to contain fn2
      expect(exp._candidates) to have length 2


  describe "#metadata", ->

    describe "set signature", ->
      it "returns self", ->
        exp = new Experiment ""
        result = exp.metadata {}
        expect(exp) to equal result

    describe "get signature", ->
      it "returns instance metadata", ->
        exp = new Experiment ""
        expect(exp._metadata) to equal exp.metadata()

  describe "#context", ->

    describe "set signature", ->
      it "returns self", ->
        exp = new Experiment ""
        ret = exp.context {}
        expect(exp) to equal ret

    describe "get signature", ->
      it "returns instance context", ->
        exp = new Experiment ""
        ctx = exp.context()
        expect(exp._context) to equal ctx

  describe "#clean", ->

    describe "set signature", ->
      it "returns self", ->
        exp = new Experiment ""
        result = exp.clean {}
        expect(exp) to equal result

    xdescribe "get signature", ->
      it "works"

  describe "#run", ->