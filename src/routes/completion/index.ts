import { FastifyPluginAsync } from 'fastify';
import { decode, encode } from 'iconv-lite';

import { PromptExtractor } from 'components/PromptExtractor';
import { PromptProcessor } from 'components/PromptProcessor';
import {
  acceptSchema,
  acceptType,
  generateSchema,
  generateType,
} from 'routes/completion/schema';
import {
  parseCursorString,
  parseSymbolString,
  parseTabString,
} from 'routes/completion/utils';
import { TextDocument } from 'types/TextDocument';
import { Logger } from 'types/Logger';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  const promptProcessor = new PromptProcessor(fastify.config);
  fastify.post<acceptType>(
    '/accept',
    { schema: acceptSchema },
    async (request) => {
      const { completion, projectId, version } = request.body;
      const decodedCompletion = decode(
        Buffer.from(completion, 'base64'),
        'gb2312',
      );
      try {
        fastify.statistics.accept(
          decodedCompletion,
          Date.now(),
          Date.now(),
          projectId,
          version,
          fastify.config.userId,
        );
        return {
          result: 'success',
        };
      } catch (e) {
        Logger.warn('route.completion.accept', e);
        return { result: 'error' };
      }
    },
  );

  fastify.post<acceptType>(
    '/insert',
    { schema: acceptSchema },
    async (request) => {
      const { completion, projectId, version } = request.body;
      const decodedCompletion = decode(
        Buffer.from(completion, 'base64'),
        'gb2312',
      );
      try {
        fastify.statistics.generate(
          decodedCompletion,
          Date.now(),
          Date.now(),
          projectId,
          version,
          fastify.config.userId,
        );
        return {
          result: 'success',
        };
      } catch (e) {
        Logger.warn('route.completion.accept', e);
        return { result: 'error' };
      }
    },
  );

  fastify.post<generateType>(
    '/generate',
    { schema: generateSchema },
    async (request) => {
      const {
        cursorString,
        path,
        prefix,
        projectId,
        suffix,
        symbolString,
        tabString,
        version,
      } = request.body;
      const decodedPath = decode(Buffer.from(path, 'base64'), 'gb2312');
      const decodedPrefix = decode(Buffer.from(prefix, 'base64'), 'gb2312');
      const decodedSuffix = decode(Buffer.from(suffix, 'base64'), 'gb2312');
      const decodedSymbolString = decode(
        Buffer.from(symbolString, 'base64'),
        'gb2312',
      );
      const decodedTabString = decode(
        Buffer.from(tabString, 'base64'),
        'gb2312',
      );

      Logger.hint(
        'route.completion',
        JSON.stringify(
          {
            cursor: cursorString,
            path: decodedPath,
            prefix: decodedPrefix,
            projectId,
            suffix: decodedSuffix,
            symbolString: decodedSymbolString,
            tabString: decodedTabString,
            version,
          },
          null,
          2,
        ),
      );

      const cursorRange = parseCursorString(cursorString);
      const symbols = parseSymbolString(decodedSymbolString);
      const tabs = parseTabString(decodedTabString);

      try {
        fastify.statistics.updateCursor(cursorRange);
        const prompt = await new PromptExtractor(
          new TextDocument(decodedPath),
          cursorRange.start,
        ).getPromptComponents(tabs, symbols, decodedPrefix, decodedSuffix);
        const results = await promptProcessor.process(
          prompt,
          decodedPrefix,
          projectId,
        );
        return {
          result: 'success',
          contents: results.map((result) =>
            encode(result, 'gb2312').toString('base64'),
          ),
        };
      } catch (e) {
        Logger.warn('route.completion.generate', e);
        return { result: 'error', message: (<Error>e).message };
      }
    },
  );
});
