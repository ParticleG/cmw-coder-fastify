import { promises } from 'fs';

import {
  REGEXP_WORD,
  ROOT_FOLDERS,
} from 'src/components/PromptExtractor/constants';

const { readFile } = promises;

export const getRelativePath = (fullPath: string): string => {
  let result: string = fullPath;
  ROOT_FOLDERS.forEach((rootFolder) => {
    if (fullPath.includes(rootFolder)) {
      result = fullPath.substring(fullPath.indexOf(rootFolder));
    }
  });
  return result;
};

export const getAllOtherTabContents = async (
  tabPaths: string[],
): Promise<{ path: string; content: string }[]> => {
  return (await Promise.all(tabPaths.map((tabPath) => readFile(tabPath)))).map(
    (tabContent, index) => ({
      path: tabPaths[index],
      content: tabContent.toString(),
    }),
  );
};

export const isStartWithCapital = (word: string): boolean => {
  return word.charCodeAt(0) >= 65 && word.charCodeAt(0) <= 90;
};

export const separateTextByLine = (
  rawText: string,
  removeComments = false,
): string[] => {
  if (removeComments) {
    rawText = rawText.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  }
  return rawText
    .split('\n')
    .filter((tabContentLine) => tabContentLine.trim().length > 0);
};

export const tokenize = (
  rawText: string,
  ignoreRules: Array<Set<string>>,
  splitPattern: RegExp = REGEXP_WORD,
): Set<string> => {
  let tokens = rawText.split(splitPattern).filter((token) => token.length > 0);
  ignoreRules.forEach(
    (ignoreRule) => (tokens = tokens.filter((token) => !ignoreRule.has(token))),
  );
  return new Set(tokens);
};

export const getMostSimilarSnippetStartLine = (
  candidateTokens: Array<Set<string>>,
  referenceTokens: Set<string>,
  windowSize: number,
): {
  startLine: number;
  score: number;
} => {
  const currentMostSimilar = {
    startLine: 0,
    score: 0,
  };

  for (
    let startLineIndex = 0;
    startLineIndex + windowSize < candidateTokens.length;
    startLineIndex++
  ) {
    const windowedCandidateTokens = new Set(
      candidateTokens
        .slice(startLineIndex, startLineIndex + windowSize)
        .reduce(
          (accumulatedTokens, targetLineTokens) =>
            accumulatedTokens.concat([...targetLineTokens]),
          Array<string>(),
        ),
    );

    const intersectionTokens = new Set(
      [...windowedCandidateTokens].filter((targetToken) =>
        referenceTokens.has(targetToken),
      ),
    );

    const currentScore =
      intersectionTokens.size /
      (windowedCandidateTokens.size +
        referenceTokens.size -
        intersectionTokens.size);
    if (currentScore > currentMostSimilar.score) {
      currentMostSimilar.startLine = startLineIndex;
      currentMostSimilar.score = currentScore;
    }
  }
  return currentMostSimilar;
};
