
/**
 * Tacoscript's code generator, turns an ast into tacoscript code
 */

import sourceMap from "source-map";
import Position from "./position";

export default class TacoscriptTokenBuffer {

  constructor(opts, code) {
    this._initSourceMap(opts, code);
    this.position = new Position();
    this.opts = opts;
    this.code = code;
  }

  _initSourceMap(opts, code) {
    if (opts.sourceMaps) {
      this.map = new sourceMap.SourceMapGenerator({
        file: opts.sourceMapTarget,
        sourceRoot: opts.sourceRoot
      });
      this.map.setSourceContent(opts.sourceFileName, code);
    } else {
      this.map = null;
    }
  }

  mark(original) {
    // use current location to mark the source map
    let position = this.position;
    this.map.addMapping({
      source: this.opts.sourceFileName,
      generated: {
        line: position.line,
        column: position.column
      },
      original: original
    });
  }

  _push(token) {
    let stringOfToken;
    // TODO: perform magic
    this.output += stringOfToken;
    this.position.push(stringOfToken);
  }

  stringify() {
    // probably can be shared; move to _buffer if possible.
    // calculate position and source map as tokens are serialized into code
  }


}
