import { useMutation } from '@apollo/client';
import { Box, Input } from '@chakra-ui/react';
import { ObjectID } from 'bson';
import React, { useState, useEffect } from 'react';
import { FaRegSmile, FaPaperclip, FaTimes } from 'react-icons/fa';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react';
import axios from 'axios'
import toast from 'react-hot-toast';
import MessageOperations from '../../../graphql/operations/messages';

const MessageInput = ({ session, conversationId }) => {
  useEffect(() => {
    document.title = 'Not Alone';
  }, []);

  const [messageBody, setMessageBody] = useState('');
  const [uploadedFile, setUploadedFile] = useState('');
  const [isPickerVisible, setPickerVisible] = useState(false);

  const [sendMessage] = useMutation(MessageOperations.Mutations.sendMessage);

  const send = async (attachmentFileName='') => {
    try {
      const { id: senderId } = session.user;
      const newId = new ObjectID().toString();
      const newMessage = {
        id: newId,
        senderId,
        conversationId,
        body: messageBody.replace(/  /g, ''),
        attachment: attachmentFileName
      };
      const { data, errors } = await sendMessage({
        variables: {
          ...newMessage
        },
        /**
         * Optimistically update UI
        **/
        optimisticResponse: {
          sendMessage: true
        },
        update: (cache) => {
          setMessageBody('');
          setUploadedFile('');
          const existing = cache.readQuery({
            query: MessageOperations.Query.messages,
            variables: { conversationId }
          });

          cache.writeQuery({
            query: MessageOperations.Query.messages,
            variables: { conversationId },
            data: {
              ...existing,
              messages: [
                {
                  id: newId,
                  body: messageBody.replace(/  /g, ''),
                  attachment: attachmentFileName,
                  senderId: session.user.id,
                  conversationId,
                  sender: {
                    id: session.user.id,
                    username: session.user.username,
                    image: session.user.image
                  },
                  createdAt: new Date(Date.now()),
                  updatedAt: new Date(Date.now())
                },
                ...existing.messages
              ]
            }
          });
        }
      });

      if (!data?.sendMessage || errors) throw new Error('Error sending message');
    } catch (error) {
      console.log('onSendMessage error', error);

      toast.error(error?.message);
    }
  }

  const onSendMessage = async (event) => {
    event.preventDefault();

    if (!(messageBody.replace(/ /g, '') || uploadedFile)) return;

    if (uploadedFile) {
      const loading = toast.loading('Uploading file...');

      const formData = new FormData();

      formData.append('file', uploadedFile);

      axios.post(
        'http://localhost:4000/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      ).then(res => {
        toast.remove(loading);

        send(res.data);
      }).catch(err => {
        console.log(err);
        
        toast.remove(loading);
        toast.error(err.response.data.message);
      });
    }

    else send();
  };

  useEffect(() => {
    const pickerStyle = document.createElement('style');

    document.head.appendChild(pickerStyle);

    pickerStyle.innerHTML = `
    em-emoji-picker {
      --border-radius: 24px;
      --category-icon-size: 24px;
      --color-border-over: rgba(0, 0, 0, 0.1);
      --color-border: rgba(0, 0, 0, 0.05);
      --font-family: 'PT Sans';
      --font-size: 20px;
      --rgb-accent: 255, 23, 77;
      height: 50vh;
      min-height: 400px;
      max-height: 800px;
    }
    `;
  }, []);

  return (
    <Box px={4} py={6} width='100%'>
      <form encType='multipart/form-data' onSubmit={onSendMessage}>
        <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            position: 'relative',
            marginLeft: '30px',
            marginBottom: '5px'
          }}
        >
          {!!uploadedFile && (
            <p>{uploadedFile.name}</p>
          )}
          {uploadedFile && (
            <FaTimes
              cursor='pointer'
              onClick={() => setUploadedFile('')}
            />
          )}
        </div>
        <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {isPickerVisible && (
            <div style={{
                position: 'absolute',
                bottom: '50px',
                left: '25px',
              }}
            >
              <Picker
                theme='dark'
                data={data}
                onEmojiSelect={( emoji ) => setMessageBody(messageBody + emoji.native)}
              />
            </div>
          )}
          <FaRegSmile
            cursor='pointer'
            color={isPickerVisible ? '#ff174d' : 'white'}
            onClick={() => setPickerVisible(v => !v)}
          />
          <Input
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            width='95%'
            size='md'
            paddingBottom='2px'
            placeholder='Message'
            color='whiteAlpha.900'
            resize='none'
            maxLength='2048'
            _focus={{
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'whiteAlpha.300',
            }}
            _hover={{
              borderColor: 'whiteAlpha.300',
            }}
          />
          <label>
            <FaPaperclip
                cursor='pointer'
                color='white'
            />
            <Input
              type='file'
              name='uploadedFile'
              onChange={(e) => setUploadedFile(e.target.files[0])}
              display='none'
            />
          </label>
        </div>
      </form>
    </Box>
  );
};

export default MessageInput;
