import { Range } from 'types/vscode/range';

export interface TextLine {
  /**
   * The zero-based line number.
   */
  readonly lineNumber: number;

  /**
   * The text of this line without the line separator characters.
   */
  readonly text: string;

  /**
   * The range this line covers without the line separator characters.
   */
  readonly range: Range;

  /**
   * The range this line covers with the line separator characters.
   */
  readonly rangeIncludingLineBreak: Range;

  /**
   * The offset of the first character, which is not a space character as defined
   * by `/\s/`. **Note** that if a line is all space, the length of the line is returned.
   */
  readonly firstNonWhitespaceCharacterIndex: number;

  /**
   * Whether this line is space only, shorthand
   * for {@link TextLine.firstNonWhitespaceCharacterIndex} === {@link TextLine.text TextLine.text.length}.
   */
  readonly isEmptyOrWhitespace: boolean;
}
