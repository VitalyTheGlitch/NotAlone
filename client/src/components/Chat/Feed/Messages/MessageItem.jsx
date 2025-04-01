import {
  Avatar,
  Box,
  Flex,
  Stack,
  Image,
  Text,
  Menu,
  MenuItem,
  MenuList
} from '@chakra-ui/react';
import { formatRelative } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import React, { useState } from 'react';
import { MdDeleteOutline } from 'react-icons/md';

const formatRelativeLocale = {
  lastWeek: 'eeee \'at\' p',
  yesterday: '\'Yesterday at\' p',
  today: 'p',
  other: 'MM/dd/yy'
};

const MessageItem = ({ message, sentByMe, onDeleteMessage }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();

    return {
      isImage: ['png', 'jpg', 'jpeg', 'gif'].includes(ext),
      isVideo: ext === 'mp4',
      ext
    };
  };

  const isEmojiOnly = (text) => {
    const trimmed = text.trim();
    const emojiRegex = /^(?:\p{Emoji}\s?){1,3}$/u;

    return emojiRegex.test(trimmed) && !trimmed.match(/[a-zA-Z0-9]/);
  };

  const handleClick = (event) => {
    if (event.type === 'contextmenu') {
      event.preventDefault();

      if (sentByMe) setMenuOpen(true);
    }
  };

  const { isImage, isVideo } = message.attachment
    ? getFileType(message.attachment)
    : { isImage: false, isVideo: false };

  const mediaStyles = {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '12px',
    objectFit: 'contain',
    marginBottom: '2px'
  };

  const emojiMode = !message.attachment && isEmojiOnly(message.body);

  return (
    <Stack
      position='relative'
      direction='row'
      p={4}
      spacing={4}
      wordBreak='break-word'
      justify={sentByMe ? 'flex-end' : 'flex-start'}
      _hover={{ bg: 'whiteAlpha.200' }}
      onClick={handleClick}
      onContextMenu={handleClick}
    >
      {sentByMe && (
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        >
          <MenuList bg='#1f1220'>
            <MenuItem
              bg='#1f1220'
              icon={<MdDeleteOutline fontSize={20} />}
              onClick={(event) => {
                event.stopPropagation();

                onDeleteMessage(message.id);
              }}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      )}

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
            bg={emojiMode ? 'none' : sentByMe ? 'brand.100' : 'whiteAlpha.300'}
            px={emojiMode ? 0 : 2}
            py={emojiMode ? 0 : 1}
            maxWidth={emojiMode ? 'none' : '65%'}
            borderRadius={12}
            overflow='hidden'
          >
            <Text
              style={{
                fontSize: emojiMode ? '48px' : 'inherit',
                textAlign: emojiMode ? 'center' : 'left',
                lineHeight: emojiMode ? '56px' : 'inherit',
                marginBottom: message.attachment && '5px',
                whiteSpace: 'pre-line'
              }}
            >
              {message.body.trim()}
            </Text>

            {message.attachment && (
              <>
                {isImage && (
                  <Image
                    style={mediaStyles}
                    src={'http://localhost:4000/userfiles/' + message.attachment}
                    alt=''
                  />
                )}
     
                {isVideo && (
                  <video
                    controls
                    style={mediaStyles}
                    src={'http://localhost:4000/userfiles/' + message.attachment}
                    type='video/mp4'
                  />
                )}
              </>
            )}
          </Box>
        </Flex>
      </Stack>
    </Stack>
  );
};

export default MessageItem;
