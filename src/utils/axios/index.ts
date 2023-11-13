import axios from 'axios';

import {
  GenerateRdRequestData,
  GenerateRdResponseData,
  GenerateRequestData,
  GenerateResponseData,
  JudgmentData,
  LoginData,
  RefreshData,
} from 'utils/axios/types';

const rdTestServiceProxy = axios.create({
  baseURL: 'http://rdee.h3c.com/kong/RdTestServiceProxy-e',
});

const rdTestLoginService = axios.create({
  baseURL: 'http://rdee.h3c.com/kong/RdTestLoginService/api',
});

const rdTestAiService = axios.create({
  baseURL: 'http://rdee.h3c.com/kong/RdTestAiService',
});

export const authCode = async (userId: string) => {
  return await rdTestServiceProxy.get('/EpWeChatLogin/authCode', {
    params: {
      operation: 'AI',
      userId,
    },
  });
};

export const login = async (userId: string, code: string) => {
  return await rdTestServiceProxy.get<LoginData>('/EpWeChatLogin/login', {
    params: {
      code,
      userId,
    },
  });
};

export const refreshToken = async (refreshToken: string) => {
  return await rdTestLoginService.post<RefreshData>(
    '/token/refresh',
    undefined,
    {
      params: {
        refreshToken,
      },
    },
  );
};

export const judgment = async (token: string) => {
  return await rdTestAiService.get<JudgmentData>('/auth/judgment', {
    headers: {
      'x-authorization': `bearer ${token}`,
    },
  });
};

export const generate = async (baseURL: string, data: GenerateRequestData) => {
  return await axios
    .create({
      baseURL,
    })
    .post<GenerateResponseData>('/generate', data);
};

export const generateRd = async (
  baseURL: string,
  data: GenerateRdRequestData,
  accessToken: string,
) => {
  return await axios
    .create({
      baseURL,
    })
    .post<GenerateRdResponseData[]>('/generateCode', data, {
      headers: {
        'x-authorization': `bearer ${accessToken}`,
      },
    });
};
