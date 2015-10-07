/* @flow */

/* See copyright and license at the bottom of this file */

/**
 * Track current position in code generation.
 */

export default class Position {
  constructor() {
    this.line = 1;
    this.column = 0;
  }

  /**
   * Push a string to the current position, mantaining the current line and column.
   */

  push(str) {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "\n") {
        this.line++;
        this.column = 0;
      } else {
        this.column++;
      }
    }
  }

  /**
   * Unshift a string from the current position, mantaining the current line and column.
   */

  unshift(str) {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "\n") {
        this.line--;
      } else {
        this.column--;
      }
    }
  }
}

/*
 * Copyright (c) 2014-2015 Sebastian McKenzie <sebmck@gmail.com>
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
