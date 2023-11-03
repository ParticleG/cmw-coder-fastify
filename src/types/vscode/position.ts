export interface IPosition {
  /**
   * line number (starts at 1)
   */
  readonly line: number;
  /**
   * character (the first character in a line is between character 1 and character 2)
   */
  readonly character: number;
}

export class Position {
  public readonly line: number;

  public readonly character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  /**
   * Test if position `a` equals position `b`
   */
  public static equals(a: IPosition | null, b: IPosition | null): boolean {
    if (!a && !b) {
      return true;
    }
    return !!a && !!b && a.line === b.line && a.character === b.character;
  }

  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be false.
   */
  public static isBefore(a: IPosition, b: IPosition): boolean {
    if (a.line < b.line) {
      return true;
    }
    if (b.line < a.line) {
      return false;
    }
    return a.character < b.character;
  }

  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be true.
   */
  public static isBeforeOrEqual(a: IPosition, b: IPosition): boolean {
    if (a.line < b.line) {
      return true;
    }
    if (b.line < a.line) {
      return false;
    }
    return a.character <= b.character;
  }

  /**
   * A function that compares positions useful for sorting
   */
  public static compare(a: IPosition, b: IPosition): number {
    const aLineNumber = a.line | 0;
    const bLineNumber = b.line | 0;

    if (aLineNumber === bLineNumber) {
      const aColumn = a.character | 0;
      const bColumn = b.character | 0;
      return aColumn - bColumn;
    }

    return aLineNumber - bLineNumber;
  }

  /**
   * Create a `Position` from an `IPosition`.
   */
  public static lift(pos: IPosition): Position {
    return new Position(pos.line, pos.character);
  }

  /**
   * Test if `obj` is an `IPosition`.
   */
  public static isIPosition(obj: any): obj is IPosition {
    return (
      obj && typeof obj.line === 'number' && typeof obj.character === 'number'
    );
  }

  /**
   * Create a new position from this position.
   *
   * @param newLineNumber new line number
   * @param newColumn new character
   */
  with(
    newLineNumber: number = this.line,
    newColumn: number = this.character,
  ): Position {
    if (newLineNumber === this.line && newColumn === this.character) {
      return this;
    } else {
      return new Position(newLineNumber, newColumn);
    }
  }

  /**
   * Derive a new position from this position.
   *
   * @param deltaLineNumber line number delta
   * @param deltaColumn character delta
   */
  delta(deltaLineNumber: number = 0, deltaColumn: number = 0): Position {
    return this.with(this.line + deltaLineNumber, this.character + deltaColumn);
  }

  /**
   * Test if this position equals another position
   */
  public equals(other: IPosition): boolean {
    return Position.equals(this, other);
  }

  /**
   * Test if this position is before another position.
   * If the two positions are equal, the result will be false.
   */
  public isBefore(other: IPosition): boolean {
    return Position.isBefore(this, other);
  }

  /**
   * Test if this position is before another position.
   * If the two positions are equal, the result will be true.
   */
  public isBeforeOrEqual(other: IPosition): boolean {
    return Position.isBeforeOrEqual(this, other);
  }

  // ---

  /**
   * Clone this position.
   */
  public clone(): Position {
    return new Position(this.line, this.character);
  }

  /**
   * Convert to a human-readable representation.
   */
  public toString(): string {
    return '(' + this.line + ',' + this.character + ')';
  }
}
