#TODO

## Async Error Handling
Each async observation needs it's own handler (already happens)... BUT
The domains need to be exited (and have their error listeners attached) in such a way
that the master `observeAsync` function can reference them, and exit them.



Because domains operate in a stack, we may need to execute the handlers sequentially,
rather than in parallel.
