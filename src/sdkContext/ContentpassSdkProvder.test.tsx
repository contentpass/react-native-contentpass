import { ContentpassSdkProvider } from './ContentpassSdkProvider';
import type { ContentpassConfig } from '../types/ContentpassConfig';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import Contentpass from '../Contentpass';

jest.mock('../Contentpass');

describe('ContentpassSdkProvider', () => {
  const mockConfig: ContentpassConfig = {
    issuer: 'https://my.contentpass.me',
    propertyId: 'my-property-id',
    redirectUrl: 'de.contentpass.test://oauth',
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes Contentpass SDK with the given configuration', () => {
    render(
      <ContentpassSdkProvider contentpassConfig={mockConfig}>
        <Text testID="child">Test Child</Text>
      </ContentpassSdkProvider>
    );

    expect(Contentpass).toHaveBeenCalledWith(mockConfig);
    expect(screen.getByTestId('child')).toHaveTextContent('Test Child');
  });
});