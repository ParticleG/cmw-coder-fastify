import { readFileSync } from 'fs';
import { decode } from 'iconv-lite';

import { Position } from 'types/vscode/position';
import { Range } from 'types/vscode/range';
import { TextLine } from 'types/vscode/textLine';

export class TextDocument {
  fileName: string;
  isUntitled: boolean = false;
  languageId: string = 'c';
  version: number = 0;
  isDirty: boolean = false;
  isClosed: boolean = false;
  lineCount: number;
  private readonly _content: string;

  constructor(filePath: string) {
    this._content = decode(readFileSync(filePath), 'gb2312').toString();
    this.fileName = filePath;
    this.lineCount = this._content.split('\n').length;
  }

  lineAt(line: number): TextLine;
  lineAt(position: Position): TextLine;
  lineAt(input: unknown): TextLine {
    const lineNumber =
      typeof input === 'number' ? input : (<Position>input).line;
    const text = this._content.split('\n')[lineNumber].replace(/[\r\n]/g, '');
    return {
      lineNumber: lineNumber,
      text: text,
      range: new Range(lineNumber, 0, lineNumber, text.length),
      rangeIncludingLineBreak: new Range(
        lineNumber,
        0,
        lineNumber,
        text.length + 1,
      ),
      firstNonWhitespaceCharacterIndex: text.search(/\S/),
      isEmptyOrWhitespace: text.trim().length === 0,
    };
  }

  offsetAt(position: Position): number {
    return (
      this._content.split('\n').slice(0, position.line).join('\n').length +
      position.character +
      1
    );
  }

  positionAt(offset: number): Position {
    const linesBefore = this._content.substring(0, offset).split('\n');
    return new Position(
      linesBefore.length - 1,
      offset - linesBefore.slice(0, -1).join('\n').length,
    );
  }

  getText(range?: Range): string {
    if (!range) {
      return this._content;
    }
    return this._content.substring(
      this.offsetAt(range.start),
      this.offsetAt(range.end),
    );
  }

  validateRange(range: Range): Range {
    const startPosition =
      this.offsetAt(range.start) >= 0 ? range.start : this.positionAt(0);
    const endPosition =
      this.offsetAt(range.end) < this._content.length
        ? range.end
        : this.positionAt(this._content.length - 1);
    return new Range(
      startPosition.line,
      startPosition.character,
      endPosition.line,
      endPosition.character,
    );
  }

  validatePosition(position: Position): Position {
    const offset = this.offsetAt(position);
    return offset < 0
      ? this.positionAt(0)
      : offset >= this._content.length
      ? this.positionAt(this._content.length - 1)
      : position;
  }
}
