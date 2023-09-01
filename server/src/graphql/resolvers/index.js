import merge from 'lodash.merge';
import conversationResolvers from './conversations.js';
import messageResolvers from './messages.js';
import userResolvers from './users.js';
import scalarResolvers from './scalars.js';

const resolvers = merge(
  {},
  userResolvers,
  scalarResolvers,
  conversationResolvers,
  messageResolvers
);

export default resolvers;
