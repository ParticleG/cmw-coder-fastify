// @ts-ignore
import escapeStringRegexp from 'escape-string-regexp';

import { ConfigType } from 'types/config';

// Start with '//' or '#', or end with '{' or '*/'
const detectRegex = /^(\/\/|#)|(\{|\*\/)$/;

export const removeRedundantTokens = (config: ConfigType, text: string) => {
  const {
    separateTokens: { end, middle, start },
    stopTokens,
  } = config.promptProcessor;
  const regExp = `(${[end, middle, start, ...stopTokens]
    .map((token) => escapeStringRegexp(token))
    .join('|')})`;
  return text.replace(new RegExp(regExp, 'g'), '');
};

export const checkMultiLine = (prefix: string): boolean => {
  return detectRegex.test(prefix.trimEnd().split('\n').at(-1) ?? '');
};
