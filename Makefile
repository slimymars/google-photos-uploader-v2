SRC = $(wildcard src/*)
DISTS = dist/background.js dist/manifest.json dist/options.html dist/options.js
package.zip: $(DISTS)
	7z a $@ $(DISTS)
$(DISTS): $(SRC) package.json tsconfig.json webpack.config.js Makefile
	node node_modules/.bin/webpack --mode=production
clean:
	rm $(DISTS) package.zip
