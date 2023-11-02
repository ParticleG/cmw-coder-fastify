import { databaseManager } from 'components/DatabaseManager';
import { decode } from 'iconv-lite';
import { readFileSync } from 'fs';
import { runVbs } from '@el3um4s/run-vbs';

export const loginPrompt = async () => {
  const script = decode(
    readFileSync('./src/assets/login.vbs'),
    'gb2312',
  ).toString();
  let isSuccess = false;
  do {
    await databaseManager.authCode();
    const { success } = JSON.parse(await runVbs({ vbs: script }));
    isSuccess = success;
  } while (!isSuccess);
};
