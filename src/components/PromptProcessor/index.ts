import 'core-js/actual/array/at';
import { createHash } from 'crypto';
import * as console from 'console';

import { databaseManager } from 'components/DatabaseManager';
import { PromptComponents } from 'components/PromptExtractor/types';
import { LRUCache } from 'components/PromptProcessor/types';
import {
  checkMultiLine,
  removeRedundantTokens,
} from 'components/PromptProcessor/utils';
import { ConfigType } from 'types/config';
import { generate, generateRd } from 'utils/axios';
import { loginPrompt } from 'utils/script';

export class PromptProcessor {
  private _cache = new LRUCache<string[]>(100);
  private _config: ConfigType;

  constructor(config: ConfigType) {
    this._config = config;
  }

  async process(
    promptComponents: PromptComponents,
    prefix: string,
    projectId: string,
  ): Promise<string[]> {
    const cacheKey = createHash('sha1')
      .update(promptComponents.prefix)
      .digest('base64');
    const promptCached = this._cache.get(cacheKey);
    if (promptCached) {
      console.log({ promptCached });
      return promptCached;
    }

    const endpoint =
      this._config.endpoints.find(
        (endpoint) => endpoint.model == databaseManager.getModelType(),
      )?.endpoint ?? this._config.endpoints[0].endpoint;
    const isSnippet = checkMultiLine(prefix);
    let processedSuggestions: string[] = [];
    try {
      if (databaseManager.getModelType() === 'LS13B') {
        let accessToken = await databaseManager.accessToken();
        if (!accessToken) {
          await loginPrompt(this._config.userId);
          accessToken = await databaseManager.accessToken();
        }
        processedSuggestions = this._processGeneratedSuggestions(
          promptComponents.prefix,
          await this._generateRd(
            endpoint,
            accessToken!,
            promptComponents,
            isSnippet,
            projectId,
          ),
          isSnippet,
        );
      } else {
        const promptString = this._getPromptString(promptComponents);
        processedSuggestions = this._processGeneratedSuggestions(
          promptString,
          await this._generate(endpoint, promptString, isSnippet),
          isSnippet,
        );
      }
    } catch (e) {
      console.warn(e);
    }
    console.log({ processedSuggestions });
    if (processedSuggestions.length) {
      this._cache.put(cacheKey, processedSuggestions);
    }
    return processedSuggestions;
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
    return result.join('');
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
  }

  private async _generate(
    endpoint: string,
    promptString: string,
    isSnippet: boolean,
  ): Promise<string[]> {
    const { maxNewTokens, stopTokens, suggestionCount, temperature } =
      this._config.promptProcessor;
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
        max_new_tokens: isSnippet ? maxNewTokens.snippet : maxNewTokens.line,
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
    return generatedSuggestions;
  }

  private async _generateRd(
    endpoint: string,
    accessToken: string,
    promptComponents: PromptComponents,
    isSnippet: boolean,
    projectId: string,
  ): Promise<string[]> {
    const { maxNewTokens, stopTokens, temperature } =
      this._config.promptProcessor;
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
        subType: projectId,
      },
      accessToken,
    );
    return data
      .map((item) => item.text)
      .filter((completion) => completion.trim().length > 0);
  }
}
