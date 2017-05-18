eval(readFile('bs-js-compiler.js'))

var JSParser = BSJSParser;

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
console.log(a);
console.log(b);
