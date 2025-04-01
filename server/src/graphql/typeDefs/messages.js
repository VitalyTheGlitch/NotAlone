import gql from 'graphql-tag';

const typeDefs = gql`
  type Message {
    id: String
    sender: User
    body: String
    attachment: String
    createdAt: Date
  }

  type Query {
    messages(conversationId: String): [Message]
  }

  type Mutation {
    sendMessage(
      id: String
      conversationId: String
      senderId: String
      body: String
      attachment: String
    ): Boolean
    deleteMessage(messageId: String!): Boolean
  }

  type Subscription {
    messageSent(conversationId: String): Message
    messageDeleted(conversationId: String): Message
  }
`;

export default typeDefs;
