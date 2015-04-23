bindApply = (fn, ctx, args) ->
  [a, b, c, d, e] = args
  switch args.length
    when 1 then fn.bind ctx, a
    when 2 then fn.bind ctx, a, b
    when 3 then fn.bind ctx, a, b, c
    when 4 then fn.bind ctx, a, b, c, d
    when 5 then fn.bind ctx, a, b, c, d, e
    else Function::bind fn, [ctx].concat args

module.exports = { bindApply }
