import { gql } from '@apollo/client';

export const MessageFields = `
  id
  sender {
    id
    username
    image
  }
  body
  attachment
  createdAt
`;

export default {
  Query: {
    messages: gql`
      query Messages($conversationId: String!) {
        messages(conversationId: $conversationId) {
          ${MessageFields}
        }
      }
    `
  },
  Mutations: {
    sendMessage: gql`
      mutation SendMessage(
        $id: String!
        $conversationId: String!
        $senderId: String!
        $body: String!
        $attachment: String!
      ) {
        sendMessage(
          id: $id
          conversationId: $conversationId
          senderId: $senderId
          body: $body
          attachment: $attachment
        )
      }
    `,
    deleteMessage: gql`
      mutation DeleteMessage($messageId: String!) {
        deleteMessage(messageId: $messageId)
      }
    `
  },
  Subscriptions: {
    messageSent: gql`
      subscription MessageSent($conversationId: String!) {
        messageSent(conversationId: $conversationId) {
          ${MessageFields}
        }
      }
    `,
    messageDeleted: gql`
      subscription MessageDeleted($conversationId: String!) {
        messageDeleted(conversationId: $conversationId) {
          ${MessageFields}
        }
      }
    `
  }
};
