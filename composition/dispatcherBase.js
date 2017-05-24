function createCompositeParserBase(parser, nextParser) {
  return objectThatDelegatesTo(parser, {
    _apply: function(rule) {
      if (this.hasOwnProperty(rule)) {
        // todo
        parser._apply.apply(this, arguments);
      } else if (nextParser != null && nextParser.hasOwnProperty(rule)) {
        // todo: parser chain has to be regarded
        nextParser._apply.apply(this, arguments);
      } else {
        var args = Array.prototype.slice.call(arguments);
        return parser._superApplyWithArgs.apply(this, [this].concat(args));
      }
    },
    _superApplyWithArgs: function(recv, rule) {
      if (nextParser != null) {
        // return nextParser[rule].call(recv)
        var ruleFn = nextParser[rule];

        var ruleFnArity = ruleFn.length
        for (var idx = arguments.length - 1; idx >= ruleFnArity + 2; idx--) // prepend "extra" arguments in reverse order
          recv._prependInput(arguments[idx])
        return ruleFnArity == 0 ?
                 ruleFn.call(recv) :
                 ruleFn.apply(recv, Array.prototype.slice.call(arguments, 2, ruleFnArity + 2))
      } else {
        return parser._superApplyWithArgs(recv, rule);
      }
    }
    ,
    _applyWithArgs: function(rule) {
      var ruleFn;
      if (this.hasOwnProperty(rule)) {
        console.log("call rule on self", rule);
        ruleFn = this[rule];
      } else if (nextParser != null) {
        ruleFn = nextParser[rule];
      } else {
        var args = Array.prototype.slice.call(arguments);
        return parser._superApplyWithArgs.apply(this, [this].concat(args));
      }

      var ruleFnArity = ruleFn.length
      for (var idx = arguments.length - 1; idx >= ruleFnArity + 1; idx--) // prepend "extra" arguments in reverse order
        this._prependInput(arguments[idx])
      return ruleFnArity == 0 ?
               ruleFn.call(this) :
               ruleFn.apply(this, Array.prototype.slice.call(arguments, 1, ruleFnArity + 1))
    }
  });
}

// ometa CombinedParserOld <: JSParser {
//    testPrim = primExpr,
//    primExpr = primExpr:p
//                  (
//                   "?" "." "name":f            -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]]
//                  )
//                  | super_red,
//    primExpr_next1 = super("primExpr"),
//    super_red  = primExpr:p
//                      (
//                       "!" "." "name":f         -> ["call", ["get", "cond"], p, ["func", ["p"], ["getp", ["string", f], ["get", "p"]]]]
//                      )
//                      | super("primExpr")
// }
