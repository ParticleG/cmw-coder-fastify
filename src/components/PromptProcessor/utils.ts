// @ts-ignore
import escapeStringRegexp from 'escape-string-regexp';

import { ModelConfigType } from "types/config";

// Start with '//' or '#', or end with '{' or '*/'
const detectRegex = /^(\/\/|#)|(\{|\*\/)$/;

export const removeRedundantTokens = (modelConfig: ModelConfigType, text: string) => {
  if (!modelConfig.separateTokens) {
    return text;
  }
  const { start, end, middle } = modelConfig.separateTokens;
  const regExp = `(${[end, middle, start, ...modelConfig.stopTokens]
    .map((token) => escapeStringRegexp(token))
    .join('|')})`;
  return text.replace(new RegExp(regExp, 'g'), '');
};

export const checkMultiLine = (prefix: string): boolean => {
  return detectRegex.test(prefix.trimEnd().split('\n').at(-1) ?? '');
};
