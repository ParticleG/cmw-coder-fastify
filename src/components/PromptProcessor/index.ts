import 'core-js/actual/array/at';
import { createHash } from 'crypto';

import { PromptComponents } from 'components/PromptExtractor/types';
import { LRUCache } from 'components/PromptProcessor/types';
import {
  checkMultiLine,
  removeRedundantTokens,
} from 'components/PromptProcessor/utils';
import reactionReporter from 'components/ReactionReporter';
import { ConfigType } from 'types/config';
import { generate } from 'utils/axios';

export class PromptProcessor {
  private _cache = new LRUCache<string>(100);
  private _config: ConfigType;

  constructor(config: ConfigType) {
    this._config = config;
  }

  async process(
    promptComponents: PromptComponents,
    projectId: string,
    prefix: string,
  ): Promise<string[] | undefined> {
    const promptString = this._getPromptString(promptComponents);
    const { stopTokens, suggestionCount, temperature } =
      this._config.promptProcessor;
    try {
      const generatedSuggestions: string[] = [];
      const startTime = Date.now();
      const {
        data: {
          details: { best_of_sequences },
          generated_text,
        },
      } = await generate(this._config.endpoint, {
        inputs: promptString,
        parameters: {
          best_of: suggestionCount,
          details: true,
          do_sample: true,
          max_new_tokens: 60,
          stop: stopTokens,
          temperature: temperature,
          top_p: 0.95,
        },
      });
      if (best_of_sequences && best_of_sequences.length) {
        generatedSuggestions.push(
          ...best_of_sequences.map((bestOfSequence) =>
            bestOfSequence.generated_text.trimStart(),
          ),
        );
      } else {
        generatedSuggestions.push(generated_text.trimStart());
      }
      reactionReporter
        .reportGeneration(Date.now() - startTime, projectId)
        .catch(console.warn);
      return this._processGeneratedSuggestions(
        promptString,
        generatedSuggestions,
        prefix,
      );
    } catch (e) {
      console.warn(e);
    }
  }

  private _getPromptString(promptComponents: PromptComponents): string {
    const { start, end, middle } = this._config.promptProcessor.separateTokens;
    const result = [];

    if (promptComponents.reponame.length) {
      result.push('<reponame>', promptComponents.reponame);
    }
    if (promptComponents.filename.length) {
      result.push('<filename>', promptComponents.filename);
    }
    result.push(start, promptComponents.prefix);
    result.push(end, promptComponents.suffix);
    result.push(middle);
    const promptString = result.join('');

    const promptKey = createHash('sha1').update(promptString).digest('base64');
    const promptCached = this._cache.get(promptKey);
    if (promptCached) {
      return promptCached;
    } else {
      this._cache.put(promptKey, promptString);
      return promptString;
    }
  }

  private _processGeneratedSuggestions(
    promptString: string,
    generatedSuggestions: string[],
    prefix: string,
  ): string[] {
    const isMultiLine = checkMultiLine(prefix);
    const processed = generatedSuggestions
      .map((generatedSuggestion) =>
        generatedSuggestion.substring(0, promptString.length) === promptString
          ? generatedSuggestion.substring(promptString.length)
          : generatedSuggestion,
      )
      .map((generatedSuggestion) =>
        removeRedundantTokens(this._config, generatedSuggestion),
      )
      .map((generatedSuggestion) =>
        generatedSuggestion.replace(/\r\n|\n/g, '\\r\\n'),
      )
      .map(
        (generatedSuggestion) =>
          (isMultiLine ? '1' : '0') + generatedSuggestion,
      );
    // TODO: Replace Date Created if needed.
    console.log({ processed });

    return processed;

    /*return [
          ...processed,
          ...processed.map((generatedSuggestion) =>
            generatedSuggestion
              .split('\\r\\n')
              .map((generatedSuggestionLine) =>
                String(
                  new TextEncoder().encode(generatedSuggestionLine).length,
                ).padStart(3, '0'),
              )
              .join(''),
          ),
        ].join('\n');*/
  }
}
