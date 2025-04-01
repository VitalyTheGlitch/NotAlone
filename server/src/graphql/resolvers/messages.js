import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { withFilter } from 'graphql-subscriptions';
import { userIsConversationParticipant } from '../../util/functions.js';
import { conversationPopulated } from './conversations.js';

const resolvers = {
  Query: {
    messages: async function (_, args, context) {
      const { session, prisma } = context;
      const { conversationId } = args;

      if (!session?.user) throw new GraphQLError('Not authorized');

      const { user: { id: userId } } = session;

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId
        },
        include: conversationPopulated
      });

      if (!conversation) throw new GraphQLError('Conversation not found');

      const allowedToView = userIsConversationParticipant(
        conversation.participants,
        userId
      );

      if (!allowedToView) throw new Error('Not authorized');

      try {
        const messages = await prisma.message.findMany({
          where: {
            conversationId
          },
          include: messagePopulated,
          orderBy: {
            createdAt: 'desc'
          }
        });

        return messages;
      } catch (error) {
        console.log('messages error', error);

        throw new GraphQLError(error?.message);
      }
    },
  },
  Mutation: {
    sendMessage: async function (_, args, context) {
      const { session, prisma, pubsub } = context;

      if (!session?.user) throw new GraphQLError('Not authorized');

      const { id: userId } = session.user;
      const { id: messageId, senderId, conversationId, body, attachment } = args;

      if (!body.trim() && !attachment) throw new GraphQLError('Message cannot be empty!')

      try {
        const newMessage = await prisma.message.create({
          data: {
            id: messageId,
            senderId,
            conversationId,
            body: body.trim(),
            attachment
          },
          include: messagePopulated
        });

        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId
          }
        });

        if (!participant) throw new GraphQLError('Participant does not exist');

        const { id: participantId } = participant;

        const conversation = await prisma.conversation.update({
          where: {
            id: conversationId
          },
          data: {
            latestMessageId: newMessage.id,
            participants: {
              update: {
                where: {
                  id: participantId
                },
                data: {
                  hasSeenLatestMessage: true
                }
              },
              updateMany: {
                where: {
                  NOT: {
                    userId
                  }
                },
                data: {
                  hasSeenLatestMessage: false
                }
              }
            }
          },
          include: conversationPopulated
        });

        pubsub.publish('MESSAGE_SENT', { messageSent: newMessage });
        pubsub.publish('CONVERSATION_UPDATED', {
          conversationUpdated: {
            conversation
          }
        });

        return true;
      } catch (error) {
        console.log('sendMessage error', error);

        throw new GraphQLError('Error sending message');
      }
    },
    deleteMessage: async function (_, args, context) {
      const { session, prisma, pubsub } = context;
      const { messageId } = args;

      if (!session?.user) throw new GraphQLError('Not authorized');

      try {
  return await prisma.$transaction(async (tx) => {
          const message = await tx.message.findUnique({
            where: { id: messageId },
            include: {
              conversation: {
                include: conversationPopulated
              }
            }
          });

          if (!message) throw new GraphQLError('Message not found');

          if (message.senderId != session.user.id) throw new GraphQLError('Not authorized');

          const isLatestMessage = message.conversation.latestMessageId === messageId;

          let updatedConversation = message.conversation;

          if (isLatestMessage) {
            const [previousMessage] = await tx.message.findMany({
              where: {
                conversationId: message.conversationId,
                id: { not: messageId }
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            });

            updatedConversation = await tx.conversation.update({
              where: { id: message.conversationId },
              data: {
                latestMessageId: previousMessage?.id || null,
                updatedAt: new Date()
              },
              include: conversationPopulated
            });
          }

          const deletedMessage = await tx.message.delete({
            where: { id: messageId },
            include: messagePopulated
          });

          pubsub.publish('MESSAGE_DELETED', { messageDeleted: deletedMessage });
          pubsub.publish('CONVERSATION_UPDATED', {
            conversationUpdated: {
              conversation: updatedConversation
            }
          });

          return true;
  });
      } catch (error) {
        console.log('deleteMessage error', error);

        throw new GraphQLError('Error deleting message');
      }
    }
  },
  Subscription: {
    messageSent: {
      subscribe: withFilter(
        (_, __, context) => context.pubsub.asyncIterator(['MESSAGE_SENT']),
        (payload, args, context) => payload.messageSent.conversationId === args.conversationId
      )
    },
    messageDeleted: {
      subscribe: withFilter(
        (_, __, context) => context.pubsub.asyncIterator(['MESSAGE_DELETED']),
        (payload, args) => payload.messageDeleted.conversationId === args.conversationId
      )
    }
  }
};

export const messagePopulated = Prisma.validator()({
  sender: {
    select: {
      id: true,
      username: true,
      image: true
    }
  }
});

export default resolvers;
