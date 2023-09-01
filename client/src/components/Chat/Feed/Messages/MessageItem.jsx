import { Avatar, Box, Flex, Stack, Image, Text } from '@chakra-ui/react';
import { formatRelative } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import React from 'react';

const formatRelativeLocale = {
  lastWeek: 'eeee "at" p',
  yesterday: '\'Yesterday at\' p',
  today: 'p',
  other: 'MM/dd/yy'
};

const MessageItem = ({ message, sentByMe }) => {
  return (
    <Stack
      direction='row'
      p={4}
      spacing={4}
      _hover={{ bg: 'whiteAlpha.200' }}
      justify={sentByMe ? 'flex-end' : 'flex-start'}
      wordBreak='break-word'
    >
      {!sentByMe && (
        <Flex align='flex-end'>
          <Avatar src={message.sender.image} size='sm' />
        </Flex>
      )}
      <Stack spacing={1} width='100%'>
        <Stack
          direction='row'
          align='center'
          justify={sentByMe ? 'flex-end' : 'flex-start'}
        >
          {!sentByMe && (
            <Text fontWeight={500} textAlign={sentByMe ? 'right' : 'left'}>
              {message.sender.username}
            </Text>
          )}
          <Text fontSize={16} color='whiteAlpha.700'>
            {formatRelative(message.createdAt, new Date(), {
              locale: {
                ...enUS,
                formatRelative: (token) => formatRelativeLocale[token]
              }
            })}
          </Text>
        </Stack>
        <Flex direction='row' justify={sentByMe ? 'flex-end' : 'flex-start'}>
          <Box
            bg={sentByMe ? 'brand.100' : 'whiteAlpha.300'}
            px={2}
            py={1}
            borderRadius={12}
            maxWidth='65%'
          >
            <Text
              style={{
                marginBottom: message.attachment && '5px'
              }}
            >
              {message.body}
            </Text>
            {message.attachment.substring(message.attachment.length - 3, message.attachment.length) == 'png' && (
              <Image
                style={{
                  maxWidth: '600px',
                  borderRadius: '12px',
                  paddingBottom: '2px'
                }}
                src={'http://localhost:4000/userfiles/' + message.attachment}
                alt=''
              />
            )}
            {message.attachment.substring(message.attachment.length - 3, message.attachment.length) == 'jpg' && (
              <Image
                style={{
                  maxWidth: '600px',
                  borderRadius: '12px',
                  paddingBottom: '2px'
                }}
                src={'http://localhost:4000/userfiles/' + message.attachment}
                alt=''
              />
            )}
            {message.attachment.substring(message.attachment.length - 4, message.attachment.length) == 'jpeg' && (
              <Image
                style={{
                  maxWidth: '600px',
                  borderRadius: '12px',
                  paddingBottom: '2px'
                }}
                src={'http://localhost:4000/userfiles/' + message.attachment}
                alt=''
              />
            )}
            {message.attachment.substring(message.attachment.length - 3, message.attachment.length) == 'mp4' && (
              <video
                style={{
                  maxWidth: '600px',
                  borderRadius: '12px',
                  paddingBottom: '2px'
                }}
                src={'http://localhost:4000/userfiles/' + message.attachment}
                alt=''
                type='video/mp4'
                controls
              />
            )}
          </Box>
        </Flex>
      </Stack>
    </Stack>
  );
};

export default MessageItem;
