import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import {
  ContentpassStateType,
  useContentpassSdk,
} from '@contentpass/react-native-contentpass';

export default function Content({ cmpAdapter }: { cmpAdapter: CmpAdapter }) {
  const sdk = useContentpassSdk();

  const [hasFullConsent, setHasFullConsent] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    cmpAdapter?.onConsentStatusChange((fullConsent: boolean) => {
      setHasFullConsent(fullConsent);
    });
  }, [cmpAdapter]);

  useEffect(() => {
    sdk.registerObserver((state) => {
      setIsAuthenticated(state.state === ContentpassStateType.AUTHENTICATED);
    });
  }, [sdk]);

  async function openOneTrustSettings() {
    try {
      await cmpAdapter.showSecondLayer('purpose');
    } catch (error) {
      console.error('Failed to open OneTrust settings', error);
    }
  }

  return (
    <View>
      <Text>Hello World!</Text>
      <Text>Has full consent: {hasFullConsent ? 'Yes' : 'No'}</Text>
      <Button title="OneTrust Settings" onPress={openOneTrustSettings} />
      {hasFullConsent && (
        <Button
          title="Deny All"
          onPress={() => {
            cmpAdapter!.denyAll();
          }}
        />
      )}
      <Text>Is authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
      {isAuthenticated && (
        <Button
          title="Logout"
          onPress={() => {
            sdk.logout();
          }}
        />
      )}
    </View>
  );
}
