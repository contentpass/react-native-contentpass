import parseContentpassToken, * as ParseContentpassTokenModule from './parseContentpassToken';
import validateSubscription from './validateSubscription';

const EXAMPLE_CONTENTPASS_TOKEN: ReturnType<typeof parseContentpassToken> = {
  body: {
    aud: 'cc3fc4ad',
    auth: true,
    exp: 1733312081,
    iat: 1733135681,
    type: 'cp',
    plans: ['planId1'],
  },
  header: {
    alg: 'RS256',
    kid: 'kid',
  },
};

describe('validateSubscription', () => {
  let parseContentpassTokenSpy: jest.SpyInstance;
  beforeEach(() => {
    parseContentpassTokenSpy = jest
      .spyOn(ParseContentpassTokenModule, 'default')
      .mockReturnValue(EXAMPLE_CONTENTPASS_TOKEN);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should return true if the token is valid', () => {
    parseContentpassTokenSpy.mockReturnValue(EXAMPLE_CONTENTPASS_TOKEN);
    const result = validateSubscription('example_contentpass_token');

    expect(result).toBe(true);
  });

  it('should return false if the token is invalid', () => {
    parseContentpassTokenSpy.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const result = validateSubscription('example_contentpass_token');

    expect(result).toBe(false);
  });

  it('should return false if the user is not authenticated', () => {
    parseContentpassTokenSpy.mockReturnValue({
      ...EXAMPLE_CONTENTPASS_TOKEN,
      body: {
        ...EXAMPLE_CONTENTPASS_TOKEN.body,
        auth: false,
      },
    });
    const result = validateSubscription('example_contentpass_token');

    expect(result).toBe(false);
  });

  it('should return false if the user has no plans', () => {
    parseContentpassTokenSpy.mockReturnValue({
      ...EXAMPLE_CONTENTPASS_TOKEN,
      body: {
        ...EXAMPLE_CONTENTPASS_TOKEN.body,
        plans: [],
      },
    });
    const result = validateSubscription('example_contentpass_token');

    expect(result).toBe(false);
  });
});
