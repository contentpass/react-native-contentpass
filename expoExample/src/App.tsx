import { StyleSheet, View } from 'react-native';
import { ContentpassSdkProvider } from './ContentpassContext';
import ContentpassUsage from './ContentpassUsage';

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
    <ContentpassSdkProvider>
      <View style={styles.container}>
        <ContentpassUsage />
      </View>
    </ContentpassSdkProvider>
  );
}
