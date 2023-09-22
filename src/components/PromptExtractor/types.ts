export interface PromptComponents {
  reponame: string;
  filename: string;
  prefix: string;
  suffix: string;
}

export interface PromptElement {
  type: PromptType;
  priority: number;
  value: string;
}

export enum PromptType {
  AfterCursor = 'AfterCursor',
  BeforeCursor = 'BeforeCursor',
  ImportedFile = 'ImportedFile',
  LanguageMarker = 'LanguageMarker',
  PathMarker = 'PathMarker',
  SimilarFile = 'SimilarFile',
}

export interface RelativeDefinition {
  path: string;
  content: string;
}

export interface SimilarSnippet {
  path: string;
  score: number;
  content: string;
}

export interface SimilarSnippetConfig {
  contextLines: number;
  limit: number;
  minScore: number;
}

export enum SupportedSymbol {
  //! Remove function definitions for now
  Enum = 'Enum',
  Interface = 'Interface',
  Array = 'Array',
  Object = 'Object',
  Struct = 'Struct',
}
