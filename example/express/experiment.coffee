{AsyncExperiment} = require "../../src"

router = require("express").Router()

router.get "/", (req, res) ->
  start = Date.now()

  console.log start

  exp = new AsyncExperiment "timeouts", ->
    @use (cb) ->
      console.log 'control'
      setTimeout cb, 1000

    @try (cb) ->
      console.log 'candidate'
      setTImeout cb, 2000


  exp.run ->
    res.status(200).json
      time: start - Date.now()

module.exports = router