// @ts-ignore
import escapeStringRegexp from 'escape-string-regexp';

import { ConfigType } from 'types/config';

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

export const checkMultiLine = (fullPrefix: string): boolean => {
  const lines = fullPrefix.split(/\n|\r\n/);
  const regex = /(^\/\/|#)|((\{|\*\/)$)/;
  let lastNotEmptyLine = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.trim() !== '') {
      lastNotEmptyLine = line.trim();
      break;
    }
  }
  return regex.test(lastNotEmptyLine);
};
