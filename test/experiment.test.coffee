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

    it "expected methods are available", ->
      new Experiment "", ->
        [@use, @try]
          .forEach (method) ->
            expect(method) to be a Function


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
      it "works"

    describe "get signature", ->
      it "works"

  describe "#context", ->
    describe "set signature", ->
      it "works"

    describe "get signature", ->
      it "works"

  describe "#clean", ->
    describe "set signature", ->
      it "works"

    describe "get signature", ->
      it "works"

  describe "#run", ->