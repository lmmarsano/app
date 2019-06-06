elmdirs != find src -mindepth 1 -type d
npmrs := build-dev-client basic-watch
build-targets := build-elm build-dev-client
watch-targets := watch-elm basic-watch
elm-source := dist/elm.js

all: $(build-targets)

build-elm: $(elm-source)

$(npmrs):
	yarn run $@

watch: $(watch-targets)

watch-elm:
	./node_modules/.bin/elm-live --open --pushstate --dir="$(dir $(elm-source))" -- --debug --output="$(elm-source)" src/Main.elm

$(elm-source): $(wildcard src/*.elm) $(elmdirs)
	elm make --output="$@" src/Main.elm

clean:
	-rm -r dist

.PHONY: all watch $(build-targets) $(watch-targets) clean
