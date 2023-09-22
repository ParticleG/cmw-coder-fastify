import { FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async function () {
    return { time: new Date().toLocaleString(), root: true };
  });
};

export default root;
