import { databaseManager } from 'components/DatabaseManager';
import { readFileSync } from 'fs';
import { runVbs } from '@el3um4s/run-vbs';
import * as console from 'console';

export const loginPrompt = async () => {
  const script = readFileSync('./src/assets/login.vbs').toString();
  let isSuccess = false;
  do {
    await databaseManager.authCode();
    const result = await runVbs({ vbs: script });
    console.log(result);
    const { success } = JSON.parse(result);
    isSuccess = success;
  } while (!isSuccess);
};
