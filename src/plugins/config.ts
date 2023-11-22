import fastifyPlugin from 'fastify-plugin';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { cwd } from 'process';
import { parse } from 'toml';

import { configurator } from "components/Configurator";
import { ConfigType } from "components/Configurator/types";

export default fastifyPlugin(async (fastify) => {
  const config = parse(
    readFileSync(resolve(join(cwd(), 'config-green.toml'))).toString(),
  );
  fastify.config = configurator.validate(config);
});

declare module 'fastify' {
  // noinspection JSUnusedGlobalSymbols
  interface FastifyInstance {
    config: ConfigType;
  }
}
