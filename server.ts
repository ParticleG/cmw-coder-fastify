import { ErrorObject } from 'ajv/lib/types';
import Fastify from 'fastify';

import App from 'app/src/app';
import { databaseManager } from 'components/DatabaseManager';
import { SystemTray } from 'components/SystemTray';
import Config from 'types/config';
import { Logger, LogLevel } from 'types/Logger';
import * as console from 'console';
import { loginPrompt } from 'utils/script';

const fastify = Fastify({
  logger: {
    level: 'warn',
  },
});

async function main() {
  Logger.info('Config', `Loading server configs...`);

  await fastify.register(Config);

  fastify.register(App, fastify.config);

  if (!databaseManager.getModelType()) {
    databaseManager.setModelType(fastify.config.availableModels[0]);
  }

  const systemTray = new SystemTray(
    databaseManager.getModelType(),
    fastify.config.availableModels,
  );

  systemTray.on('exitItemClick', async () => {
    await fastify.close();
  });

  systemTray.on('modelItemClick', async ({ modelType }) => {
    databaseManager.setModelType(modelType);
  });

  fastify.listen(
    {
      host: fastify.config.server.host,
      port: fastify.config.server.port,
    },
    (err: any) => {
      if (err) {
        fastify.log.error(err);
        fastify.close();
      }
    },
  );

  // noinspection HttpUrlsUsage
  Logger.info(
    'Config',
    `Server is listening on ` +
      LogLevel.info(
        `http://${fastify.config.server.host}:${fastify.config.server.port}`,
      ),
  );

  if (fastify.config.authRequired) {
    if (!(await databaseManager.accessToken())) {
      await loginPrompt(fastify.config.username);
    }
  }
}

main().catch((errors) => {
  if (errors instanceof Array) {
    errors.forEach((error: ErrorObject) => {
      Logger.error(
        'Config',
        'Invalid config item',
        LogLevel.warning(`${error.message}`) +
          (error.instancePath
            ? ' at ' + LogLevel.link(error.instancePath)
            : ''),
      );
    });
  } else {
    console.error(errors);
  }
  fastify.close().then(
    () => Logger.success('Server', 'Successfully closed'),
    (err) => Logger.error('Server', 'Cannot close', err.message),
  );
});
