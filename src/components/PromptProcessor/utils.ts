// @ts-ignore
import escapeStringRegexp from 'escape-string-regexp';

import { databaseManager } from "components/DatabaseManager";
import { ConfigType } from 'types/config';

// Start with '//' or '#', or end with '{' or '*/'
const detectRegex = /^(\/\/|#)|(\{|\*\/)$/;

export const removeRedundantTokens = (config: ConfigType, text: string) => {
  const separateTokens =
    config.promptProcessor.separateTokens.find(
      (separateToken) => separateToken.model == databaseManager.getModelType(),
    ) ?? config.promptProcessor.separateTokens[0];
  const { start, end, middle } = separateTokens;
  const { stopTokens } = config.promptProcessor;
  const regExp = `(${[end, middle, start, ...stopTokens]
    .map((token) => escapeStringRegexp(token))
    .join('|')})`;
  return text.replace(new RegExp(regExp, 'g'), '');
};

export const checkMultiLine = (prefix: string): boolean => {
  return detectRegex.test(prefix.trimEnd().split('\n').at(-1) ?? '');
};
