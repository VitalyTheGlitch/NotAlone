import { useLazyQuery, useMutation } from '@apollo/client';
import {
  Box,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConversationOperations from '../../../../graphql/operations/conversations';
import UserOperations from '../../../../graphql/operations/users';
import ConversationItem from '../ConversationItem';
import Participants from './Participants';
import UserList from './UserList';

const ConversationModal = ({
  isOpen,
  onClose,
  session,
  conversations,
  editingConversation,
  onViewConversation,
  getUserParticipantObject
}) => {
  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState([]);
  const [existingConversation, setExistingConversation] = useState(null);

  const router = useRouter();
  const { user: { id: userId } } = session;

  const [
    searchUsers,
    {
      data: searchUsersData,
      loading: searchUsersLoading,
      error: searchUsersError
    }
  ] = useLazyQuery(UserOperations.Queries.searchUsers);

  const [createConversation, { loading: createConversationLoading }] = useMutation(ConversationOperations.Mutations.createConversation);
  const [updateParticipants, { loading: updateParticipantsLoading }] = useMutation(ConversationOperations.Mutations.updateParticipants);

  const onSubmit = () => {
    if (!participants.length) return;

    const participantIds = participants.map((p) => p.id);

    const existing = findExistingConversation(participantIds);

    if (existing) {
      toast('Conversation already exists');

      setExistingConversation(existing);

      return;
    }

    editingConversation ? onUpdateConversation(editingConversation) : onCreateConversation();
  };

  const findExistingConversation = (participantIds) => {
    let existingConversation = null;

    for (const conversation of conversations) {
      const addedParticipants = conversation.participants.filter(
        (p) => p.user.id !== userId
      );

      if (addedParticipants.length !== participantIds.length) continue;

      let allMatchingParticipants = false;
      for (const participant of addedParticipants) {
        const foundParticipant = participantIds.find(
          (p) => p === participant.user.id
        );

        if (!foundParticipant) {
          allMatchingParticipants = false;

          break;
        }

        allMatchingParticipants = true;
      }

      if (allMatchingParticipants) existingConversation = conversation;
    }

    return existingConversation;
  };

  const onCreateConversation = async () => {
    const participantIds = [userId, ...participants.map((p) => p.id)];

    try {
      const { data, errors } = await createConversation({
        variables: {
          participantIds
        }
      });

      if (!data?.createConversation || errors) throw new Error('Failed to create conversation');

      const { createConversation: { conversationId } } = data;

      router.push({ query: { conversationId } });

      setParticipants([]);
      setUsername('');
      onClose();
    } catch (error) {
      console.log('createConversations error', error);

      toast.error(error?.message);
    }
  };

  const onUpdateConversation = async (conversation) => {
    const participantIds = participants.map((p) => p.id);

    try {
      const { data, errors } = await updateParticipants({
        variables: {
          conversationId: conversation.id,
          participantIds
        }
      });

      if (!data?.updateParticipants || errors) throw new Error('Failed to update participants');

      setParticipants([]);
      setUsername('');
      onClose();
    } catch (error) {
      console.log('onUpdateConversation error', error);

      toast.error('Failed to update participants');
    }
  };

  const onSearch = (event) => {
    event.preventDefault();

    searchUsers({ variables: { username } });
  };

  const addParticipant = (user) => {
    setParticipants((prev) => [...prev, user]);
    setUsername('');
  };

  const removeParticipant = (userId) => {
    setParticipants((prev) => prev.filter((u) => u.id !== userId));
  };

  const onConversationClick = () => {
    if (!existingConversation) return;

    const { hasSeenLatestMessage } = getUserParticipantObject(existingConversation);

    onViewConversation(existingConversation.id, hasSeenLatestMessage);
    onClose();
  };

  useEffect(() => {
    if (editingConversation) {
      setParticipants(editingConversation.participants.map((p) => p.user));
      return;
    }
  }, [editingConversation]);

  useEffect(() => {
    setExistingConversation(null);
  }, [participants]);

  useEffect(() => {
    if (!isOpen) setParticipants([]);
  }, [isOpen]);

  if (searchUsersError) {
    toast.error('Error searching for users');

    return null;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'sm', md: 'md' }}>
        <ModalOverlay />
        <ModalContent bg='#1f1220' pb={4}>
          <ModalHeader>Find or Create a Conversation</ModalHeader>
          <ModalCloseButton
             _focus={{
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'brand.100',
            }}
            _hover={{
              borderColor: 'brand.100',
            }}
          />
          <ModalBody>
            <form onSubmit={onSearch}>
              <Stack spacing={4}>
                <Input
                  placeholder='Enter a username'
                  onChange={(event) => setUsername(event.target.value)}
                  value={username}
                  _focus={{
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'brand.100',
                  }}
                  _hover={{
                    borderColor: 'brand.100',
                  }}
                />
                <Button
                  width='100%'
                  type='submit'
                  isLoading={searchUsersLoading}
                  disabled={!username}
                >
                  Search
                </Button>
              </Stack>
            </form>
            {searchUsersData?.searchUsers && (
              <UserList
                users={searchUsersData.searchUsers}
                participants={participants}
                addParticipant={addParticipant}
              />
            )}
            {participants.length !== 0 && (
              <>
                <Participants
                  participants={participants.filter((p) => p.id !== userId)}
                  removeParticipant={removeParticipant}
                />
                <Box mt={4}>
                  {existingConversation && (
                    <ConversationItem
                      userId={userId}
                      conversation={existingConversation}
                      onClick={() => onConversationClick()}
                    />
                  )}
                </Box>
                <Button
                  bg='brand.100'
                  _hover={{ bg: 'brand.100' }}
                  width='100%'
                  mt={6}
                  disabled={!!existingConversation}
                  isLoading={
                    createConversationLoading || updateParticipantsLoading
                  }
                  onClick={onSubmit}
                >
                  {editingConversation ? 'Update Conversation' : 'Create Conversation'}
                </Button>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ConversationModal;
