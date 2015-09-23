.PHONY: test

build:
	rm -rf ./lib
	./node_modules/.bin/babel src --out-dir lib --stage 0

lint:
	./node_modules/.bin/eslint ./src

test:
	@make build
	@make lint
	./node_modules/.bin/mocha --compilers js:babel/register ./test/*.js

