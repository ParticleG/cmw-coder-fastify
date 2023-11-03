import { SymbolInfo } from 'types/SymbolInfo';
import { Range } from 'types/vscode/range';

export const parseEditorInfo = (rawText: string) => {
  const matchResult = rawText.match(
    /^cursor="(.*?)";path="(.*?)";project="(.*?)";tabs="(.*?)";version="(.*?)";symbols="(.*?)";prefix="(.*?)";suffix="(.*?)"$/,
  );
  if (!matchResult) {
    throw new Error('Invalid editor info format');
  }
  const [
    ,
    cursorString,
    currentFilePath,
    projectFolder,
    tabsString,
    ,
    symbolString,
    prefix,
    suffix,
  ] = [...matchResult];
  const cursorMatches = cursorString
    .replace(/\\/g, '')
    .match(
      /^lnFirst="(.*?)";ichFirst="(.*?)";lnLast="(.*?)";ichLim="(.*?)";fExtended="(.*?)";fRect="(.*?)"$/,
    );
  if (!cursorMatches) {
    throw new Error('Invalid cursor format');
  }
  const [, startLine, startCharacter, endLine, endCharacter] = [
    ...cursorMatches,
  ];

  const symbols: SymbolInfo[] =
    symbolString.length > 2
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

  return {
    currentFilePath: currentFilePath.replace(/\\\\/g, '/'),
    projectFolder: projectFolder.replace(/\\\\/g, '/'),
    openedTabs: tabsString.match(/.*?\.([ch])/g) ?? [],
    cursorRange: new Range(
      parseInt(startLine),
      parseInt(startCharacter),
      parseInt(endLine),
      parseInt(endCharacter),
    ),
    symbols,
    prefix: prefix.replace(/\\\\r\\\\n/g, '\r\n').replace(/\\=/g, '='),
    suffix: suffix.replace(/\\\\r\\\\n/g, '\r\n').replace(/\\=/g, '='),
  };
};
