import '@testing-library/react-native/extend-expect';

jest.mock('react-native-app-auth', () => ({
  authorize: jest.fn(),
  refresh: jest.fn(),
}));

jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('@sentry/react-native', () => ({
  ReactNativeClient: jest.fn().mockReturnValue({
    init: jest.fn(),
  }),
  Scope: jest.fn().mockReturnValue({
    setClient: jest.fn(),
    setExtra: jest.fn(),
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
  }),
}));

jest.mock('@sentry/react-native/dist/js/integrations/default', () => ({
  getDefaultIntegrations: jest.fn().mockReturnValue([]),
}));
