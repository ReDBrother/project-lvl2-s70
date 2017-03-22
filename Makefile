install:
	npm install
start:
	npm run babel-node -- src/bin/gen-diff.js -h
test:
	npm test
publish:
	npm publish
lint:
	npm run eslint -- src

