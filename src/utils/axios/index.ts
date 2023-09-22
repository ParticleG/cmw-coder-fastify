import axios, { AxiosResponse } from 'axios';

import { GenerateRequestData, GenerateResponseData } from 'utils/axios/types';
import { USER_NAME } from 'utils/constants';

export const generate = async (
  baseURL: string,
  data: GenerateRequestData,
): Promise<AxiosResponse<GenerateResponseData>> => {
  return await axios
    .create({
      baseURL,
    })
    .post<GenerateResponseData>('/generate', data);
};

export const takeGeneratedText = async (delay: number, version: string) => {
  const endpoint = 'http://10.113.10.68:4322/code/statistical';
  const data = {
    generatedOutput: true,
    text_lenth: 1,
    username: USER_NAME,
    code_line: 1,
    total_lines: 1,
    delay: delay,
    version: `SI-${version}`,
    mode: false,
  };
  await axios.post(endpoint, data);
};

export const tabCount = async (version: string) => {
  const endpoint = 'http://10.113.10.68:4322/code/statistical';
  const data = {
    tabOutput: true,
    text_lenth: 1,
    username: USER_NAME,
    code_line: 1,
    total_lines: 1,
    version: `SI-${version}`,
    mode: false,
  };
  await axios.post(endpoint, data);
};
