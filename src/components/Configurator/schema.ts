import { userInfo } from 'os';
import { JSONSchemaType } from 'ajv';

import { ConfigType } from 'components/Configurator/types';
import { ApiStyle } from 'types/common';

const HuggingFaceCompletionConfigSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    contextLimit: {
      type: 'number',
      default: 1500,
    },
    endpoint: {
      type: 'string',
    },
    maxTokenCount: {
      type: 'number',
      default: 512,
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
};

const LinseerCompletionConfigSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    contextLimit: {
      type: 'number',
      default: 1500,
    },
    maxTokenCount: {
      type: 'number',
      default: 512,
    },
    stopTokens: {
      type: 'array',
      items: {
        type: 'string',
      },
      default: [],
    },
    subModelType: {
      type: 'string',
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
};

export const ConfigSchema: Partial<JSONSchemaType<ConfigType>> = {
  type: 'object',
  required: ['apiStyle', 'modelConfigs', 'statistics'],
  additionalProperties: false,
  properties: {
    apiStyle: {
      type: 'string',
      enum: Object.values(ApiStyle),
    },
    modelConfigs: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'object',
            required: [],
            additionalProperties: false,
            properties: {
              completionConfigs: {
                type: 'object',
                required: ['function', 'line', 'snippet'],
                additionalProperties: false,
                patternProperties: {
                  function: HuggingFaceCompletionConfigSchema,
                  line: HuggingFaceCompletionConfigSchema,
                  snippet: HuggingFaceCompletionConfigSchema,
                },
              },
              modelType: {
                type: 'string',
              },
              separateTokens: {
                type: 'object',
                required: ['end', 'middle', 'start'],
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
            },
          },
          {
            type: 'object',
            required: [],
            additionalProperties: false,
            properties: {
              completionConfigs: {
                type: 'object',
                required: ['function', 'line', 'snippet'],
                additionalProperties: false,
                properties: {
                  function: LinseerCompletionConfigSchema,
                  line: LinseerCompletionConfigSchema,
                  snippet: LinseerCompletionConfigSchema,
                },
              },
              endpoint: {
                type: 'string',
              },
              modelType: {
                type: 'string',
              },
            },
          },
        ],
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
};
