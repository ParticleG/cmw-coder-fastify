import { JsonMap, stringify } from '@iarna/toml';
import Ajv from 'ajv';
import fastifyPlugin from 'fastify-plugin';
import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { cwd } from 'process';
import { parse } from 'toml';

const ajv = new Ajv();

export type ModelType = 'CMW' | 'CodeLlama';

export interface ConfigType {
  currentModel: ModelType;
  endpoints: {
    endpoint: string;
    model: ModelType;
  }[];
  promptExtractor: {
    contextLimit: number;
  };
  promptProcessor: {
    maxNewTokens: {
      line: number;
      snippet: number;
    };
    separateTokens: {
      end: string;
      middle: string;
      model: ModelType;
      start: string;
    }[];
    stopTokens: string[];
    suggestionCount: number;
    temperature: number;
  };
  server: {
    host: string;
    port: number;
  };
}

const validate = ajv.compile({
  type: 'object',
  properties: {
    currentModel: {
      type: 'string',
      default: 'CMW',
    },
    endpoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          endpoint: {
            type: 'string',
            default: 'http://10.113.36.104',
          },
          model: {
            type: 'string',
            default: 'CMW',
          },
        },
      },
    },
    promptExtractor: {
      type: 'object',
      properties: {
        contextLimit: {
          type: 'number',
          default: 1500,
        },
      },
    },
    promptProcessor: {
      type: 'object',
      properties: {
        maxNewTokens: {
          type: 'object',
          properties: {
            line: {
              type: 'number',
              default: 60,
            },
            snippet: {
              type: 'number',
              default: 512,
            },
          },
        },
        separateTokens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              end: {
                type: 'string',
                default: '<fim_suffix>',
              },
              middle: {
                type: 'string',
                default: '<fim_middle>',
              },
              model: {
                type: 'string',
                default: 'CMW',
              },
              start: {
                type: 'string',
                default: '<fim_prefix>',
              },
            },
          },
        },
        stopTokens: {
          type: 'array',
          items: {
            type: 'string',
          },
          default: ['<fim_pad>', '<|endoftext|>', '</s>', '\n}'],
        },
        suggestionCount: {
          type: 'number',
          default: 1,
          minimum: 1,
          maximum: 10,
        },
        temperature: {
          type: 'number',
          default: 0.2,
          minimum: 0,
          maximum: 1,
        },
      },
    },
    server: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          default: 'localhost',
        },
        port: {
          type: 'number',
          default: 3000,
          minimum: 0,
          maximum: 65535,
        },
      },
    },
  },
});

let config: ConfigType;

export const updateConfig = (newConfig: Partial<ConfigType>) => {
  config = {
    ...config,
    ...newConfig,
  };
  writeFileSync(
    resolve(join(cwd(), 'config.toml')),
    stringify(config as unknown as JsonMap),
  );
  return config;
};

export default fastifyPlugin(async (fastify) => {
  config = parse(readFileSync(resolve(join(cwd(), 'config.toml'))).toString());

  if (validate(config)) {
    fastify.config = config;
  } else {
    throw validate.errors;
  }

  fastify.updateConfig = (newConfig: Partial<ConfigType>) => {
    fastify.config = updateConfig(newConfig);
  };
});

declare module 'fastify' {
  // noinspection JSUnusedGlobalSymbols
  interface FastifyInstance {
    config: ConfigType;
    updateConfig: (newConfig: Partial<ConfigType>) => void;
  }
}
