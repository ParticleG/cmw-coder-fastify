export enum ApiStyle {
  HuggingFace = 'HuggingFace',
  Linseer = 'Linseer',
}

export type HuggingFaceModelType = 'Comware-V1' | 'Comware-V2';

export type LinseerModelType = 'Linseer' | 'Linseer-SR88Driver';

export type SubModelType =
  | 'linseer-code-13b'
  | 'linseer-code-13b-sr88drv'
  | 'linseer-code-34b';
