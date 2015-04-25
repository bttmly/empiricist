express = require "express"
path = require "path"
favicon = require "serve-favicon"
logger = require "morgan"
cookieParser = require "cookie-parser"
bodyParser = require "body-parser"
app = express()



app.use logger "dev"
app.use bodyParser.json()
app.use bodyParser.urlencoded extended: false
app.use cookieParser()

app.use "/", require "./experiment"

# catch 404 and forward to error handler
app.use (req, res, next) ->
  err = new Error("Not Found")
  err.status = 404
  next err


# error handlers
# development error handler
# will print stacktrace
if app.get("env") == "development"
  app.use (err, req, res, next) ->
    res
      .status err.status or 500
      .json
        message: err.message
        error: err
        stack: err.stack

# production error handler
# no stacktraces leaked to user
app.use (err, req, res, next) ->
  res
    .status err.status or 500
    .json
      message: err.message
      error: {}

#!/usr/bin/env node

app.set "port", process.env.PORT || 3000

server = app.listen app.get('port'), ->
  console.log "Express server listening on port #{server.address().port}"
