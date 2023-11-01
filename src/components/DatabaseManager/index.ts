import { LowSync } from 'lowdb';
import { JSONSyncPreset } from 'lowdb/node';

import { ModelType } from 'types/common.js';
import { judgment } from 'utils/axios/index.js';
import console from 'console';

interface Database {
  modelType: ModelType;
  tokens?: {
    access: string;
    refresh: string;
  };
}

const defaultData = (): Database => ({
  modelType: 'CMW',
});

export class DatabaseManager {
  private _db: LowSync<Database>;

  constructor(path: string) {
    this._db = JSONSyncPreset<Database>(path, defaultData());
  }

  private async checkToken() {
    if (!this._db.data.tokens) {
      return false;
    }
    const response = await judgment(this._db.data.tokens.access);
    console.log(response);
    return response.data;
  }
}
