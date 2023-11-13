import Ajv, { JSONSchemaType } from 'ajv';
import fastifyPlugin from 'fastify-plugin';
import { readFileSync } from 'fs';
import { userInfo } from 'os';
import { join, resolve } from 'path';
import { cwd } from 'process';
import { parse } from 'toml';

import { ApiType, ModelType } from 'types/common';

const ajv = new Ajv({ useDefaults: true });

export interface ModelConfigType {
  contextLimit: number;
  endpoint: string;
  maxNewTokens: {
    function: number;
    line: number;
    snippet: number;
  };
  modelType: ModelType;
  separateTokens?: {
    end: string;
    middle: string;
    start: string;
  };
  stopTokens: string[];
  suggestionCount: number;
  temperature: number;
}

export interface ConfigType {
  apiType: ApiType;
  authRequired: boolean;
  modelConfigs: ModelConfigType[];
  server: {
    host: string;
    port: number;
  };
  statistics: string;
  userId: string;
}

const validate = ajv.compile(<JSONSchemaType<ConfigType>>{
  type: 'object',
  required: ['apiType', 'modelConfigs', 'statistics'],
  additionalProperties: false,
  properties: {
    apiType: {
      type: 'string',
    },
    authRequired: {
      type: 'boolean',
      default: false,
    },
    modelConfigs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['endpoint'],
        additionalProperties: false,
        properties: {
          contextLimit: {
            type: 'number',
            default: 1500,
          },
          endpoint: {
            type: 'string',
          },
          maxNewTokens: {
            type: 'object',
            required: [],
            additionalProperties: false,
            properties: {
              function: {
                type: 'number',
                default: 512,
              },
              line: {
                type: 'number',
                default: 48,
              },
              snippet: {
                type: 'number',
                default: 128,
              },
            },
          },
          modelType: {
            type: 'string',
          },
          separateTokens: {
            type: 'object',
            required: ['end', 'middle', 'start'],
            additionalProperties: false,
            nullable: true,
            properties: {
              end: {
                type: 'string',
              },
              middle: {
                type: 'string',
              },
              start: {
                type: 'string',
              },
            },
          },
          stopTokens: {
            type: 'array',
            items: {
              type: 'string',
            },
            default: [],
          },
          suggestionCount: {
            type: 'number',
            default: 1,
          },
          temperature: {
            type: 'number',
            default: 0.2,
          },
        },
      },
    },
    server: {
      type: 'object',
      required: [],
      additionalProperties: false,
      properties: {
        host: {
          type: 'string',
          default: 'localhost',
        },
        port: {
          type: 'number',
          default: 3000,
        },
      },
    },
    statistics: {
      type: 'string',
    },
    userId: {
      type: 'string',
      default: userInfo().username,
    },
  },
});

export default fastifyPlugin(async (fastify) => {
  const config = parse(
    readFileSync(resolve(join(cwd(), 'config.toml'))).toString(),
  );
  if (!validate(config)) {
    throw validate.errors;
  }
  fastify.config = config as ConfigType;
});

declare module 'fastify' {
  // noinspection JSUnusedGlobalSymbols
  interface FastifyInstance {
    config: ConfigType;
  }
}
