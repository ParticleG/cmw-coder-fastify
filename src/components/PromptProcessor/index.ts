import 'core-js/actual/array/at';
import * as console from 'console';
import { createHash } from 'crypto';

import { databaseManager } from 'components/DatabaseManager';
import { PromptComponents } from 'components/PromptExtractor/types';
import { LRUCache } from 'components/PromptProcessor/types';
import {
  checkMultiLine,
  removeRedundantTokens,
} from 'components/PromptProcessor/utils';
import reactionReporter from 'components/ReactionReporter';
import { ConfigType } from 'types/config';
import { generate, generateRd } from 'utils/axios';
import { loginPrompt } from 'utils/script';

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
        (endpoint) => endpoint.model == databaseManager.getModelType(),
      )?.endpoint ?? this._config.endpoints[0].endpoint;
    const { maxNewTokens, stopTokens, suggestionCount, temperature } =
      this._config.promptProcessor;
    try {
      const startTime = Date.now();
      const isSnippet = checkMultiLine(prefix);
      let processedSuggestion = '';
      if (databaseManager.getModelType() === 'LINSEER') {
        let accessToken = await databaseManager.accessToken();
        if (!accessToken) {
          await loginPrompt();
          accessToken = await databaseManager.accessToken();
        }
        const { data } = await generateRd(
          endpoint,
          {
            question: promptComponents.prefix,
            model: isSnippet ? 'linseer-code-34b' : 'linseer-code-13b',
            maxTokens: isSnippet ? maxNewTokens.snippet : maxNewTokens.line,
            temperature: temperature,
            stop: stopTokens,
            suffix: promptComponents.suffix,
            plugin: 'SI',
            profileModel: '百业灵犀-13B',
            templateName: isSnippet ? 'LineCode' : 'ShortLineCode',
          },
          accessToken!,
        );
        const generatedSuggestions: string[] = data
          .map((item) => item.text)
          .filter((completion) => completion.trim().length > 0);
        if (generatedSuggestions.length) {
          const processedSuggestions = this._processGeneratedSuggestions(
            '',
            generatedSuggestions,
            isSnippet,
          );
          console.log({ processedSuggestions });
          if (processedSuggestions.length) {
            processedSuggestion = processedSuggestions[0];
          }
        }
      } else {
        const promptString = this._getPromptString(promptComponents);
        const {
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
            max_new_tokens: isSnippet
              ? maxNewTokens.snippet
              : maxNewTokens.line,
            stop: stopTokens,
            temperature: temperature,
            top_p: 0.95,
          },
        });
        const generatedSuggestions: string[] = [];
        if (best_of_sequences && best_of_sequences.length) {
          generatedSuggestions.push(
            ...best_of_sequences.map((bestOfSequence) =>
              isSnippet
                ? bestOfSequence.generated_text
                : bestOfSequence.generated_text.trimStart(),
            ),
          );
        } else {
          generatedSuggestions.push(
            isSnippet ? generated_text : generated_text.trimStart(),
          );
        }
        const processedSuggestions = this._processGeneratedSuggestions(
          promptString,
          generatedSuggestions,
          isSnippet,
        );
        console.log({ processedSuggestions });
        if (processedSuggestions.length) {
          processedSuggestion = processedSuggestions[0];
        }
      }

      if (processedSuggestion.length) {
        reactionReporter
          .reportGeneration(
            processedSuggestion,
            Date.now() - startTime,
            databaseManager.getModelType() ?? this._config.availableModels[0],
            projectId,
          )
          .catch(console.warn);
        return [processedSuggestion];
      }
      return [];
    } catch (e) {
      console.warn(e);
    }
  }

  private _getPromptString(promptComponents: PromptComponents): string {
    const separateTokens =
      this._config.promptProcessor.separateTokens.find(
        (separateToken) =>
          separateToken.model == databaseManager.getModelType(),
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
    isSnippet: boolean,
  ): string[] {
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
        isSnippet ? generatedSuggestion : generatedSuggestion.trimStart(),
      )
      .map((generatedSuggestion) =>
        generatedSuggestion.replace(/\r\n|\n/g, '\\r\\n'),
      )
      .map((generatedSuggestion) =>
        isSnippet
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
