import {
  Avatar,
  Box,
  Flex,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/react';
import { formatRelative } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import React, { useState } from 'react';
import { GoPrimitiveDot } from 'react-icons/go';
import { MdDeleteOutline } from 'react-icons/md';
import { BiLogOut } from 'react-icons/bi';
import { AiOutlineEdit } from 'react-icons/ai';
import { formatUsernames } from '../../../util/functions';

const formatRelativeLocale = {
  lastWeek: 'eeee',
  yesterday: '\'Yesterday\'',
  today: 'p',
  other: 'MM/dd/yy'
};

const ConversationItem = ({
  userId,
  conversation,
  onClick,
  isSelected
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = (event) => {
    if (event.type === 'click') onClick();

    else if (event.type === 'contextmenu') {
      event.preventDefault();

      setMenuOpen(true);
    }
  };

  return (
    <Stack
      direction='row'
      align='center'
      justify='space-between'
      p={4}
      cursor='pointer'
      borderRadius={4}
      bg={isSelected ? 'whiteAlpha.200' : 'none'}
      _hover={{ bg: 'whiteAlpha.200' }}
      onClick={handleClick}
      onContextMenu={handleClick}
      position='relative'
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
        <MenuList bg='#2d2d2d'>
          <MenuItem
            icon={<AiOutlineEdit fontSize={20} />}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            Edit
          </MenuItem>
          {conversation.participants.length > 2 ? (
            <MenuItem
              icon={<BiLogOut fontSize={20} />}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              Leave
            </MenuItem>
          ) : (
            <MenuItem
              icon={<MdDeleteOutline fontSize={20} />}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              Delete
            </MenuItem>
          )}
        </MenuList>
      </Menu>
      <Avatar src={conversation.image} />
      <Flex justify='space-between' width='80%' height='100%'>
        <Flex direction='column' width='70%' height='100%'>
          <Text
            fontWeight={600}
            whiteSpace='nowrap'
            overflow='hidden'
            textOverflow='ellipsis'
          >
            {formatUsernames(conversation.participants, userId)}
          </Text>
          {conversation.latestMessage && (
            <Box width='140%'>
              <Text
                color='whiteAlpha.700'
                whiteSpace='nowrap'
                overflow='hidden'
                textOverflow='ellipsis'
              >
                {conversation.latestMessage.body}
              </Text>
            </Box>
          )}
        </Flex>
        <Text color='whiteAlpha.700' textAlign='right'>
          {formatRelative(conversation.updatedAt, new Date(), {
            locale: {
              ...enUS,
              formatRelative: (token) =>
                formatRelativeLocale[token]
            }
          })}
        </Text>
      </Flex>
    </Stack>
  );
};

export default ConversationItem;
