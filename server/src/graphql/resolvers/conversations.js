import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { withFilter } from 'graphql-subscriptions';
import { userIsConversationParticipant } from '../../util/functions.js';

const resolvers = {
  Query: {
    conversations: async function getConversations(_, args, context) {
      const { session, prisma } = context;

      if (!session?.user) throw new GraphQLError('Not authorized');

      try {
        const { id } = session.user;
        const conversations = await prisma.conversation.findMany({
          include: conversationPopulated
        });

        return conversations.filter(
          (conversation) => !!conversation.participants.find((p) => p.userId === id)
        );
      } catch (error) {
        console.log('error', error);

        throw new GraphQLError(error?.message);
      }
    }
  },
  Mutation: {
    createConversation: async function (_, args, context) {
      const { session, prisma, pubsub } = context;
      const { participantIds } = args;

      if (!session?.user) throw new GraphQLError('Not authorized');

      const { id: userId } = session.user;

      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participantIds.map((id) => ({
                  userId: id,
                  hasSeenLatestMessage: id === userId
                }))
              }
            }
          },
          include: conversationPopulated
        });

        pubsub.publish('CONVERSATION_CREATED', {
          conversationCreated: conversation
        });

        return { conversationId: conversation.id };
      } catch (error) {
        console.log('createConversation error', error);

        throw new GraphQLError('Error creating conversation');
      }
    },
    markConversationAsRead: async function (_, args, context) {
      const { userId, conversationId } = args;
      const { session, prisma } = context;

      if (!session?.user) throw new GraphQLError('Not authorized');

      try {
        await prisma.conversationParticipant.updateMany({
          where: {
            userId,
            conversationId
          },
          data: {
            hasSeenLatestMessage: true
          }
        });

        return true;
      } catch (error) {
        console.log('markConversationAsRead error', error);

        throw new GraphQLError(error.message);
      }
    },
    deleteConversation: async function (_, args, context) {
      const { session, prisma, pubsub } = context;
      const { conversationId } = args;

      if (!session?.user) throw new GraphQLError('Not authorized');

      try {
        await prisma.conversation.update({
          where: {
            id: conversationId
          },
          data: {
            latestMessageId: null
          }
        });

        const [deletedConversation] = await prisma.$transaction([
          prisma.conversation.delete({
            where: {
              id: conversationId
            },
            include: conversationPopulated
          }),
          prisma.conversationParticipant.deleteMany({
            where: {
              conversationId
            }
          }),
          prisma.message.deleteMany({
            where: {
              conversationId
            }
          })
        ]);

        pubsub.publish('CONVERSATION_DELETED', {
          conversationDeleted: deletedConversation
        });

        return true;
      } catch (error) {
        console.log('deleteConversation error', error);

        throw new GraphQLError(error?.message);
      }
    },
    updateParticipants: async function (_, args, context) {
      const { session, prisma, pubsub } = context;
      const { conversationId, participantIds } = args;

      if (!session?.user) throw new GraphQLError('Not authorized');

      const { user: { id: userId } } = session;

      try {
        const participants = await prisma.conversationParticipant.findMany({
          where: {
            conversationId
          }
        });

        const existingParticipants = participants.map((p) => p.userId);

        const participantsToDelete = existingParticipants.filter(
          (id) => !participantIds.includes(id)
        );

        const participantsToCreate = participantIds.filter(
          (id) => !existingParticipants.includes(id)
        );

        const transactionStatements = [
          prisma.conversation.update({
            where: {
              id: conversationId
            },
            data: {
              participants: {
                deleteMany: {
                  userId: {
                    in: participantsToDelete
                  },
                  conversationId
                }
              }
            },
            include: conversationPopulated
          })
        ];

        if (participantsToCreate.length) {
          transactionStatements.push(
            prisma.conversation.update({
              where: {
                id: conversationId
              },
              data: {
                participants: {
                  createMany: {
                    data: participantsToCreate.map((id) => ({
                      userId: id,
                      hasSeenLatestMessage: true
                    }))
                  }
                }
              },
              include: conversationPopulated
            })
          );
        }

        const [deleteUpdate, addUpdate] = await prisma.$transaction(
          transactionStatements
        );

        pubsub.publish('CONVERSATION_UPDATED', {
          conversationUpdated: {
            conversation: addUpdate || deleteUpdate,
            addedUserIds: participantsToCreate,
            removedUserIds: participantsToDelete
          }
        });

        return true;
      } catch (error) {
        console.log('updateParticipants error', error);

        throw new GraphQLError(error?.message);
      }
    }
  },
  Subscription: {
    conversationCreated: {
      subscribe: withFilter(
        (_, __, context) => context.pubsub.asyncIterator(['CONVERSATION_CREATED']),
        (payload, _, context) => {
          const { session } = context;

          if (!session?.user) throw new GraphQLError('Not authorized');

          const { id: userId } = session.user;
          const { conversationCreated: { participants } } = payload;

          return userIsConversationParticipant(participants, userId);
        }
      )
    },
    conversationUpdated: {
      subscribe: withFilter(
        (_, __, context) => context.pubsub.asyncIterator(['CONVERSATION_UPDATED']),
        (payload, _, context) => {
          const { session } = context;

          if (!session?.user) throw new GraphQLError('Not authorized');

          const { id: userId } = session.user;
          const {
            conversationUpdated: {
              conversation: { participants },
              addedUserIds,
              removedUserIds
            }
          } = payload;

          const userIsParticipant = userIsConversationParticipant(
            participants,
            userId
          );

          const userSentLatestMessage =
            payload.conversationUpdated.conversation.latestMessage?.senderId ===
            userId;

          const userIsBeingRemoved =
            removedUserIds &&
            Boolean(removedUserIds.find((id) => id === userId));

          return (
            (userIsParticipant && !userSentLatestMessage) ||
            userSentLatestMessage ||
            userIsBeingRemoved
          );
        }
      )
    },
    conversationDeleted: {
      subscribe: withFilter(
        (_, __, context) => context.pubsub.asyncIterator(['CONVERSATION_DELETED']),
        (payload, _, context) => {
          const { session } = context;

          if (!session?.user) throw new GraphQLError('Not authorized');

          const { id: userId } = session.user;
          const { conversationDeleted: { participants } } = payload;

          return userIsConversationParticipant(participants, userId);
        }
      )
    }
  }
};

export const participantPopulated =
  Prisma.validator()({
    user: {
      select: {
        id: true,
        username: true,
        image: true
      }
    }
  });

export const conversationPopulated =
  Prisma.validator()({
    participants: {
      include: participantPopulated
    },
    latestMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            image: true
          }
        }
      }
    }
  });

export default resolvers;
