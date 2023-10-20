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
  completion: string,
  delay: number,
  projectId: string,
  version: string,
) => {
  const endpoint = 'http://10.113.10.68:4322/code/statistical';
  const isSnippet = completion[0] === '1';
  const lines = isSnippet ? completion.split('\n').length : 1;
  const data = {
    generated_output: true,
    text_length: completion.length,
    username: USER_NAME,
    code_line: lines,
    project_id: projectId,
    total_lines: lines,
    delay: delay,
    version: `SI-${version}`,
    mode: isSnippet,
  };
  await axios.post(endpoint, data);
};
