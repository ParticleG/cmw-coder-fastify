import { databaseManager } from 'components/DatabaseManager';
import { readFileSync } from 'fs';
import { runVbs } from '@el3um4s/run-vbs';

export const loginPrompt = async (username: string) => {
  const script = readFileSync('./src/assets/login.vbs').toString();
  let isSuccess = false;
  do {
    await databaseManager.authCode(username);
    const result = await runVbs({ vbs: script });
    const { success } = JSON.parse(result);
    isSuccess = success;
  } while (!isSuccess);
};
