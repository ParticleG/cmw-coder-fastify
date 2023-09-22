export interface GenerateRequestData {
  inputs: string;
  parameters: {
    best_of: number;
    details: boolean;
    do_sample: boolean;
    max_new_tokens: number;
    stop: string[];
    temperature: number;
    top_p: number;
  };
}

interface GenerateDetailPrefill {
  id: number;
  logprob: number;
  text: string;
}

interface GenerateDetailTokens extends GenerateDetailPrefill {
  special: boolean;
}

interface GenerateDetailInternal {
  finish_reason: 'length' | 'eos_token' | 'stop_sequence';
  generated_text: string;
  generated_tokens: number;
  prefill: Array<GenerateDetailPrefill>;
  seed: number;
  tokens: Array<GenerateDetailTokens>;
}

interface GenerateDetail extends GenerateDetailInternal {
  best_of_sequences?: Array<GenerateDetailInternal>;
}

export interface GenerateResponseData {
  details: GenerateDetail;
  generated_text: string;
}
