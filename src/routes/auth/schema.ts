export const loginSchema = {
  body: {
    type: 'object',
    required: ['code'],
    properties: {
      code: {
        type: 'string',
      },
    },
  },
};

export interface loginType {
  Body: {
    code: string;
  };
}
