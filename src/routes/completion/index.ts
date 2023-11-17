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
import { parseEditorInfo } from 'routes/completion/utils';
import { TextDocument } from 'types/TextDocument';
import { Logger } from 'types/Logger';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.post<acceptType>(
    '/accept',
    { schema: acceptSchema },
    async (request) => {
      const { completion, projectId, version } = request.body;
      const decodedCompletion = decode(Buffer.from(completion, 'base64'), 'gb2312');
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
      const decodedCompletion = decode(Buffer.from(completion, 'base64'), 'gb2312');
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
      const { info, projectId } = request.body;
      const decodedInfo = decode(Buffer.from(info, 'base64'), 'gb2312');

      Logger.hint('route.completion', JSON.stringify({ decodedInfo }, null, 2));

      try {
        const {
          currentFilePath,
          cursorRange,
          openedTabs,
          symbols,
          prefix,
          suffix,
        } = parseEditorInfo(decodedInfo);
        fastify.statistics.updateCursor(cursorRange);
        const prompt = await new PromptExtractor(
          new TextDocument(currentFilePath),
          cursorRange.start,
        ).getPromptComponents(openedTabs, symbols, prefix, suffix);
        const results = await new PromptProcessor(fastify.config).process(
          prompt,
          prefix,
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
