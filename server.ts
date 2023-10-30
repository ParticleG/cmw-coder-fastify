import { ErrorObject } from 'ajv/lib/types';
import Fastify from 'fastify';
import App from 'app/src/app';
import Config from 'types/config';
import { Logger, LogLevel } from 'types/Logger';
import { systemTray } from 'components/SystemTray';

const fastify = Fastify({
  logger: {
    level: 'warn',
  },
});

systemTray;

async function main() {
  Logger.info('Config', `Loading server configs...`);

  await fastify.register(Config);

  fastify.register(App, fastify.config);
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
