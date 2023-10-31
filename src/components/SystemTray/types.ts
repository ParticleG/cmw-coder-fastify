import { ModelType } from "types/config";

export interface SwitchModelEvent {
  modelType: ModelType
}

export interface ExitEvent {
  code: number
}

export interface ItemEventMap {
  exitItemClick: ExitEvent;
  modelItemClick: SwitchModelEvent;
}