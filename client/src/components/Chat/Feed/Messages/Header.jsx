import { useQuery } from '@apollo/client';
import { Button, Stack, Text } from '@chakra-ui/react';
import Router, { useRouter } from 'next/router';
import React from 'react';
import ConversationOperations from '../../../../graphql/operations/conversations';
import { formatUsernames } from '../../../../util/functions';
import SkeletonLoader from '../../../common/SkeletonLoader';

const MessagesHeader = ({ userId, conversationId }) => {
  const router = useRouter();

  const { data, loading } = useQuery(ConversationOperations.Queries.conversations);

  const conversation = data?.conversations.find(
    (conversation) => conversation.id === conversationId
  );

  if (data?.conversations && !loading && !conversation) Router.push(process.env.NEXT_PUBLIC_BASE_URL);

  return (
    <Stack
      direction='row'
      align='center'
      spacing={6}
      py={5}
      px={{ base: 4, md: 0 }}
      borderBottom='1px solid'
      borderColor='whiteAlpha.200'
    >
      <Button
        display={{ md: 'none' }}
        onClick={() =>
          router.replace('?conversationId', '/', {
            shallow: true,
          })
        }
      >
        Back
      </Button>
      {loading && <SkeletonLoader count={1} height='30px' width='320px' />}
      {!conversation && !loading && <Text>Conversation Not Found</Text>}
      {conversation && (
        <Stack direction='row'>
          <Text color='whiteAlpha.600'>To: </Text>
          <Text fontWeight={600}>
            {formatUsernames(conversation.participants, userId)}
          </Text>
        </Stack>
      )}
    </Stack>
  );
};

export default MessagesHeader;
