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
import * as console from 'console';

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
    const endpoint =
      this._config.endpoints.find(
        (endpoint) => endpoint.model == this._config.currentModel,
      )?.endpoint ?? this._config.endpoints[0].endpoint;
    const promptString = this._getPromptString(promptComponents);
    const { maxNewTokens, stopTokens, suggestionCount, temperature } =
      this._config.promptProcessor;
    try {
      const generatedSuggestions: string[] = [];
      const startTime = Date.now();
      const isMultiLine = checkMultiLine(prefix);
      /*const {
        data: {
          details: { best_of_sequences },
          generated_text,
        },
      } = await generate(endpoint, {
        inputs: promptString,
        parameters: {
          best_of: suggestionCount,
          details: true,
          do_sample: true,
          max_new_tokens: isMultiLine
            ? maxNewTokens.snippet
            : maxNewTokens.line,
          stop: stopTokens,
          temperature: temperature,
          top_p: 0.95,
        },
      });*/
      const response = await generate(endpoint, {
        inputs: promptString,
        parameters: {
          best_of: suggestionCount,
          details: true,
          do_sample: true,
          max_new_tokens: isMultiLine
            ? maxNewTokens.snippet
            : maxNewTokens.line,
          stop: stopTokens,
          temperature: temperature,
          top_p: 0.95,
        },
      });
      // console.log(response);
      const {
        data: {
          details: { best_of_sequences },
          generated_text,
        },
      } = response;
      if (best_of_sequences && best_of_sequences.length) {
        generatedSuggestions.push(
          ...best_of_sequences.map((bestOfSequence) =>
            isMultiLine
              ? bestOfSequence.generated_text
              : bestOfSequence.generated_text.trimStart(),
          ),
        );
      } else {
        generatedSuggestions.push(
          isMultiLine ? generated_text : generated_text.trimStart(),
        );
      }
      const processedSuggestions = this._processGeneratedSuggestions(
        promptString,
        generatedSuggestions,
        prefix,
      );
      console.log({ processedSuggestions });
      if (processedSuggestions.length) {
        reactionReporter
          .reportGeneration(
            processedSuggestions[0],
            Date.now() - startTime,
            this._config.currentModel,
            projectId,
          )
          .catch(console.warn);
      }
      return processedSuggestions;
    } catch (e) {
      console.warn(e);
    }
  }

  private _getPromptString(promptComponents: PromptComponents): string {
    const separateTokens =
      this._config.promptProcessor.separateTokens.find(
        (separateToken) => separateToken.model == this._config.currentModel,
      ) ?? this._config.promptProcessor.separateTokens[0];
    const { start, end, middle } = separateTokens;
    const result = [];

    if (promptComponents.reponame.length) {
      result.push(`<reponame>${promptComponents.reponame}`);
    }
    if (promptComponents.filename.length) {
      result.push(`<filename>${promptComponents.filename}`);
    }
    result.push(start + promptComponents.prefix);
    result.push(end + promptComponents.suffix);
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
    // TODO: Replace Date Created if needed.
    return generatedSuggestions
      .map((generatedSuggestion) =>
        generatedSuggestion.substring(0, promptString.length) === promptString
          ? generatedSuggestion.substring(promptString.length)
          : generatedSuggestion,
      )
      .map((generatedSuggestion) =>
        removeRedundantTokens(this._config, generatedSuggestion),
      )
      .filter((generatedSuggestion) => generatedSuggestion.length > 0)
      .map((generatedSuggestion) =>
        generatedSuggestion.replace(/\r\n|\n/g, '\\r\\n'),
      )
      .map((generatedSuggestion) =>
        isMultiLine
          ? '1' + generatedSuggestion
          : '0' + generatedSuggestion.split('\\r\\n')[0].trimEnd(),
      );

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
