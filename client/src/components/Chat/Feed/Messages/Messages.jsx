import { useQuery } from '@apollo/client';
import { Box, Flex, Stack } from '@chakra-ui/react';
import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import MessageOperations from '../../../../graphql/operations/messages';
import SkeletonLoader from '../../../common/SkeletonLoader';
import MessageItem from './MessageItem';

const Messages = ({ userId, conversationId }) => {
  const { data, loading, error, subscribeToMore } = useQuery(MessageOperations.Query.messages, {
		variables: {
		  conversationId
		},
		onError: ({ message }) => {
		  toast.error(message);
		}
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subscribeToMoreMessages = (conversationId) => {
		return subscribeToMore({
		  document: MessageOperations.Subscriptions.messageSent,
		  variables: {
				conversationId
		  },
		  updateQuery: (prev, { subscriptionData }) => {
			if (!subscriptionData.data) return prev;

			const newMessage = subscriptionData.data.messageSent;

			return Object.assign({}, prev, {
			  messages: newMessage.sender.id === userId ? prev.messages : [newMessage, ...prev.messages]
			});
		  }
		});
  };

  useEffect(() => {
		const unsubscribe = subscribeToMoreMessages(conversationId);

		return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
		if (!messagesEndRef.current || !data) return;

		messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [data, messagesEndRef.current]);

  if (error) return null;

  return (
	<Flex direction='column' justify='flex-end' overflow='hidden'>
	  {loading && (
		<Stack spacing={4} px={4}>
		  <SkeletonLoader count={4} height='60px' width='100%' />
		</Stack>
	  )}
	  {data?.messages && (
		<Flex
		  direction='column-reverse'
		  overflowY='auto'
		  overflowX='hidden'
		  css={{
				'&::-webkit-scrollbar': {
				  width: '10px',
				  backgroundColor: '#1f1424'
				},
				'&::-webkit-scrollbar-track': {
				  backgroundColor: '#1f1424'
				},
				'&::-webkit-scrollbar-thumb': {
				  backgroundColor: '#ffffff24',
				  backgroundImage: '-webkit-linear-gradient(45deg, rgba(255, 255, 255, .2) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .2) 50%, rgba(255, 255, 255, .2) 75%, transparent 75%, transparent)}'
				}
		  }}
		  height='100%'>
		  {data.messages.map((message) => (
			<MessageItem
			  key={message.id}
			  message={message}
			  sentByMe={message.sender.id === userId}
			/>
		  ))}
		</Flex>
	  )}
	</Flex>
  );
};

export default Messages;
