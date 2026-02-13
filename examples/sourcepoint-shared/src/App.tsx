import { StyleSheet, View } from 'react-native';
import ContentpassUsage from './ContentpassUsage';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { contentpassConfigTesting as contentpassConfig } from './contentpassConfig';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});

export default function App() {
  return (
    <ContentpassSdkProvider contentpassConfig={contentpassConfig}>
      <View style={styles.container}>
        <ContentpassUsage />
      </View>
    </ContentpassSdkProvider>
  );
}
