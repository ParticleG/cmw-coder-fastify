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

export const takeGeneratedText = async (
  delay: number,
  projectId: string,
  version: string,
) => {
  const endpoint = 'http://10.113.10.68:4322/code/statistical';
  const data = {
    generated_output: true,
    text_length: 1,
    username: USER_NAME,
    code_line: 1,
    project_id: projectId,
    total_lines: 1,
    delay: delay,
    version: `SI-${version}`,
    mode: false,
  };
  await axios.post(endpoint, data);
};
