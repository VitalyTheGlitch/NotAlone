import { useMutation } from '@apollo/client';
import { Box, Button, Text } from '@chakra-ui/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { IModalContext, ModalContext } from '../../../context/ModalContext';
import ConversationOperations from '../../../graphql/operations/conversations';
import ConversationItem from './ConversationItem';
import ConversationModal from './Modal/Modal';

const ConversationList = ({
  session,
  conversations,
  onViewConversation
}) => {
  const { user: { id: userId } } = session;

  const { modalOpen, openModal, closeModal } = useContext(ModalContext);
  const [editingConversation, setEditingConversation] = useState(null);

  const router = useRouter();

  const { conversationId } = router.query;

  const [updateParticipants, { loading: updateParticipantsLoading }] = useMutation(ConversationOperations.Mutations.updateParticipants);
  const [deleteConversation] = useMutation(ConversationOperations.Mutations.deleteConversation);

  const onLeaveConversation = async (conversation) => {
    const participantIds = conversation.participants.filter((p) => p.user.id !== userId).map((p) => p.user.id);

    try {
      const { data, errors } = await updateParticipants({
        variables: {
          conversationId: conversation.id,
          participantIds
        }
      });

      if (!data || errors) throw new Error('Failed to update participants');
    } catch (error) {
      console.log('onUpdateConversation error', error);

      toast.error(error?.message);
    }
  };

  const onDeleteConversation = async (conversationId) => {
    try {
      toast.promise(
        deleteConversation({
          variables: {
            conversationId
          },
          update: () => {
            router.replace(
              typeof process.env.NEXT_PUBLIC_BASE_URL === 'string' ? process.env.NEXT_PUBLIC_BASE_URL : ''
            );
          }
        }),
        {
          loading: 'Deleting conversation',
          success: 'Conversation deleted',
          error: 'Failed to delete conversation'
        }
      );
    } catch (error) {
      console.log('onDeleteConversation error', error);
    }
  };

  const getUserParticipantObject = (conversation) => {
    return conversation.participants.find(
      (p) => p.user.id === session.user.id
    );
  };

  const onEditConversation = (conversation) => {
    setEditingConversation(conversation);
    openModal();
  };

  const toggleClose = () => {
    setEditingConversation(null);
    closeModal();
  };

  const sortedConversations = [...conversations].sort(
    (a, b) => b.updatedAt.valueOf() - a.updatedAt.valueOf()
  );

  return (
    <Box width='100%' overflow='hidden'>
      <Box
        py={2}
        px={4}
        mb={4}
        bg='blackAlpha.300'
        borderRadius={4}
        cursor='pointer'
        onClick={openModal}
      >
        <Text color='whiteAlpha.800' fontWeight={500}>
          Find or start a conversation
        </Text>
      </Box>
      <ConversationModal
        isOpen={modalOpen}
        onClose={toggleClose}
        session={session}
        conversations={conversations}
        editingConversation={editingConversation}
        onViewConversation={onViewConversation}
        getUserParticipantObject={getUserParticipantObject}
      />
      {sortedConversations.map((conversation) => {
        const { hasSeenLatestMessage } = getUserParticipantObject(conversation);

        return (
          <ConversationItem
            key={conversation.id}
            userId={session.user.id}
            conversation={conversation}
            hasSeenLatestMessage={hasSeenLatestMessage}
            selectedConversationId={conversationId}
            onClick={() =>
              onViewConversation(conversation.id, hasSeenLatestMessage)
            }
            onEditConversation={() => onEditConversation(conversation)}
            onDeleteConversation={onDeleteConversation}
            onLeaveConversation={onLeaveConversation}
          />
        );
      })}
      <Box
        position='absolute'
        bottom={0}
        left={0}
        width='100%'
        bg='#1f1220'
        px={8}
        py={6}
        zIndex={1}
      >
        <Button width='100%' bg='#221826' onClick={() => signOut()}>
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default ConversationList;
