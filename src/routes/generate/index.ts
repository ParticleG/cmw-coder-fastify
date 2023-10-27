import { FastifyPluginAsync } from 'fastify';
import { decode, encode } from 'iconv-lite';

import reactionReporter from 'components/ReactionReporter';
import { PromptExtractor } from 'components/PromptExtractor';
import { PromptProcessor } from 'components/PromptProcessor';
import { generateSchema, generateType } from 'routes/generate/schema';
import { TextDocument } from 'types/TextDocument';
import { Range } from 'types/vscode/range';
import * as console from 'console';
import { SymbolInfo } from 'types/SymbolInfo';

const parseEditorInfo = (rawText: string) => {
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

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  const promptProcessor = new PromptProcessor(fastify.config);
  fastify.post<generateType>(
    '/generate',
    { schema: generateSchema },
    async (request) => {
      const {info, projectId, version} = request.body;
      const decodedInfo = decode(
        Buffer.from(info, 'base64'),
        'gb2312',
      );
      console.log(decodedInfo);
      try {
        const {
          currentFilePath,
          cursorRange,
          openedTabs,
          symbols,
          prefix,
          suffix,
        } = parseEditorInfo(decodedInfo);
        console.log({
          currentFilePath,
          cursorRange,
          openedTabs,
          symbols,
          version,
          prefix,
          suffix,
        });
        reactionReporter.updateCursor(cursorRange);
        reactionReporter.updateVersion(version);
        const promptExtractor = new PromptExtractor(
          new TextDocument(currentFilePath),
          cursorRange.start,
        );
        const prompt = await promptExtractor.getPromptComp(
          openedTabs,
          symbols,
          prefix,
          suffix,
        );
        const results = await promptProcessor.process(prompt, projectId, prefix);
        if (results) {
          return {
            result: 'success',
            contents: results.map((result) =>
              encode(result, 'gb2312').toString('base64'),
            ),
          };
        } else {
          return { result: 'failure' };
        }
      } catch (e) {
        console.warn(e);
        return { result: 'error', message: (<Error>e).message };
      }
    },
  );
});
