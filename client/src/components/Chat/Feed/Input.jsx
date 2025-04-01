import { useMutation } from '@apollo/client';
import { Text, Box, Input, Textarea } from '@chakra-ui/react';
import { ObjectID } from 'bson';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaRegSmile, FaPaperclip, FaTimes, FaArrowRight } from 'react-icons/fa';
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
  const [isDragging, setIsDragging] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [sendMessage] = useMutation(MessageOperations.Mutations.sendMessage);

  const textAreaRef = useRef(null);
  const dropZoneRef = useRef(null);
  const debounceTimer = useRef(null);

  const send = async (attachmentFileName='') => {
    try {
      const { id: senderId } = session.user;
      const newId = new ObjectID().toString();
      const newMessage = {
        id: newId,
        senderId,
        conversationId,
        body: messageBody.trim().replace(/  /g, ''),
        attachment: attachmentFileName
      };
      const { data, errors } = await sendMessage({
        variables: {
          ...newMessage
        },
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
                  body: messageBody.trim().replace(/  /g, ''),
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

  const onSendMessage = (event) => {
    event.preventDefault();

    if (!(messageBody.trim().replace(/ /g, '') || uploadedFile)) return;

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

  const onKeyDown = useCallback((event) => {
    if (event.key == 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (!isMobile) onSendMessage(event);

      else {
        const textarea = textAreaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        setMessageBody(prev =>
          prev.substring(0, start) +
          '\n' +
          prev.substring(end)
        );

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
    }
  }, [isMobile, onSendMessage]);

  const onDragEnter = useCallback((event) => {
    e.preventDefault();

    if (e.dataTransfer.items?.length) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      setIsDragging(true);
    }
  }, [debounceTimer]);

  const onDragLeave = useCallback((event) => {
    e.preventDefault();

    debounceTimer.current = setTimeout(() => {
      setIsDragging(false);
    }, 100);
  }, [debounceTimer]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    setIsDragging(false);

    const files = event.dataTransfer.files;

    if (files.length) setUploadedFile(files[0]);
  }, []);

  const onPaste = useCallback((event) => {
    const items = event.clipboardData.items;

    for (const item of items) {
      if (item.kind === 'file') {
        event.preventDefault();

        const file = item.getAsFile();

        setUploadedFile(file);

        break;
      }
    }
  }, []);

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

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [messageBody]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);

      setIsMobile(isMobile);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Box
      style={{
        border: isDragging ? '2px dashed #fff' : 'none',
        borderRadius: '8px'
      }}
      px={4}
      py={6}
      width='100%'
      ref={dropZoneRef}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {isDragging && (
        <Box
          display='flex'
          position='absolute'
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg='rgba(0,0,0,0.5)'
          justifyContent='center'
          alignItems='center'
          zIndex={1}
        >
          <Text fontSize='xl' color='#fff'>
            Drop the file to upload
          </Text>
        </Box>
      )}
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
                left: '25px'
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
          <Textarea
            ref={textAreaRef}
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            flex='1'
            width='95%'
            size='md'
            paddingBottom='10px'
            lineHeight='1.5'
            placeholder='Message'
            color='whiteAlpha.900'
            resize='none'
            maxLength='2048'
            overflow='hidden'
            rows={1}
            _focus={{
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'whiteAlpha.300'
            }}
            _hover={{
              borderColor: 'whiteAlpha.300'
            }}
          />
          <label>
            <FaPaperclip
              color='white'
              cursor='pointer'
            />
            <Input
              type='file'
              name='uploadedFile'
              onChange={(e) => setUploadedFile(e.target.files[0])}
              display='none'
            />
          </label>
          <button
            type='submit'
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <FaArrowRight color='white' />
          </button>
        </div>
      </form>
    </Box>
  );
};

export default MessageInput;
