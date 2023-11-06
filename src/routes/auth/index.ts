import { FastifyPluginAsync } from 'fastify';

import { databaseManager } from 'components/DatabaseManager';
import { loginSchema, loginType } from 'routes/auth/schema';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.post<loginType>(
    '/login',
    { schema: loginSchema },
    async (request) => {
      const { code } = request.body;
      return {
        success: await databaseManager.login(fastify.config.userId, code),
      };
    },
  );
});
