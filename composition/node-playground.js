eval(readFile('bs-js-compiler.js'))

var JSParser = BSJSParser;

function toJS(code) {
  return JSParser.matchAll(code, "topLevel");
}

ometa CondJSParser <: JSParser {
   primExpr = primExpr:p
               ( "?" "." "name":m "(" listOf(#expr, ','):as ")" -> ["call", ["get", "cond"], p, ["func", ["p"], ["send", m, ["get", "p"]]]]
                | "?" "." "name":f                               -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]])
               | super("primExpr")
}

ometa BangJSParser <: CondJSParser {
   primExpr = primExpr:p
               ( "!" "." "name":m "(" listOf(#expr, ','):as ")" -> ["call", ["get", "cond"], p, ["func", ["p"], ["send", m, ["get", "p"]]]]
                | "!" "." "name":f                               -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]])
               | super("primExpr")
}

ometa LayerParser <: BangJSParser {
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

ometa SqlParser <: LayerParser {
  primExprHd = "sql" "{" _sqlContent:content "}" -> toJS("createSql('" + content + "')")
               | super("primExprHd"),
  _sqlContent = "{" _sqlContent:ch "}" _chars:chars -> ("{" + ch + "}" + chars) | _chars:ch _sqlContent:b -> ch.concat(b) | _chars,
  _chars = _char*:chars -> chars.join(""),
  _char =  ( ~'}' ~'{' anything ):x -> x
}
SqlParser.keywords["sql"] = true;

ometa PipelineParser <: SqlParser {
  expr = super("expr"):e pipelineTok pipelineRhs(e):r -> r | super("expr"),
  pipelineHead = "name":f,
  pipelineRhs :val = (super("expr"):d pipelineTok pipelineRhs(["call", d, val]):r -> r) | (expr:expr -> ["call", expr, val]),
  pipelineTok = spaces pipelineOp,
  special = pipelineOp | super("special"),
  pipelineOp = ``|>''
}

var CombinedParser = PipelineParser;

var samples = {
  cond: "bla?.blu?.bli",
  bang: "bla!.blu!.bli",
  layer: "layer bla { extends {someMethod: function() {}} } ",
  sql: "var bla = sql {{sele{ct som{e}th}ing()}}",
  pipeline: "var a = 1 + 1 |> function (a) {return 2 * a;} |> def.func |> ghi.bind(this)",
  combined: "abc?.bla!.blu; layer blu { extends {someMethod: function() { a?.a!.b; var s = sql { select foo from bar } }} }; var a = 1 + 1 |> function (a) {return 2 * a;} |> def.func |> ghi.bind(this)"
}
Object.keys(samples).forEach(function (key) {
  console.log("Parsing", key);
  a = CombinedParser.matchAll(samples[key], "topLevel");
  console.log(a)
  b = BSJSTranslator.match(a, "trans")
  console.log(b)
  console.log("")
})

// has to end with no-comment-line:
