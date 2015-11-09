/*
 * Copyright (C) 2012-2014 by various contributors (see doc/ACORN_AUTHORS)
 * Copyright (C) 2015 Jordan Klassen <forivall@gmail.com>
 *
 * See LICENSE for full license text
 */

// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Horchata uses an [operator precedence parser][opp] (inherited from
// Acorn) to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// However, the non-left-to-right associative operators use recursive descent.
//
// See also: [the MDN Operator Precedence page][MDNOP]
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser
// [MDNOP]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

import {types as tt} from "../../tokenizer/types";

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.



// Parse a full expression. The expressionContext is used to:
// * forbid the `in` operator (in for loops initalization expressions)
// * provide reference for storing '=' operator inside shorthand
//   property assignment in contexts where both object expression
//   and object pattern might appear (so it's possible to raise
//   delayed syntax error at correct position).

// main entry point into expression parsing. Can be used by plugins
export function parseExpression(expressionContext = {}) {
  return this.parseExpressionMaybeSequence(expressionContext);
}

// precedence: 0
export function parseExpressionMaybeSequence(expressionContext) {
  let startPos = this.state.cur.start;
  let startLoc = this.state.cur.startLoc;
  let expr = this.parseExpressionMaybeKeywordOrAssignment(expressionContext);
  if (this.match(tt.semi)) {
    let node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(tt.semi)) {
      node.expressions.push(this.parseExpressionMaybeKeywordOrAssignment(expressionContext));
    }
    this.checkReferencedList(node.expressions);
    return this.finishNode(node, "SequenceExpression");
  }
  return expr;
}

// Parse an expression, with the highest level being an AssignmentExpression
// This includes applications of // operators like `+=`.

// Also, because of the leading if on conditional expressions, they have
// a higher precedence than assignment expressions

// precedence: 2, 3, 4
export function parseExpressionMaybeKeywordOrAssignment(expressionContext, callbacks) {
  let node;
  switch (this.state.type) {
    case tt._yield: node = this.parseYieldExpression(); break;
    case tt._if: node = this.parseConditionalExpression(); break;
    default:

      let maybeOtherExpressionNode = this.parseOtherKeywordExpression(node);
      if (maybeOtherExpressionNode) {
        node = maybeOtherExpressionNode;
        break;
      }

      let failOnShorthandAssign = expressionContext.shorthandDefaultPos == null;
      if (failOnShorthandAssign) {
        expressionContext.shorthandDefaultPos = {start: 0};
      }

      let start = {...this.cur};

      // tacoscript arrow functions _always_ have arguments surrounded by parens
      // TODO: add plugin extension point here for custom function syntax, to
      // accomodate [frappe lambdas][fl], etc from within a plugin
      // fl: https://github.com/lydell/frappe#consistently-short-arrow-function-syntax
      if (this.match(tt.parenL)) {
        this.state.potentialLambdaAt = this.state.start;
      }

      // tacoscript conditional expressions always start with `if` or `if!`,
      // so we don't need a parseMaybeConditional
      node = this.parseExprOps(expressionContext);
      if (callbacks.afterLeftParse) {
        node = callbacks.afterLeftParse.call(this, node, startPos, startLoc);
      }

      if (this.state.type.isAssign) {
        let left = node;
        // node = this.startNodeAt(startPos, startLoc);
      }



  }
  return node;
}


export function parseOtherKeywordExpression() {
  // Purposefully left empty for plugins. See docs/horchata-plugins.md#empty-functions
  return null;
}

// opp