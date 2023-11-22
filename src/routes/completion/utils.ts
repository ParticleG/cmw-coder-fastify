import { SymbolInfo } from 'types/SymbolInfo';
import { Range } from 'types/vscode/range';
import { Logger } from 'types/Logger';

export const parseCursorString = (cursorString: string) => {
  const cursorMatches = cursorString
    .replace(/\\/g, '')
    .match(
      /^lnFirst="(.*?)";ichFirst="(.*?)";lnLast="(.*?)";ichLim="(.*?)";fExtended="(.*?)";fRect="(.*?)"$/,
    );
  if (!cursorMatches) {
    throw new Error('Invalid cursor format');
  }
  const [
    ,
    startLineString,
    startCharacterString,
    endLineString,
    endCharacterString,
  ] = [...cursorMatches];
  let startLine = parseInt(startLineString);
  let startCharacter = parseInt(startCharacterString);
  let endLine = parseInt(endLineString);
  let endCharacter = parseInt(endCharacterString);
  if (isNaN(startLine)) {
    Logger.warn('parseCursorString', 'startLine is NaN', cursorString);
    startLine = 0;
  }
  if (isNaN(startCharacter)) {
    Logger.warn('parseCursorString', 'startCharacter is NaN', cursorString);
    startCharacter = 0;
  }
  if (isNaN(endLine)) {
    Logger.warn('parseCursorString', 'endLine is NaN', cursorString);
    endLine = 0;
  }
  if (isNaN(endCharacter)) {
    Logger.warn('parseCursorString', 'endCharacter is NaN', cursorString);
    endCharacter = 0;
  }
  return new Range(startLine, startCharacter, endLine, endCharacter);
};

export const parseSymbolString = (symbolString: string): SymbolInfo[] => {
  return symbolString.length > 2
    ? symbolString
        .substring(1, symbolString.length - 1)
        .split('||')
        .map((substring) => {
          const [name, path, startLine, endLine] = substring.split('|');
          return {
            name,
            path: path.replace(/\\\\/g, '/'),
            startLine: parseInt(startLine),
            endLine: parseInt(endLine),
          };
        })
    : [];
};

export const parseTabString = (tabString: string): string[] => {
  return tabString.match(/.*?\.([ch])/g) ?? [];
}
