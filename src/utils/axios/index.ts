import axios from 'axios';

import { ModelType } from 'types/common';
import {
  GenerateRequestData,
  GenerateResponseData,
  JudgmentData,
  LoginData,
  RefreshData,
} from 'utils/axios/types';
import { USER_NAME } from 'utils/constants';

const rdTestServiceProxy = axios.create({
  baseURL: 'http://rdtest.h3c.com/kong/RdTestServiceProxy-e',
});

const rdTestLoginService = axios.create({
  baseURL: 'http://rdtest.h3c.com/kong/RdTestLoginService/api',
});

const rdTestAiService = axios.create({
  baseURL: 'http://rdtest.h3c.com/kong/RdTestAiService',
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
  return await rdTestLoginService.post<RefreshData>('/token/refresh', {
    params: {
      refreshToken,
    },
  });
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

export const takeGeneratedText = async (
  completion: string,
  delay: number,
  modelType: ModelType,
  projectId: string,
  version: string,
) => {
  const endTime = Date.now();
  const startTime = endTime - delay;
  const endpoint =
    'http://10.113.36.121/kong/RdTestResourceStatistic/report/summary';
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

  const data = [
    {
      ...basicData,
      count: lines,
      firstClass: 'CODE',
      skuName: 'GENE',
    },
    {
      ...basicData,
      count: content.length,
      firstClass: 'GENE_CHAR',
    },
  ];

  await axios.post(endpoint, data);
};
