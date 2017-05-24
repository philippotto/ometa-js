eval(readFile('bs-js-compiler.js'))

var JSParser = BSJSParser;

function toJS(code) {
  return JSParser.matchAll(code, "topLevel");
}

function createCondJSParser(base) {
  var CondJSParser;
  ometa CondJSParser <: base {
     primExpr = primExpr:p
                 ( "?" "." "name":m "(" listOf(#expr, ','):as ")" -> ["call", ["get", "cond"], p, ["func", ["p"], ["send", m, ["get", "p"]]]]
                  | "?" "." "name":f                               -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]])
                 | super("primExpr")
  }
  return CondJSParser;
}

function createBangJSParser(base) {
  var BangJSParser;
  ometa BangJSParser <: base {
     primExpr = primExpr:p
                 ( "!" "." "name":m "(" listOf(#expr, ','):as ")" -> ["call", ["get", "cond"], p, ["func", ["p"], ["send", m, ["get", "p"]]]]
                  | "!" "." "name":f                               -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]])
                 | super("primExpr")
  }
  return BangJSParser;
}

function createLayerParser(base) {
  var LayerParser;
  ometa LayerParser <: base {
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
  return LayerParser;
}

function createSqlParser(base) {
  var SqlParser;
  ometa SqlParser <: base {
    primExprHd = "sql" "{" _sqlContent:content "}" -> toJS("createSql('" + content + "')")
                 | super("primExprHd"),
    _sqlContent = "{" _sqlContent:ch "}" _chars:chars -> ("{" + ch + "}" + chars) | _chars:ch _sqlContent:b -> ch.concat(b) | _chars,
    _chars = _char*:chars -> chars.join(""),
    _char =  ( ~'}' ~'{' anything ):x -> x
  }
  SqlParser.keywords["sql"] = true;
  return SqlParser;
}

function createPipelineParser(base) {
  var PipelineParser;
  ometa PipelineParser <: base {
    expr = super("expr"):e pipelineTok pipelineRhs(e):r -> r | super("expr"),
    pipelineHead = "name":f,
    pipelineRhs :val = (super("expr"):d pipelineTok pipelineRhs(["call", d, val]):r -> r) | (expr:expr -> ["call", expr, val]),
    pipelineTok = spaces pipelineOp,
    special = pipelineOp | super("special"),
    pipelineOp = ``|>''
  }
  return PipelineParser;
}

function composeParserExtensions(baseParser, parserExtensions) {
  var currentParser = baseParser
  for (var i = parserExtensions.length - 1; i >= 0; i--) {
    currentParser = parserExtensions[i](currentParser)
  }
  return currentParser;
}

var CombinedParser = composeParserExtensions(JSParser, [createPipelineParser, createSqlParser, createLayerParser, createBangJSParser, createCondJSParser])

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
  try {
    a = CombinedParser.matchAll(samples[key], "topLevel");
    console.log(a)
    b = BSJSTranslator.match(a, "trans")
    console.log(b)
    console.log("")

  } catch (exception) {
    console.log("Couldn't parse", key);
  }
})

// has to end with no-comment-line:
