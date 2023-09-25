import { FastifyPluginAsync } from 'fastify';

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.register(import('plugins/sensible'), opts);
  fastify.register(import('routes/generate'), opts);
  fastify.register(import('routes/root'), opts);
};

export default app;
