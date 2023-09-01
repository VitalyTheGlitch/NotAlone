import { Flex } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import ConversationsWrapper from './Conversations/ConversationsWrapper';
import FeedWrapper from './Feed/FeedWrapper';
import ModalProvider from '../../context/ModalContext';

const Chat = ({ session }) => {
  useEffect(() => {
    document.title = 'Not Alone';
  }, []);

  return (
    <Flex height='100vh'>
      <ModalProvider>
        <ConversationsWrapper session={session} />
        <FeedWrapper session={session} />
      </ModalProvider>
    </Flex>
  );
};

export default Chat;
