/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPosition, Position } from './position';

/**
 * A range in the editor. This interface is suitable for serialization.
 */
export interface IRange {
  readonly start: Position;
  readonly end: Position;
}

/**
 * A range in the editor. (start.line, start.character) is <= (end.line, end.character)
 */
export class Range {
  public readonly start: Position;
  public readonly end: Position;

  constructor(
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number,
  ) {
    if (
      startLine > endLine ||
      (startLine === endLine && startCharacter > endCharacter)
    ) {
      this.start = new Position(endLine, endCharacter);
      this.end = new Position(startLine, startCharacter);
    } else {
      this.start = new Position(startLine, startCharacter);
      this.end = new Position(endLine, endCharacter);
    }
  }

  /**
   * Test if `range` is empty.
   */
  public static isEmpty(range: IRange): boolean {
    return (
      range.start.line === range.end.line &&
      range.start.character === range.end.character
    );
  }

  /**
   * Test if `position` is in `range`. If the position is at the edges, will return true.
   */
  public static containsPosition(range: IRange, position: IPosition): boolean {
    if (position.line < range.start.line || position.line > range.end.line) {
      return false;
    }
    if (
      position.line === range.start.line &&
      position.character < range.start.character
    ) {
      return false;
    }
    return !(
      position.line === range.end.line &&
      position.character > range.end.character
    );
  }

  /**
   * Test if `position` is in `range`. If the position is at the edges, will return false.
   * @internal
   */
  public static strictContainsPosition(
    range: IRange,
    position: IPosition,
  ): boolean {
    if (position.line < range.start.line || position.line > range.end.line) {
      return false;
    }
    if (
      position.line === range.start.line &&
      position.character <= range.start.character
    ) {
      return false;
    }
    return !(
      position.line === range.end.line &&
      position.character >= range.end.character
    );
  }

  /**
   * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
   */
  public static containsRange(range: IRange, otherRange: IRange): boolean {
    if (
      otherRange.start.line < range.start.line ||
      otherRange.end.line < range.start.line
    ) {
      return false;
    }
    if (
      otherRange.start.line > range.end.line ||
      otherRange.end.line > range.end.line
    ) {
      return false;
    }
    if (
      otherRange.start.line === range.start.line &&
      otherRange.start.character < range.start.character
    ) {
      return false;
    }
    return !(
      otherRange.end.line === range.end.line &&
      otherRange.end.character > range.end.character
    );
  }

  /**
   * Test if `otherRange` is strictly in `range` (must start after, and end before). If the ranges are equal, will return false.
   */
  public static strictContainsRange(
    range: IRange,
    otherRange: IRange,
  ): boolean {
    if (
      otherRange.start.line < range.start.line ||
      otherRange.end.line < range.start.line
    ) {
      return false;
    }
    if (
      otherRange.start.line > range.end.line ||
      otherRange.end.line > range.end.line
    ) {
      return false;
    }
    if (
      otherRange.start.line === range.start.line &&
      otherRange.start.character <= range.start.character
    ) {
      return false;
    }
    return !(
      otherRange.end.line === range.end.line &&
      otherRange.end.character >= range.end.character
    );
  }

  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  public static plusRange(a: IRange, b: IRange): Range {
    let start: Position;
    let end: Position;

    if (b.start.line < a.start.line) {
      start = b.start;
    } else if (b.start.line === a.start.line) {
      start = new Position(
        b.start.line,
        Math.min(b.start.character, a.start.character),
      );
    } else {
      start = a.start;
    }

    if (b.end.line > a.end.line) {
      end = b.end;
    } else if (b.end.line === a.end.line) {
      end = new Position(
        b.end.line,
        Math.max(b.end.character, a.end.character),
      );
    } else {
      end = a.end;
    }

    return new Range(start.line, start.character, end.line, end.character);
  }

