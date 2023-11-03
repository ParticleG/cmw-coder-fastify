import { FastifyPluginAsync } from 'fastify';

import SensiblePlugin from 'plugins/sensible';
import StatisticsPlugin from 'plugins/statistics';
import AuthRoute from 'routes/auth';
import CompletionRoute from 'src/routes/completion';

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.register(SensiblePlugin, opts);
  fastify.register(StatisticsPlugin, opts);
  fastify.register(AuthRoute, { ...opts, prefix: '/auth' });
  fastify.register(CompletionRoute, { ...opts, prefix: '/completion' });
};

export default app;
