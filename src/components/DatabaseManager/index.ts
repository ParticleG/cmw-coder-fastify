// @ts-ignore
import { LowSync } from 'lowdb';
// @ts-ignore
import { JSONSyncPreset } from 'lowdb/node';
import { join } from 'path';
import { cwd } from 'process';

import { ModelType } from 'types/common';
import { authCode, judgment, login, refreshToken } from 'utils/axios/index.js';

// import { USER_NAME } from 'utils/constants';

interface Database {
  modelType: ModelType;
  tokens: {
    access: string;
    refresh: string;
  };
}

const defaultData = (): Database => ({
  modelType: 'CMW',
  tokens: {
    access: '',
    refresh: '',
  },
});

class DatabaseManager {
  private _db: LowSync<Database>;

  constructor() {
    this._db = JSONSyncPreset<Database>(
      join(cwd(), 'data.lowdb'),
      defaultData(),
    );
    this._db.write();
  }

  async authCode() {
    // await authCode(USER_NAME);
    await authCode('g29624');
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

  async login(code: string) {
    // const { data } = await login(USER_NAME, code);
    const { data } = await login('g29624', code);
    console.log(data);
    if (!data.error) {
      this._db.data.tokens.access = data.token;
      this._db.data.tokens.refresh = data.refreshToken;
      console.log(this._db.data.tokens);
      this._db.write();
      return true;
    }
    return false;
  }

  get modelType() {
    return this._db.data.modelType;
  }

  set modelType(modelType: ModelType) {
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
