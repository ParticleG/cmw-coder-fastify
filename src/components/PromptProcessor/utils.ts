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
