/*
 * Copyright (C) 2012-2014 by various contributors (see doc/ACORN_AUTHORS)
 * Copyright (C) 2015 Jordan Klassen <forivall@gmail.com>
 *
 * See LICENSE for full license text
 */

// TODO: rename to lexer everywhere in the code.

import {types as tt} from "./types";
import {reservedWords, keywords, isIdentifierChar, isIdentifierStart} from "../util/identifier";
import {isNewline, nonASCIIwhitespace} from "../util/whitespace";
import State from "./state";
import {getOptions} from "../options";
// export {default as Token} from "./token";
import Token from "./token";
export {Token};

function keywordRegexp(words) {
  return new RegExp("^(" + words.join("|") + ")$");
}

export default class Lexer {
  // TODO: move input to parse(), change otions os that it only contains options
  // that are generic, no options that pertain to the source file
  constructor(options) {
    this.options = getOptions(options);

    // Construct regexes for reserved words, according to settings
    this.keywords = keywordRegexp([].concat(keywords, reservedWords.tacoscript))
    this.reservedWords = keywordRegexp([].concat(reservedWords.es2015, reservedWords.strict));
    this.reservedWordsStrictBind = keywordRegexp([].concat(reservedWords.es2015, reservedWords.strict, reservedWords.strictBind))

    // These will be populated by `open()`
    this.file = this.input = this.state = null;
  }

  // call this prior to start parsing
  // TODO: who's responsible for creating the file object?
  open(file) {
    this.file = file;
    this.input = this.file.input;
    this.state = new State(this.options, this.file);
  }
  close() {
    this.file = this.input = this.state = null;
  }

  // TODO: parse hash bang line as comment

  // Read a single token & update the lexer state
  nextToken() {
    let curContext = this.curContext();
    if (curContext == null || !curContext.preserveSpace) {
      if (this.state.inIndentation) {
        this.skipIndentation();
      }
      // newlines are significant, so this only skips comments and non-indentation whitespace
      this.skipNonTokens();
    }
    this.state.containsOctal = false;
    this.state.octalPosition = null;
    this.state.start = this.state.pos;
    if (this.options.locations) this.state.startLoc = this.state.curPosition();
    if (this.state.pos >= this.input.length) return this.finishToken(tt.eof);

    if (curContext.override) return this.finishToken(tt.eof);
    else return this.readToken(this.fullCharCodeAtPos());
  }

  readToken(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code) || code === 92 /* '\' */) {
      return this.readWord();
    }
    if (this.state.checkIndentation && isNewline(code)) {
      // check for indentation change in the next line, if the next char is a newline.
      // this takes some annoying amount of lookahead, but we can optimise that later. If needed.
      if (this.maybeReadIndentation()) return;
    }
    return this.getTokenFromCode(code);
  }

  fullCharCodeAtPos() {
    let code = this.input.charCodeAt(this.state.pos);
    if (code <= 0xd7ff || code > 0xe000) return code; //single char code

    let next = this.input.charCodeAt(this.state.pos + 1);
    // TODO: figure out how this magic is and document it. from acorn.
    return (code << 10) + next - 0x35fdc00;
  }

  curContext() { return this.state.context[this.state.context.length - 1]; }

  skipIndentation() {
    // TODO: ...
    // throw new Error("Not Implemented");
    this.state.inIndentation = false;
  }
  // based on acorn's skipSpace
  // parse & skip whitespace and comments
  skipNonTokens() {
    let start = this.state.pos;
    let startLoc = this.state.curPosition();
    while (this.state.pos < this.input.length) {
      let ch = this.input.charCodeAt(this.state.pos);
      // TODO: see if micro-optimization of order of checking ch is worth it
      if (ch === 32 || ch === 160 || ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++this.state.pos;
      } else {
        if (this.state.pos > start) {
          this.onNonToken(new Token(tt.whitespace,
            {code: this.input.slice(start, this.state.pos)},
            start, this.state.pos, startLoc, this.state.curPosition(),
            this.state
          ));
        }
        if (ch === 35) { // '#'
          if (this.input.charCodeAt(this.state.pos + 1) === 42) { // '*'
            this.skipBlockComment();
          } else {
            this.skipLineComment();
          }
          start = this.state.pos;
          startLoc = this.state.curPosition();
        } else {
          break;
        }
      }
    }
  }

  skipLineComment(startLength = 1) {
    let start = this.state.pos;
    let startLoc = this.curPosition();
    this.state.pos += startLength;
    this.onNonToken(new Token(tt.lineCommentStart, null,
      start, startLoc, this.state.pos, this.state.curPosition(), this.state
    ));

    start = this.state.pos;
    startLoc = this.curPosition();
    for (let ch; ch = this.input.charCodeAt(this.state.pos),
    this.state.pos < this.input.length &&
    ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233; ++this.state.pos);

    this.onNonToken(new Token(tt.lineCommentBody, this.input.slice(start, this.state.pos),
      start, startLoc, this.state.pos, this.state.curPosition(), this.state
    ));
  }

  skipBlockComment() {
    let start = this.state.pos;
    let startLoc = this.curPosition();
    this.state.pos += 2;
    this.onNonToken(new Token(tt.blockCommentStart, null,
      start, startLoc, this.state.pos, this.state.curPosition(), this.state
    ));

    start = this.state.pos;
    startLoc = this.curPosition();
    let end = this.input.indexOf("*#", this.state.pos);
    if (end === -1) this.raise(this.state.pos, "Unterminated comment");
    this.state.pos = end;
    this.onNonToken(new Token(tt.blockCommentBody, this.input.slice(start, this.state.pos),
      start, startLoc, this.state.pos, this.state.curPosition(), this.state
    ));

    start = this.state.pos;
    startLoc = this.curPosition();
    this.state.pos += 2;
    this.onNonToken(new Token(tt.blockCommentEnd, null,
      start, startLoc, this.state.pos, this.state.curPosition(), this.state
    ));
  }

  getTokenFromCode() {
    throw new Error("Not Implemented");
  }

  readWord() {
    throw new Error("Not Implemented");
  }

  readWordSingle() {
    throw new Error("Not Implemented");
  }

  ////////////// Token Storage //////////////

  onToken(token) {
    this.state.tokens.push(token);
    this.onSourceElementToken(token);
  }

  onNonToken(token) {
    this.onSourceElementToken(token);
  }

  onSourceElementToken(token) {
    this.state.sourceElementTokens.push(token);
  }
}
