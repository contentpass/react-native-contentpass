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
    planId: 'my-plan-id',
    redirectUrl: 'de.contentpass.test://oauth',
    apiUrl: 'https://cp.propert.com',
  };

  beforeEach(() => {
    (Contentpass as jest.MockedClass<typeof Contentpass>).mockImplementation(
      () => ({ destroy: jest.fn() }) as unknown as Contentpass
    );
  });

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

  it('destroys the Contentpass SDK instance on unmount', () => {
    const { unmount } = render(
      <ContentpassSdkProvider contentpassConfig={mockConfig}>
        <Text testID="child">Test Child</Text>
      </ContentpassSdkProvider>
    );

    const [result] = (Contentpass as jest.MockedClass<typeof Contentpass>).mock
      .results;

    unmount();

    expect(result!.value.destroy).toHaveBeenCalled();
  });
});
