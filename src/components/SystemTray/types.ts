import { ModelType } from 'types/common';

export interface SwitchModelEvent {
  modelType: ModelType;
}

export interface ExitEvent {
  code: number;
}

export interface ItemEventMap {
  exitItemClick: ExitEvent;
  modelItemClick: SwitchModelEvent;
}
