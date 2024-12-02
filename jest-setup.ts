import '@testing-library/react-native/extend-expect';

jest.mock('react-native-app-auth', () => ({
  authorize: jest.fn(),
}));

jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve('{ "foo": 1 }')),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