  /**
   * A intersection of the two ranges.
   */
  public static intersectRanges(a: IRange, b: IRange): Range | null {
    let resultStartLineNumber = a.start.line;
    let resultStartColumn = a.start.character;
    let resultEndLineNumber = a.end.line;
    let resultEndColumn = a.end.character;
    const otherStartLineNumber = b.start.line;
    const otherStartColumn = b.start.character;
    const otherEndLineNumber = b.end.line;
    const otherEndColumn = b.end.character;

    if (resultStartLineNumber < otherStartLineNumber) {
      resultStartLineNumber = otherStartLineNumber;
      resultStartColumn = otherStartColumn;
    } else if (resultStartLineNumber === otherStartLineNumber) {
      resultStartColumn = Math.max(resultStartColumn, otherStartColumn);
    }

    if (resultEndLineNumber > otherEndLineNumber) {
      resultEndLineNumber = otherEndLineNumber;
      resultEndColumn = otherEndColumn;
    } else if (resultEndLineNumber === otherEndLineNumber) {
      resultEndColumn = Math.min(resultEndColumn, otherEndColumn);
    }

    // Check if selection is now empty
    if (resultStartLineNumber > resultEndLineNumber) {
      return null;
    }
    if (
      resultStartLineNumber === resultEndLineNumber &&
      resultStartColumn > resultEndColumn
    ) {
      return null;
    }
    return new Range(
      resultStartLineNumber,
      resultStartColumn,
      resultEndLineNumber,
      resultEndColumn,
    );
  }

  /**
   * Test if range `a` equals `b`.
   */
  public static isEqual(
    a: IRange | null | undefined,
    b: IRange | null | undefined,
  ): boolean {
    if (!a && !b) {
      return true;
    }
    return (
      !!a &&
      !!b &&
      a.start.line === b.start.line &&
      a.start.character === b.start.character &&
      a.end.line === b.end.line &&
      a.end.character === b.end.character
    );
  }

  /**
   * Return the end position (which will be after or equal to the start position)
   */
  public static getEndPosition(range: IRange): Position {
    return new Position(range.end.line, range.end.character);
  }

  /**
   * Return the start position (which will be before or equal to the end position)
   */
  public static getStartPosition(range: IRange): Position {
    return new Position(range.start.line, range.start.character);
  }

  /**
   * Create a new empty range using this range's start position.
   */
  public static collapseToStart(range: IRange): Range {
    return new Range(
      range.start.line,
      range.start.character,
      range.start.line,
      range.start.character,
    );
  }

  /**
   * Create a new empty range using this range's end position.
   */
  public static collapseToEnd(range: IRange): Range {
    return new Range(
      range.end.line,
      range.end.character,
      range.end.line,
      range.end.character,
    );
  }

  public static fromPositions(start: IPosition, end: IPosition = start): Range {
    return new Range(start.line, start.character, end.line, end.character);
  }

  /**
   * Create a `Range` from an `IRange`.
   */
  public static lift(range: undefined | null): null;

  public static lift(range: IRange): Range;

  public static lift(range: IRange | undefined | null): Range | null;

  public static lift(range: IRange | undefined | null): Range | null {
    if (!range) {
      return null;
    }
    return new Range(
      range.start.line,
      range.start.character,
      range.end.line,
      range.end.character,
    );
  }

  /**
   * Test if `obj` is an `IRange`.
   */
  public static isIRange(obj: any): obj is IRange {
    return (
      obj &&
      typeof obj.start.line === 'number' &&
      typeof obj.start.character === 'number' &&
      typeof obj.end.line === 'number' &&
      typeof obj.end.character === 'number'
    );
  }

  /**
   * Test if the two ranges are touching in any way.
   */
  public static areIntersectingOrTouching(a: IRange, b: IRange): boolean {
    // Check if `a` is before `b`
    if (
      a.end.line < b.start.line ||
      (a.end.line === b.start.line && a.end.character < b.start.character)
    ) {
      return false;
    }

    // Check if `b` is before `a`
    if (
      b.end.line < a.start.line ||
      (b.end.line === a.start.line && b.end.character < a.start.character)
    ) {
      return false;
    }

    // These ranges must intersect
    return true;
  }

