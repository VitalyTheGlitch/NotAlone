import { useMutation } from '@apollo/client';
import { Button, Center, Image, Input, Stack, Text } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import UserOperations from '../../graphql/operations/users';

const Auth = ({ session, reloadSession }) => {
  const [username, setUsername] = useState('');

  const [createUsername, { data, loading, error }] = useMutation(UserOperations.Mutations.createUsername);

  const onSubmit = async () => {
    if (!username) return;

    try {
      const { data } = await createUsername({
        variables: {
          username
        }
      });

      if (!data?.createUsername) throw new Error();

      if (data.createUsername.error) {
        const { createUsername: { error } } = data;

        toast.error(error);

        return;
      }

      toast.success('Account successfully created');

      reloadSession();
    } catch (error) {
      toast.error('There was an error');

      console.log('onSubmit error', error);
    }
  };

  useEffect(() => {
    document.title = 'Not Alone';
  }, []);

  return (
    <Center height='100vh'>
      <Stack spacing={8} align='center'>
        {session ? (
          <>
            <Text fontSize='3xl'>Create a Username</Text>
            <Input
              placeholder='Enter a username'
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
            />
            <Button onClick={onSubmit} width='100%' isLoading={loading}>
              Save
            </Button>
          </>
        ) : (
          <>
            <Image height={200} src='/images/notalone-logo.jpg' alt='Not Alone' />
            <Text fontSize='4xl'>Not Alone</Text>
            <Text width='70%' align='center'>
              Sign in with Google to send unlimited free messages to your
              friends
            </Text>
            <Button
              onClick={() => signIn('google')}
              leftIcon={<Image height='20px' src='/images/google-logo.png' alt='Google' />}
            >
              Continue with Google
            </Button>
          </>
        )}
      </Stack>
    </Center>
  );
};

export default Auth;
