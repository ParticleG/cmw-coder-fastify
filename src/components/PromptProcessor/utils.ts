import 'core-js/actual/array/at';
// @ts-ignore
import escapeStringRegexp from 'escape-string-regexp';

import {
  HuggingFaceModelConfigType,
  LinseerModelConfigType,
  SeparateTokens,
} from 'components/Configurator/types';
import { PromptComponents } from 'components/PromptExtractor/types';
import { generate, generateRd } from 'utils/axios';

// Start with '//' or '#', or end with '{' or '*/'
const detectRegex = /^(\/\/|#)|(\{|\*\/)$/;

export const checkIsSnippet = (prefix: string): boolean => {
  const lastLine = prefix.trimEnd().split('\n').at(-1) ?? '';
  return detectRegex.test(lastLine) && (lastLine == lastLine.trimStart());
};

export const getPromptString = (
  promptComponents: PromptComponents,
  separateTokens: SeparateTokens,
): string => {
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
};

export const processHuggingFaceApi = async (
  modelConfig: HuggingFaceModelConfigType,
  promptComponents: PromptComponents,
  isSnippet: boolean,
): Promise<string[]> => {
  const { completionConfigs, separateTokens } = modelConfig;
  const completionConfig = isSnippet
    ? completionConfigs.snippet
    : completionConfigs.line;
  const { endpoint, maxTokenCount, stopTokens, suggestionCount, temperature } =
    completionConfig;

  const {
    data: {
      details: { best_of_sequences },
      generated_text,
    },
  } = await generate(endpoint, {
    inputs: getPromptString(promptComponents, separateTokens),
    parameters: {
      best_of: suggestionCount,
      details: true,
      do_sample: true,
      max_new_tokens: maxTokenCount,
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

  return _processGeneratedSuggestions(
    promptComponents.prefix,
    separateTokens,
    completionConfig.stopTokens,
    generatedSuggestions,
    isSnippet,
  );
};

export const processLinseerApi = async (
  modelConfig: LinseerModelConfigType,
  accessToken: string,
  promptComponents: PromptComponents,
  isSnippet: boolean,
  projectId: string,
): Promise<string[]> => {
  const { completionConfigs, endpoint } = modelConfig;
  const completionConfig = isSnippet
    ? completionConfigs.snippet
    : completionConfigs.line;
  const { maxTokenCount, stopTokens, subModelType, temperature } =
    completionConfig;

  const generatedSuggestions = (
    await generateRd(
      endpoint,
      {
        question: promptComponents.prefix,
        model: subModelType,
        maxTokens: maxTokenCount,
        temperature: temperature,
        stop: stopTokens,
        suffix: promptComponents.suffix,
        plugin: 'SI',
        profileModel: '百业灵犀-13B',
        templateName: isSnippet ? 'LineCode' : 'ShortLineCode',
        subType: projectId,
      },
      accessToken,
    )
  ).data
    .map((item) => item.text)
    .filter((completion) => completion.trim().length > 0);

  return _processGeneratedSuggestions(
    promptComponents.prefix,
    undefined,
    completionConfig.stopTokens,
    generatedSuggestions,
    isSnippet,
  );
};

const _processGeneratedSuggestions = (
  promptString: string,
  separateTokens: SeparateTokens | undefined,
  stopTokens: string[],
  generatedSuggestions: string[],
  isSnippet: boolean,
): string[] => {
  // TODO: Replace Date Created if needed.
  return generatedSuggestions
    .map((generatedSuggestion) =>
      generatedSuggestion.substring(0, promptString.length) === promptString
        ? generatedSuggestion.substring(promptString.length)
        : generatedSuggestion,
    )
    .map((generatedSuggestion) => {
      const combinedTokens = [...stopTokens];
      if (separateTokens) {
        const { start, end, middle } = separateTokens;
        combinedTokens.push(start, end, middle);
      }
      const regExp = `(${combinedTokens
        .map((token) => escapeStringRegexp(token))
        .join('|')})`;
      return generatedSuggestion.replace(new RegExp(regExp, 'g'), '');
    })
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
};
