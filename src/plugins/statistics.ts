import axios from 'axios';
import fastifyPlugin from 'fastify-plugin';

import { databaseManager } from 'components/DatabaseManager';
import { USER_NAME } from 'utils/constants';
import { Range } from 'types/vscode/range';
import { ModelType } from 'types/common';

let currentCursor: Range = new Range(0, 0, 0, 0);
let lastCursor: Range = new Range(0, 0, 0, 0);

const constructData = (
  completion: string,
  startTime: number,
  endTime: number,
  projectId: string,
  version: string,
  modelType: ModelType,
  isAccept: boolean,
) => {
  const isSnippet = completion[0] === '1';
  const content = isSnippet
    ? completion.substring(1)
    : completion.substring(1).split('\\r\\n')[0];
  const lines = content.split('\\r\\n').length;
  const basicData = {
    begin: Math.floor(startTime / 1000),
    end: Math.floor(endTime / 1000),
    extra: version,
    product: 'SI',
    secondClass: modelType,
    subType: projectId,
    type: 'AIGC',
    user: USER_NAME,
    userType: 'USER',
  };

  return [
    {
      ...basicData,
      count: lines,
      firstClass: 'CODE',
      skuName: isAccept ? 'ADOPT' : 'GENE',
    },
    {
      ...basicData,
      count: content.length,
      firstClass: isAccept ? 'ADOPT_CHAR' : 'GENE_CHAR',
    },
  ];
};

export default fastifyPlugin(async (fastify) => {
  fastify.statistics = {} as any;
  fastify.statistics.accept = async (
    completion: string,
    startTime: number,
    endTime: number,
    projectId: string,
    version: string,
  ) => {
    try {
      await axios
        .create({
          baseURL: fastify.config.statistics.endpoint,
        })
        .post(
          '/report/summary',
          constructData(
            completion,
            startTime,
            endTime,
            projectId,
            version,
            databaseManager.getModelType() ?? fastify.config.availableModels[0],
            true,
          ),
        );
    } catch (e) {
      console.error(e);
    }
  };
  fastify.statistics.generate = async (
    completion: string,
    startTime: number,
    endTime: number,
    projectId: string,
    version: string,
  ) => {
    if (currentCursor.end.line == lastCursor.end.line) {
      return;
    }
    try {
      await axios
        .create({
          baseURL: fastify.config.statistics.endpoint,
        })
        .post(
          '/report/summary',
          constructData(
            completion,
            startTime,
            endTime,
            projectId,
            version,
            databaseManager.getModelType() ?? fastify.config.availableModels[0],
            false,
          ),
        );
    } catch (e) {
      console.error(e);
    }
  };

  fastify.statistics.updateCursor = (cursor: Range) => {
    lastCursor = currentCursor;
    currentCursor = cursor;
  };
});

declare module 'fastify' {
  // noinspection JSUnusedGlobalSymbols
  interface FastifyInstance {
    statistics: {
      accept: (
        completion: string,
        startTime: number,
        endTime: number,
        projectId: string,
        version: string,
      ) => void;
      generate: (
        completion: string,
        startTime: number,
        endTime: number,
        projectId: string,
        version: string,
      ) => Promise<void>;
      updateCursor: (cursor: Range) => void;
    };
  }
}
