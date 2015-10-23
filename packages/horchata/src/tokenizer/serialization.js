
import forOwn from "lodash/object/forOwn";
import { types as tt, keywords } from "./types";
import { tokTypes as btt } from "babylon";
import toFastProperties from "to-fast-properties";
import repeating from "repeating";

// helper for looking up token types
// export const key = new Symbol("TokenTypeKey");
//
// update the lookup helper
export function added() {
  forOwn(tt, function(tokType, keyStr) {
    // tokType[key] = keyStr;
    tokType.key = keyStr;
    if (!tokType.babylonName) {
      tokType.babylonName = keyStr;
    }
  });
  // forOwn(btt, function(tokType, keyStr) {
  //   tokType[key] = keyStr;
  // });
}

export function from(babelTokenType) {
  // TODO
}

export function init() {
  added();
  tt.eof.code = "";
  tt.newline.code = "\n";
  tt.bracketL.code = "[";
  tt.bracketR.code = "]";
  tt.braceL.code = "{";
  tt.braceR.code = "}";
  tt.parenL.code = "(";
  tt.parenR.code = ")";
  tt.comma.code = ",";
  tt.semi.code = ";";
  tt.colon.code = ":";
  tt.doubleColon.code = "::";
  tt.dot.code = ".";
  tt.question.code = "?";
  tt.soak.code = "?.";
  tt.ellipsis.code = "...";
  tt.backQuote.code = "`";
  tt.dollarBraceL.code = "${";
  tt.at.code = "@";
  tt.exec.code = "!";
  tt.backslash.code = "\\";
  tt.eq.code = "=";
  tt.bitwiseNOT.code = "~";
  tt.bitwiseOR.code = "|";
  tt.bitwiseXOR.code = "^";
  tt.bitwiseAND.code = "&";
  tt.modulo.code = "%";
  tt.star.code = "*"
  tt.slash.code = "/";
  tt.exponent.code = "*";

  tt.blockCommentStart.code = "#$";
  tt.blockCommentEnd.code = "$#";
  tt.lineCommentStart.code = "#";

  tt.whitespace.toCode = function(token) { return token.value.code; };
  tt.num.toCode = function(token) { return token.value.code; };
  tt.regexp.toCode = function(token) { return token.value.code; };
  tt.string.toCode = function(token) { return token.value.code; };
  tt.name.toCode = function(token, state) {
    // TODO: keyword conflict resolution
    return token.value.code;
  };
  tt.tab.toCode = function(token, state) {
    return repeating(state.format.indent.indent, token.value);
  };
  tt.indent.toCode = function(token, state) {
    // marker to parser that indentation has increased
    return "";
  };
  tt.dedent.toCode = function(token, state) {
    // marker to parser that indentation has decreased
    return "";
  };
  // NOTE: proper serialization of invalid taco/javascript is not guaranteed.

  tt.name.forceSpaceWhenAfter.keyword = true;
  tt.string.forceSpaceWhenAfter.keyword = true;
  tt.num.forceSpaceWhenAfter.keyword = true;
  forOwn(keywords, function(keywordType) {
    keywordType.forceSpaceWhenAfter.keyword = true;
    keywordType.forceSpaceWhenAfter.name = true;
    keywordType.forceSpaceWhenAfter.num = true;
    keywordType.forceSpaceWhenAfter.string = true;
    keywordType.formattingSpaceWhenAfter.bracketR = true;
    keywordType.formattingSpaceWhenAfter.parenR = true;
    keywordType.formattingSpaceWhenAfter.incDec = true;
  });

  tt.plusMin.formattingSpaceAfter = function(left, right) { return !left.meta.unary; }
  tt.plusMin.formattingSpaceWhenAfter.name = true;
  tt.plusMin.formattingSpaceWhenAfter.num = true;
  tt.plusMin.formattingSpaceWhenAfter.parenR = true;
  tt.plusMin.formattingSpaceWhenAfter.string = true;
  tt.num.formattingSpaceWhenAfter
  for (let tokenType of [
        tt.slash, tt.star, tt.modulo, tt.assign,
        tt.bitShift, tt.bitwiseAND, tt.bitwiseOR, tt.bitwiseXOR,
        tt.equality, tt.relational
      ]) {
    tokenType.formattingSpaceWhenAfter.name = true;
    tokenType.formattingSpaceWhenAfter.num = true;
    tokenType.formattingSpaceWhenAfter.parenR = true;
    tokenType.formattingSpaceWhenAfter.string = true;
    tokenType.formattingSpaceAfter = true;
  }

  tt.arrow.formattingSpaceWhenAfter.parenR = true;
  tt.bracketL.formattingSpaceWhenAfter.eq = true;
  tt.bracketL.formattingSpaceWhenAfter.keyword = true;
  tt.parenL.formattingSpaceWhenAfter.un = true;
  tt.parenL.formattingSpaceWhenAfter.keyword = true;
  tt.braceL.formattingSpaceWhenAfter.keyword = true;
  tt.colon.formattingSpaceAfter = true;
  tt.comma.formattingSpaceAfter = true;
  tt.eq.formattingSpaceAfter = true;
  tt.eq.formattingSpaceWhenAfter.name = true;
  tt.name.formattingSpaceWhenAfter.exec = true;
  tt.parenL.formattingSpaceWhenAfter.exec = true;
  tt.semi.formattingSpaceAfter = true;
  tt.unboundArrow.formattingSpaceWhenAfter.parenR = true;



  tt.incDec.forceSpaceWhenAfter.plusMin = function(left, right) {
    return (left.value === "+" && right.value === "++") ||
      (left.value === "-" && right.value === "--");
  };
  tt.plusMin.forceSpaceWhenAfter.plusMin = function(left, right) {
    return (left.value === "+" && right.value === "++") ||
      (left.value === "-" && right.value === "--");
  };
}