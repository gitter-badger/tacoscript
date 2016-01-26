/*global suite,test*/
require('source-map-support').install()

var fs = require("fs")
var path = require("path")

var _ = require("lodash")
var chai = require("chai")
var devUtils = require("../../tacoscript-dev-utils")
chai.use(devUtils.chaiHelper)
var expect = chai.expect
var render = require("tacoscript-cst-utils").render
var saveAst = devUtils.saveAst

var horchata = require("../lib/index")

// TODO: rewrite mocha-fixtures-generic to be more generic, w.r.t directory structure

var fixtureRootBase = path.join(__dirname, "fixtures")
var fixtureRootDirs = fs.readdirSync(fixtureRootBase)

suite("horchata", function () {
  _.forEach(fixtureRootDirs, function(fixtureRootDir) { suite(fixtureRootDir, function () {
    var fixtureDirs = fs.readdirSync(path.join(fixtureRootBase, fixtureRootDir))
    var optionsPath = path.join(fixtureRootBase, fixtureRootDir, "options.json")
    var options = {}; try { options = require(optionsPath) } catch(e) {}
    _.forEach(fixtureDirs, function(fixtureDir) { test(fixtureDir, function () {

      var fixtureBase = path.join(fixtureRootBase, fixtureRootDir, fixtureDir)
      var fixtureAstPath = path.join(fixtureBase, "ast.json")
      var fixtureAst; try { fixtureAst = require(fixtureAstPath) } catch(e) {}

      var source = fs.readFileSync(path.join(fixtureBase, "source.taco"), "utf-8")
      var ast = horchata.parse(source, options)
      if (fixtureAst) {
        expect(ast).matches(fixtureAst)
      } else {
        saveAst(fixtureAstPath, ast)
      }

    }) /* end test */ }) /* end forEach fixtureDirs */
  }) /* end suite */ }) /* end forEach fixtureRootDirs */
})
