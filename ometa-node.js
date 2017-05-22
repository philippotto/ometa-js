const fs = require("fs");

const window = {};
const navigator = { userAgent: {match: function() {}, indexOf: function() {}}};
const document = {createElement: function() {}};

const paths = [
  "lib.js",
  "ometa-base.js",
  "parser.js",
  "bs-js-compiler.js",
  "bs-ometa-compiler.js",
  "bs-ometa-optimizer.js",
  "bs-ometa-js-compiler.js",
  "bs-project-list-parser.js",
];

function readFile(path) {
  return fs.readFileSync('./' + path)+'';
}

paths.forEach((path) => {
  eval(readFile(path));
});

translateCode = function(s) {
  var translationError = function(m, i) { alert("Translation error - please tell Alex about this!"); throw fail };
  var tree = BSOMetaJSParser.matchAll(s, "topLevel", undefined, function(m, i) {
    console.log("i", i, fail.toString());

      throw objectThatDelegatesTo(fail, {errorPos: i})
  });
  return BSOMetaJSTranslator.match(tree, "trans", undefined, translationError)
}
const nodePlayground = fs.readFileSync('./node-playground.js').toString();

console.log("Starting translation...")
var doneTranslating = false;
var translatedCode = translateCode(nodePlayground);
var doneTranslating = true;
var recDepth = 0;
console.log("Successfully translated. Now eval'ing...")
eval(translatedCode);
