// @ts-ignore
import { LowSync } from 'lowdb';
// @ts-ignore
import { JSONSyncPreset } from 'lowdb/node';
import { join } from 'path';
import { cwd } from 'process';

import { HuggingFaceModelType, LinseerModelType } from 'types/common';
import { Logger } from "types/Logger";
import { authCode, judgment, login, refreshToken } from 'utils/axios/index.js';

interface Database {
  modelType?: HuggingFaceModelType | LinseerModelType;
  tokens: {
    access: string;
    refresh: string;
  };
  version: number;
}

const defaultData: Database = {
  tokens: {
    access: '',
    refresh: '',
  },
  version: 2,
};

class DatabaseManager {
  private _db: LowSync<Database>;

  constructor() {
    this._db = JSONSyncPreset<Database>(join(cwd(), 'data.lowdb'), defaultData);
    if ((this._db.data.version ?? 1) < defaultData.version) {
      Logger.warn("Database", "Database upgraded, reset modelType.");
      this._db.data.version = defaultData.version;
      delete this._db.data.modelType;
    }
    this._db.write();
  }

  async authCode(username: string) {
    await authCode(username);
  }

  async accessToken() {
    if ((await this.checkAccess()) || (await this.refreshToken())) {
      return this._db.data.tokens.access;
    }
  }

  async checkAccess() {
    try {
      await judgment(this._db.data.tokens.access);
      return true;
    } catch (e) {
      return false;
    }
  }

  async login(username: string, code: string) {
    const { data } = await login(username, code);
    if (!data.error) {
      this._db.data.tokens.access = data.token;
      this._db.data.tokens.refresh = data.refreshToken;
      this._db.write();
      return true;
    }
    return false;
  }

  getModelType() {
    return this._db.data.modelType;
  }

  setModelType(modelType: HuggingFaceModelType | LinseerModelType) {
    this._db.data.modelType = modelType;
    this._db.write();
  }

  async refreshToken() {
    try {
      const { data } = await refreshToken(this._db.data.tokens.refresh);
      this._db.data.tokens.access = data.access_token;
      this._db.data.tokens.refresh = data.refresh_token;
      this._db.write();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const databaseManager = new DatabaseManager();