  /**
   * Test if the two ranges are intersecting. If the ranges are touching it returns true.
   */
  public static areIntersecting(a: IRange, b: IRange): boolean {
    // Check if `a` is before `b`
    if (
      a.end.line < b.start.line ||
      (a.end.line === b.start.line && a.end.character <= b.start.character)
    ) {
      return false;
    }

    // Check if `b` is before `a`
    if (
      b.end.line < a.start.line ||
      (b.end.line === a.start.line && b.end.character <= a.start.character)
    ) {
      return false;
    }

    // These ranges must intersect
    return true;
  }

  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the startPosition and then on the endPosition
   */
  public static compareRangesUsingStarts(
    a: IRange | null | undefined,
    b: IRange | null | undefined,
  ): number {
    if (a && b) {
      const aStartLineNumber = a.start.line | 0;
      const bStartLineNumber = b.start.line | 0;

      if (aStartLineNumber === bStartLineNumber) {
        const aStartColumn = a.start.character | 0;
        const bStartColumn = b.start.character | 0;

        if (aStartColumn === bStartColumn) {
          const aEndLineNumber = a.end.line | 0;
          const bEndLineNumber = b.end.line | 0;

          if (aEndLineNumber === bEndLineNumber) {
            const aEndColumn = a.end.character | 0;
            const bEndColumn = b.end.character | 0;
            return aEndColumn - bEndColumn;
          }
          return aEndLineNumber - bEndLineNumber;
        }
        return aStartColumn - bStartColumn;
      }
      return aStartLineNumber - bStartLineNumber;
    }
    const aExists = a ? 1 : 0;
    const bExists = b ? 1 : 0;
    return aExists - bExists;
  }

  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the endPosition and then on the startPosition
   */
  public static compareRangesUsingEnds(a: IRange, b: IRange): number {
    if (a.end.line === b.end.line) {
      if (a.end.character === b.end.character) {
        if (a.start.line === b.start.line) {
          return a.start.character - b.start.character;
        }
        return a.start.line - b.start.line;
      }
      return a.end.character - b.end.character;
    }
    return a.end.line - b.end.line;
  }

  /**
   * Test if the range spans multiple lines.
   */
  public static spansMultipleLines(range: IRange): boolean {
    return range.end.line > range.start.line;
  }

  /**
   * Test if this range is empty.
   */
  public isEmpty(): boolean {
    return Range.isEmpty(this);
  }

  /**
   * Test if position is in this range. If the position is at the edges, will return true.
   */
  public containsPosition(position: IPosition): boolean {
    return Range.containsPosition(this, position);
  }

  /**
   * Test if range is in this range. If the range is equal to this range, will return true.
   */
  public containsRange(range: IRange): boolean {
    return Range.containsRange(this, range);
  }

  /**
   * Test if `range` is strictly in this range. `range` must start after and end before this range for the result to be true.
   */
  public strictContainsRange(range: IRange): boolean {
    return Range.strictContainsRange(this, range);
  }

  // ---

  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  public plusRange(range: IRange): Range {
    return Range.plusRange(this, range);
  }

  /**
   * A intersection of the two ranges.
   */
  public intersectRanges(range: IRange): Range | null {
    return Range.intersectRanges(this, range);
  }

  /**
   * Test if this range equals other.
   */
  public isEqual(other: IRange | null | undefined): boolean {
    return Range.isEqual(this, other);
  }

  /**
   * Return the end position (which will be after or equal to the start position)
   */
  public getEndPosition(): Position {
    return Range.getEndPosition(this);
  }

  /**
   * Return the start position (which will be before or equal to the end position)
   */
  public getStartPosition(): Position {
    return Range.getStartPosition(this);
  }

  /**
   * Transform to a user presentable string representation.
   */
  public toString(): string {
    return (
      '[' +
      this.start.line +
      ',' +
      this.start.character +
      ' -> ' +
      this.end.line +
      ',' +
      this.end.character +
      ']'
    );
  }

  /**
   * Create a new range using this range's start position, and using end.line and end.character as the end position.
   */
  public setEndPosition(line: number, character: number): Range {
    return new Range(this.start.line, this.start.character, line, character);
  }

  /**
   * Create a new range using this range's end position, and using start.line and start.character as the start position.
   */
  public setStartPosition(line: number, character: number): Range {
    return new Range(line, character, this.end.line, this.end.character);
  }

  /**
   * Create a new empty range using this range's start position.
   */
  public collapseToStart(): Range {
    return Range.collapseToStart(this);
  }

  /**
   * Create a new empty range using this range's end position.
   */
  public collapseToEnd(): Range {
    return Range.collapseToEnd(this);
  }

  /**
   * Moves the range by the given amount of lines.
   */
  public delta(lineCount: number): Range {
    return new Range(
      this.start.line + lineCount,
      this.start.character,
      this.end.line + lineCount,
      this.end.character,
    );
  }

  public toJSON(): IRange {
    return this;
  }
}
