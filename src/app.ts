import { FastifyPluginAsync } from 'fastify';

import AuthRoute from 'routes/auth';
import GenerateRoute from 'routes/generate';
import RootRoute from 'routes/root';
import SensiblePlugin from 'plugins/sensible';

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.register(SensiblePlugin, opts);
  fastify.register(AuthRoute, opts);
  fastify.register(GenerateRoute, opts);
  fastify.register(RootRoute, opts);
};

export default app;
