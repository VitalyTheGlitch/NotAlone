import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';
import MessageInput from './Input';
import MessagesHeader from './Messages/Header';
import Messages from './Messages/Messages';
import NoConversationSelected from './NoConversationSelected';

const FeedWrapper = ({ session }) => {
  const router = useRouter();

  const { conversationId } = router.query;

  return (
    <Flex
      display={{ base: conversationId ? 'flex' : 'none', md: 'flex' }}
      direction='column'
      width='100%'
    >
      {conversationId && typeof conversationId === 'string' ? (
        <>
          <Flex
            direction='column'
            justify='space-between'
            overflow='hidden'
            flexGrow={1}
          >
            <MessagesHeader
              userId={session.user.id}
              conversationId={conversationId}
            />
            <Messages
              userId={session.user.id}
              conversationId={conversationId}
            />
          </Flex>
          <Box
            position='sticky'
            bottom={0}
            bg='whiteAlpha.50'
            backdropFilter='blur(10px)'
            borderTop='1px solid'
            borderColor='whiteAlpha.200'
            boxShadow='0 -5px 15px rgba(0,0,0,0.3)'
          >
            <MessageInput session={session} conversationId={conversationId} />
          </Box>
        </>
      ) : (
        <NoConversationSelected />
      )}
    </Flex>
  );
};

export default FeedWrapper;
