import { FastifyPluginAsync } from 'fastify';

import reactionReporter from 'components/ReactionReporter';
import { PromptExtractor } from 'components/PromptExtractor';
import { PromptProcessor } from 'components/PromptProcessor';
import { generateSchema, generateType } from 'routes/generate/schema';
import { TextDocument } from 'types/TextDocument';
import { Range } from 'types/vscode/range';
import * as console from 'console';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  const promptProcessor = new PromptProcessor(fastify.config);
  fastify.post<generateType>(
    '/',
    { schema: generateSchema },
    async (request) => {
      console.log(request.body);
      const { cursor, path, symbols, tabs, version } = request.body;
      const cursorRange = new Range(
        cursor.start.line,
        cursor.start.character,
        cursor.end.line,
        cursor.end.character,
      );
      reactionReporter.updateCursor(cursorRange);
      reactionReporter.updateVersion(version);
      try {
        const promptExtractor = new PromptExtractor(
          new TextDocument(path),
          cursorRange.start,
          1500,
        );
        const prompt = await promptExtractor.getPromptComp(tabs, symbols);
        const result = await promptProcessor.process(prompt);
        if (result) {
          return { result: 'success', content: result };
        } else {
          return { result: 'failure' };
        }
      } catch (e) {
        console.warn(e);
      }
      return { root: true };
    },
  );
});
