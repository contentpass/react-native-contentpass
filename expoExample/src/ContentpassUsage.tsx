import { useContentpassSdk } from './ContentpassContext';
import { Button, Text } from 'react-native';
import { useState } from 'react';
import type { AuthenticateResult } from 'react-native-contentpass';

export default function ContentpassUsage() {
  const [authResult, setAuthResult] = useState<
    AuthenticateResult | undefined
  >();
  const contentpassSdk = useContentpassSdk();

  const authenticate = async () => {
    const result = await contentpassSdk.authenticate();
    setAuthResult(result);
  };

  return (
    <>
      <Button title={'Authenticate'} onPress={authenticate} />
      <Text>Result: {JSON.stringify(authResult)}</Text>
    </>
  );
}
