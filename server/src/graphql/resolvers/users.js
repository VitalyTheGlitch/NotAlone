import User from '@prisma/client';
import { GraphQLError } from 'graphql';
import { verifyAndCreateUsername } from '../../util/functions.js';

const resolvers = {
  Query: {
    searchUsers: async function searchUsers(_, args, context) {
      const { username: searchedUsername } = args;
      const { prisma, session } = context;

      if (!session?.user) throw new GraphQLError('Not authorized');

      const { user: { username: myUsername } } = session;

      try {
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: searchedUsername,
              not: myUsername,
              mode: 'insensitive'
            }
          }
        });

        return users;
      } catch (error) {
        console.log('error', error);

        throw new GraphQLError(error?.message);
      }
    }
  },
  Mutation: {
    createUsername: async function createUsername(_, args, context) {
      const { session, prisma } = context;

      if (!session?.user) return { error: 'Not authorized' };

      const { id } = session.user;
      const { username } = args;

      return await verifyAndCreateUsername({ userId: id, username }, prisma);
    },
  }
};

export default resolvers;
