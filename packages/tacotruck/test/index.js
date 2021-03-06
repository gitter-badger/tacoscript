/*global suite,test*/
require('source-map-support').install();
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const babylon = require('babylon');
const cstify = require('cstify').default;
const tacotruck = require("../lib/index");
const generate = tacotruck.default || tacotruck;
const expect = require("chai").expect;
const mochaFixtures = require("mocha-fixtures-generic");
const misMatch = require("../../tacoscript-dev-utils").misMatch;
const specOptions = require("../../../specs/options");

const GENERATE = !!(typeof process !== 'undefined' && process.env.GENERATE);

const babylonParseOpts = {
  // idea:
  // features["es7.classProperties"]: true
  strictMode: false,
  sourceType: "module",
  // 6.0
  plugins: [
    "asyncFunctions",
    "classProperties",
    "decorators",
    "exponentiationOperator",
    "exportExtensions",
    "functionBind",
  ],
  features: {
    "es7.asyncFunctions": true,
    "es7.classProperties": true,
    "es7.comprehensions": true, // NOTE: removed in babel 6.0
    "es7.functionBind": true,
    "es7.decorators": true,
    "es7.exportExtensions": true,
  },
};

const coreSpecs = mochaFixtures(require("path").resolve(__dirname + "/../../../specs/core"),
  _.assign({}, specOptions.core, {
    fixtures: _.assign({}, specOptions.core.fixtures, {
      "json": { loc: ["expected.json", "expected.cst.json"] }
    }),
    skip: function(test, testPath) {
      return specOptions.core.skip(test, testPath) ||
      testPath.indexOf("/invalid/") !== -1 ||
      test.indexOf("invalid-") === 0 ||
      test.indexOf("unexpected-") === 0 ||
      test.indexOf("malformed-") === 0;
    }
  })
);

const unifiedSpecs = mochaFixtures(require("path").resolve(__dirname + "/../../../specs/unified"),
  _.extend({}, specOptions.unified, {
    fixtures: _.assign({}, specOptions.unified.fixtures, {
      "json": { loc: ["expected.json", "expected.cst.json"] },
      "preserveLines": { loc: ["expected.preserveLines.taco"] },
    })
  })
);

suite("taco-printer", function () {
  test("basic", function () {
    var code = "this;\n";
    var ast = babylon.parse(code);
    var out = generate(ast, {}, code);
    expect(out.code).to.equal("this\n");
  });
  test("basic - source maps on", function () {
    var code = "this;\n";
    var ast = babylon.parse(code);
    var out = generate(ast, {sourceMaps: true, sourceFileName: "expected.js"}, code);
    // console.log(out.map.mappings);
    // console.log(out.tokens.length);
    expect(out.code).to.equal("this\n");
  });
});

_.forOwn(coreSpecs, function(suites, setName) {
  suites.forEach(function (testSuite) {
    suite("tacotruck: (preserve=false) core/" + setName + "/" + testSuite.title, function () {
      _.each(testSuite.tests, function (task) {
        // comment out the following line when generating new specs
        // if (!task.auto.code && !fs.existsSync(task.auto.loc.replace('expected.json/', ''))) { task.disabled = true; }
        test(task.title, !task.disabled && function () {
          var taco = task.auto;
          var js = task.js;

          var ast = JSON.parse(task.json.code);
          var options = _.merge({format: {perserve: false}}, task.options);
          var result = generate(ast, options, js.code);
          var tacoLoc = taco.loc.replace('expected.json/', '');
          // fs.writeFileSync(task.babel.loc + ".json", JSON.stringify(actualAst, null, '  '), {encoding: "utf8"});
          if (GENERATE && !taco.code && !fs.existsSync(tacoLoc)) {
            fs.writeFileSync(tacoLoc, result.code, {encoding: "utf8"});
          } else {
            expect(result.code.trim()).to.equal(taco.code.trim(), js.loc + " !== " + taco.loc);
          }
        });
      });
    });
  });
});

[false, true].forEach(function(preserveLines) {
_.forOwn(unifiedSpecs, function(suites, setName) {
  suites.forEach(function (testSuite) {
    suite("tacotruck: "+ (preserveLines?"(preserveLines) ":"") +"unified/" + setName + "/" + testSuite.title, function () {
      _.each(testSuite.tests, function (task) {
        // comment out the following line when generating new specs
        // if (!task.auto.code && !fs.existsSync(task.auto.loc.replace('expected.json/', ''))) { task.disabled = true; }
        test(task.title, !task.disabled && function () {
          var taco = preserveLines ? task.preserveLines : task.auto;
          var js = task.js;

          var expectedAst;
          if (task.json.code !== null) {
            expectedAst = JSON.parse(task.json.code);
          } else {
            expectedAst = cstify(
              babylon.parse(js.code,
                _.assign({}, babylonParseOpts, {
                  filename: js.loc
                })
              ), js.code, {visitors: '*'}
            );
          }
          var options = _.merge({format: {perserve: false, preserveLines: preserveLines}}, task.options);
          var result = generate(expectedAst, options, js.code);
          var actualCode = result.code;
          // console.log(Array.prototype.map.call(actualCode, (function(c){return c.charCodeAt(0)})))
          // console.log(Array.prototype.map.call(taco.code, (function(c){return c.charCodeAt(0)})))
          var tacoLoc = taco.loc.replace('expected.json/', '');
          // fs.writeFileSync(task.babel.loc + ".json", JSON.stringify(actualAst, null, '  '), {encoding: "utf8"});

          if (GENERATE && !taco.code && !fs.existsSync(tacoLoc)) {
            fs.writeFileSync(tacoLoc, actualCode, {encoding: "utf8"});
          } else {
            expect(actualCode.trim()).to.equal(taco.code.trim(), js.loc + " !== " + taco.loc);
          }
        });
      });
    });
  });
});
});

if (false) _.forOwn(coreSpecs, function(suites, setName) {
  suites.forEach(function (testSuite) {
    suite("tacotruck: (preserve=true) core/" + setName + "/" + testSuite.title, function () {
      _.each(testSuite.tests, function (task) {
        // comment out the following line when generating new specs
        // if (!task.auto.code && !fs.existsSync(task.auto.loc.replace('expected.json/', ''))) { task.disabled = true; }
        test(task.title, !task.disabled && function () {
          var taco = task.auto;
          var js = task.js;

          var actualAst = babylon.parse(js.code, {
            filename: js.loc,
            strictMode: false,
            sourceType: "module",
            plugins: {
              "cst": true
            }
          });
          try {
            var expectedAst = JSON.parse(task.json.code);
            delete expectedAst.program.sourceType;
            var mismatchMessage = misMatch(expectedAst, actualAst);
          } catch(e) {}
          if (mismatchMessage) throw new Error(mismatchMessage);
          var options = task.options;
          var result = generate(actualAst, options, js.code);
          var actualCode = result.code;
          // console.log(result.tokens);
          // fs.writeFileSync(task.babel.loc + ".json", JSON.stringify(actualAst, null, '  '), {encoding: "utf8"});
          expect(actualCode.trim()).to.equal(taco.code.trim(), js.loc + " !== " + taco.loc);
        });
      });
    });
  });
});
