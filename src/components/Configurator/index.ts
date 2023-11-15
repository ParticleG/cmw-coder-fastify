import Ajv, { ValidateFunction } from 'ajv';

import { ConfigType } from 'components/Configurator/types';
import { ConfigSchema } from 'components/Configurator/schema';

class Configurator {
  private readonly _validateFunction: ValidateFunction<ConfigType>;

  constructor() {
    const ajv = new Ajv({ useDefaults: true });
    this._validateFunction = ajv.compile<ConfigType>(ConfigSchema);
  }

  validate(config: any) {
    if (!this._validateFunction(config)) {
      throw this._validateFunction.errors;
    }
    return config as ConfigType;
  }
}

export const configurator = new Configurator();
