import { useMutation, useQuery } from '@apollo/client';
import { Box, Flex, Stack } from '@chakra-ui/react';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import toast from 'react-hot-toast';
import MessageOperations from '../../../../graphql/operations/messages';
import SkeletonLoader from '../../../common/SkeletonLoader';
import MessageItem from './MessageItem';

const Messages = ({ userId, conversationId }) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(true);

  const virtuosoRef = useRef(null);

  const { data, loading, error, subscribeToMore } = useQuery(MessageOperations.Query.messages, {
    variables: { conversationId },
    onError: ({ message }) => toast.error(message)
  });

  const messages = useMemo(() => {
    const sorted = [...(data?.messages || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return [...sorted, { id: 'scroll-anchor', type: 'buffer' }]
  }, [data?.messages]);

  const [deleteMessage] = useMutation(MessageOperations.Mutations.deleteMessage, {
    update: (cache, { data: { deleteMessage } }) => {
      cache.modify({
        fields: {
          messages(existingMessages = [], { readField }) {
            return existingMessages.filter(
              (messageRef) => deleteMessage.id !== readField('id', messageRef)
            );
          }
        }
      });

      cache.evict({ id: cache.identify(deleteMessage) });
      cache.gc();
    },
    onError: ({ message }) => toast.error(message)
  });

  const onDeleteMessage = useCallback(async (id) => {
    const prevPosition = virtuosoRef.current?.state?.scrollTop;

    try {
      await deleteMessage({
        variables: { messageId: id },
        optimisticResponse: {
          __typename: 'Mutation',
          deleteMessage: { __typename: 'Message', id }
        }
      });

      if (prevPosition)
        virtuosoRef.current?.scrollTo({ top: prevPosition });

    } catch (error) {
      console.error('onDeleteMessage error', error);
    }
  }, [deleteMessage]);

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: MessageOperations.Subscriptions.messageSent,
      variables: { conversationId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const newMessage = subscriptionData.data.messageSent;
        const newMessages = [...prev.messages, newMessage];

        if (scrolledToBottom && virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: newMessages.length - 1,
            behavior: 'smooth'
          });
        }

        return {
          ...prev,
          messages: newMessage.sender.id === userId ?
          prev.messages :
          [...prev.messages, newMessage]
        };
      }
    });

    return () => unsubscribe();
  }, [conversationId, scrolledToBottom]);

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: MessageOperations.Subscriptions.messageDeleted,
      variables: { conversationId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const deletedMessage = subscriptionData.data.messageDeleted;

        return {
          ...prev,
          messages: prev.messages.filter(
            message => message.id !== deletedMessage.id
          )
        };
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    if (!loading && virtuosoRef.current && messages.length) {
      const timer = setTimeout(() => {
        virtuosoRef.current.scrollToIndex({
          index: messages.length - 1,
          behavior: 'smooth'
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, messages]);

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth'
      });
    }
  }, [conversationId, messages]);

  if (error) return;

  return (
    <Flex
      direction='column'
      height='100%'
      justify='flex-end'
      overflow='hidden'
    >
      {loading && (
        <Stack spacing={4} px={4}>
          <SkeletonLoader count={4} height='60px' width='100%' />
        </Stack>
      )}
      {messages && (
        <Box height='100%'>
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            initialTopMostItemIndex={messages.length - 1}
            alignToBottom={false}
            followOutput={() => false}
            atBottomStateChange={setScrolledToBottom}
            atBottomThreshold={50}
            overscan={20}
            itemContent={(index, message) => (
              message.type === 'buffer'
              ? <div style={{
                 height: `${window.innerHeight * 0.15}px`,
                 opacity: 0,
                 minHeight: '50px',
                 maxHeight: '100px',
                 pointerEvents: 'none'
                }} />
              : <MessageItem
                  key={message.id}
                  message={message}
                  sentByMe={message.sender.id === userId}
                  onDeleteMessage={onDeleteMessage}
              />
            )}
            components={{
              Header: () => <div style={{ height: '10px', background: 'transparent' }} />,
              Footer: () => <div style={{ height: '20px', background: 'transparent' }} />
            }}
            style={{
              height: '100%',
              overflowX: 'hidden'
            }}
          />
        </Box>
      )}
    </Flex>
  );
};

export default Messages;
