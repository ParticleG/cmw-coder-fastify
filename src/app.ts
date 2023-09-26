import { FastifyPluginAsync } from 'fastify';

import SensiblePlugin from 'plugins/sensible';
import GenerateRoute from 'routes/generate';
import RootRoute from 'routes/root';

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.register(SensiblePlugin, opts);
  fastify.register(GenerateRoute, opts);
  fastify.register(RootRoute, opts);
};

export default app;
