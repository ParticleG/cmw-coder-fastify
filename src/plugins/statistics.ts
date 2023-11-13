import axios from 'axios';
import fastifyPlugin from 'fastify-plugin';

import { databaseManager } from 'components/DatabaseManager';
import { Range } from 'types/vscode/range';
import { ModelType } from 'types/common';

let currentCursor: Range = new Range(0, 0, 0, 0);
let lastCursor: Range = new Range(0, 0, 0, 0);

const secondClassMap = new Map<ModelType, string>([
  ["Comware-V1", "CMW"],
  ["Comware-V2", "CODELLAMA"],
  ["Linseer", "LS13B"],
  ["Linseer-SR88Driver", "LS13B"],
]);

const constructData = (
  completion: string,
  startTime: number,
  endTime: number,
  projectId: string,
  version: string,
  username: string,
  modelType: ModelType,
  isAccept: boolean,
) => {
  const isSnippet = completion[0] === '1';
  const lines = isSnippet ? completion.substring(1).split('\\r\\n').length : 1;
  const basicData = {
    begin: Math.floor(startTime / 1000),
    end: Math.floor(endTime / 1000),
    extra: version,
    product: 'SI',
    secondClass: secondClassMap.get(modelType),
    subType: projectId,
    type: 'AIGC',
    user: username,
    userType: 'USER',
  };

  return [
    {
      ...basicData,
      count: lines,
      firstClass: 'CODE',
      skuName: isSnippet
        ? isAccept
          ? 'KEEP_MULTI'
          : 'GENE_MULTI'
        : isAccept
        ? 'KEEP'
        : 'GENE',
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
    username: string,
  ) => {
    try {
      await axios
        .create({
          baseURL: fastify.config.statistics,
        })
        .post(
          '/report/summary',
          constructData(
            completion,
            startTime,
            endTime,
            projectId,
            version,
            username,
            databaseManager.getModelType() ?? fastify.config.modelConfigs[0].modelType,
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
    username: string,
  ) => {
    if (currentCursor.end.line == lastCursor.end.line) {
      return;
    }
    try {
      await axios
        .create({
          baseURL: fastify.config.statistics,
        })
        .post(
          '/report/summary',
          constructData(
            completion,
            startTime,
            endTime,
            projectId,
            version,
            username,
            databaseManager.getModelType() ?? fastify.config.modelConfigs[0].modelType,
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
        username: string,
      ) => void;
      generate: (
        completion: string,
        startTime: number,
        endTime: number,
        projectId: string,
        version: string,
        username: string,
      ) => Promise<void>;
      updateCursor: (cursor: Range) => void;
    };
  }
}
