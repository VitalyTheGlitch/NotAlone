import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

export async function verifyAndCreateUsername(args, prisma) {
  const { userId, username } = args;

  try {
    /**
     * Check if username taken by another user
    **/
    const existingUser = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (existingUser) return { error: 'Username already taken. Try another' };

    /**
     * Update username
    **/
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        username
      }
    });

    return { success: true };
  } catch (error) {
    console.log('createUsername error', error);

    return {
      error: error?.message
    };
  }
}

export function userIsConversationParticipant(participants, userId) {
  return !!participants.find((participant) => participant.userId === userId);
}

export async function getServerSession(cookie) {
  const res = await fetch('http://localhost:3000/api/auth/session', {
    headers: {
      cookie
    }
  });
  const session = await res.json();
  
  return session;
}
