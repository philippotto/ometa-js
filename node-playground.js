eval(readFile('bs-js-compiler.js'))

var JSParser = BSJSParser;

function toJS(code) {
  return JSParser.matchAll(code, "topLevel");
}

ometa CondJSParser <: JSParser {
   primExpr = primExpr:p
                 ( "?" "." "name":m "(" listOf(#expr, ','):as ")" -> ["call", ["get", "cond"], p, ["func", ["p"], ["send", m, ["get", "p"]]]]
                 | "?" "." "name":f                               -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]]) | super("primExpr")
}

ometa BangJSParser <: JSParser {
   primExpr = primExpr:p
                 ( "!" "." "name":m "(" listOf(#expr, ','):as ")" -> ["call", ["get", "cond"], p, ["func", ["p"], ["send", m, ["get", "p"]]]]
                 | "!" "." "name":f                               -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]]) | super("primExpr")
}

ometa Test <: JSParser {
  primExpr = name:n -> ["crazy", n]
}


ometa CombinedParser <: JSParser {
   testPrim = primExpr,
   primExpr = primExpr:p
                 (
                  "?" "." "name":f            -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]]
                 )
                 | super_red,
   primExpr_next1 = super("primExpr"),
   super_red  = primExpr:p
                     (
                      "!" "." "name":f         -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]]
                     )
                     | super("primExpr")
}
// console.log(CombinedParser)

a = CombinedParser.matchAll("abc?.bla!.blu", "topLevel")
b = BSJSTranslator.match(a, "trans")


ometa LayerParser <: JSParser {
  stmt = "layer" "name":n layerBody:layerBody -> ["var", n, ["call", ["get", "createLayer"]].concat(layerBody)]
         | super("stmt"),
  layerBody = "{" classExtension*:c "}" -> c,
  classExtension = "extends" json:json -> json
}
// this modifies the keywords array of the superclass
// it might be useful to have context-aware keyword detection
LayerParser.keywords["layer"] = true;
LayerParser.keywords["extends"] = true;
LayerParser.keywords["class"] = true;

a = LayerParser.matchAll("layer bla { extends {someMethod: function() {}} extends {someOtherMethod: function() {}} }", "topLevel")
// console.log(a);

ometa SqlParser <: JSParser {
  primExprHd = "sql" "{" _sqlContent:content "}" -> toJS("createSql('" + content + "')")
               | super("primExprHd"),
  _sqlContent = "{" _sqlContent:ch "}" _chars:chars -> ("{" + ch + "}" + chars) | _chars:ch _sqlContent:b -> ch.concat(b) | _chars,
  _chars = _char*:chars -> chars.join(""),
  _char =  ( ~'}' ~'{' anything ):x -> x
}
SqlParser.keywords["sql"] = true;

a = SqlParser.matchAll("var bla = sql {{sele{ct som{e}th}ing()}}", "topLevel")



console.log(a)

b = BSJSTranslator.match(a, "trans")
console.log(b);
