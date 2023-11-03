import { databaseManager } from 'components/DatabaseManager';
import { readFileSync } from 'fs';
import { runVbs } from '@el3um4s/run-vbs';
import * as console from 'console';

export const loginPrompt = async () => {
  // const script = decode(
  //   readFileSync('./src/assets/login.vbs'),
  //   'gb2312',
  // ).toString();
  const script = readFileSync('./src/assets/login.vbs').toString();
  console.log(script);
  let isSuccess = false;
  do {
    await databaseManager.authCode();
    const result = await runVbs({ vbs: script });
    console.log(result);
    const { success } = JSON.parse(result);
    isSuccess = success;
  } while (!isSuccess);
};
