MOCHA=./node_modules/.bin/mocha
TEST_FILES=`find ./test/ -name "*.test.js"`


test:
	@$(MOCHA) --timeout 1000 --reporter spec $(TEST_FILES)

test-debug:
	@$(MOCHA) --debug-brk --timeout 300000000 --reporter spec $(TEST_FILES)

.PHONY: test
