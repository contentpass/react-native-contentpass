import type { ContentpassConfig } from './types/ContentpassConfig';
import Contentpass from './Contentpass';
import type { AuthorizeResult } from 'react-native-app-auth';
import * as AppAuthModule from 'react-native-app-auth';
import * as OidcAuthStateStorageModule from './OidcAuthStateStorage';
import type { ContentpassState } from './types/ContentpassState';
import OidcAuthStateStorage from './OidcAuthStateStorage';
import * as FetchContentpassTokenModule from './contentpassTokenUtils/fetchContentpassToken';
import { SCOPES } from './consts/oidcConsts';
import * as SentryIntegrationModule from './sentryIntegration';
import * as SendStatsModule from './countImpressionUtils/sendStats';
import * as SendPageViewEventModule from './countImpressionUtils/sendPageViewEvent';
import * as LoggerModule from './logger';

const config: ContentpassConfig = {
  propertyId: '5803179c-5b9f-40be-9a91-e67e8ea20593',
  planId: 'planId-1',
  redirectUrl: 'de.test.net://oauth',
  issuer: 'https://issuer.net',
  apiUrl: 'https://cp.property.com',
  samplingRate: 1,
};

const NOW = new Date('2024-12-02T11:53:56.272Z').getTime();

const EXAMPLE_AUTH_RESULT: AuthorizeResult = {
  accessToken:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6IjY5NzUwYTZjLTNmYjctNDUyNi05NWY4LTVhZmYxMmIyZjFjOSJ9.eyJqdGkiOiIwNXdQZk83SFNvcVBjUlE3ci00TmEiLCJzdWIiOiI4OWNiNjZkNi05NzgzLTRkMjktODQ0Zi0zYjc0MWUxYmQxNjMiLCJpYXQiOjE3MzMxMzc3MzAsImV4cCI6MTczMzE0MTMzMCwic2NvcGUiOiJvcGVuaWQgY29udGVudHBhc3Mgb2ZmbGluZV9hY2Nlc3MiLCJjbGllbnRfaWQiOiJjYzNmYzRhZC1jYmU1LTRkMDktYmY4NS1hNDk3OTY2MDNiMTkiLCJpc3MiOiJodHRwczovL215LmNvbnRlbnRwYXNzLmRldiIsImF1ZCI6ImNjM2ZjNGFkLWNiZTUtNGQwOS1iZjg1LWE0OTc5NjYwM2IxOSJ9.F7NdahJ2xB9CuhXkZXKZH2F20Az1MlWb4GUrYpK1ZdY_nbFNZFjUSNubVxlilGzgevLXl4yh2ANr7e3Kbl6dc-1AwzGfBJRNc2Zch9UHRIqZk_4uOIMgNtDOvBqzC9aZAS--MM3wEdriTEIBdubuMLSiKDPq2AgKAminL7fu6aSAFAhqe0ynVtB8IwUaAfoDHH0XtnKVaBQz03CNmepwaXJ4UEk2Ko8o_AW8eLjOX85ITegNSCCiFGW-zDmELF1mgRxzLDEuUAKyX3p8rtlT-DJdJD6u-gwEWW6g27WBlB4qnIm2tsjZrPjKL4-ZC4jabwKdZNes8D5kahQuFfoRSw',
  accessTokenExpirationDate: '2024-12-02T12:08:50Z',
  authorizeAdditionalParameters: { iss: 'https://my.demo.dev' },
  idToken:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjY5NzUwYTZjLTNmYjctNDUyNi05NWY4LTVhZmYxMmIyZjFjOSJ9.eyJzdWIiOiI4OWNiNjZkNi05NzgzLTRkMjktODQ0Zi0zYjc0MWUxYmQxNjMiLCJzdWJzY3JpcHRpb25zIjpbXSwiY2FuY2VsbGVkU3Vic2NyaXB0aW9ucyI6W10sImlzY3AiOnRydWUsImlzQWRtaW4iOmZhbHNlLCJub25jZSI6InRtbVluZjc1WUNXS0hDSmZaN1RSUGFVVUFheDZ1RVVPcFM4QjZVTW5EWGsiLCJhdF9oYXNoIjoiN1hFcjJBaWZtMWZtaG94QXV2TG9TdyIsImF1ZCI6ImNjM2ZjNGFkLWNiZTUtNGQwOS1iZjg1LWE0OTc5NjYwM2IxOSIsImV4cCI6MTczMzMxNDEzMCwiaWF0IjoxNzMzMTM3NzMwLCJpc3MiOiJodHRwczovL215LmNvbnRlbnRwYXNzLmRldiJ9.ZC3QZN7OTmgLXqBouHzzmhGKWR9vTvJ_OrNB6cM5A90TTD-jPRx5-5lXoZEUuI1LGUMu3TDGphTzr945Ck0C5ArRACiilJy2RHUZPh_cEgdMXQLuMxwBT1Uw5uQAXXMdjjUV2GV3a7KNxJmcWkueHqvJBDmIK5iLUwDuhks_Qs6mE6XpPDdJSToIIaM2x5J2eD5XNaY6YcE93Uum6Qwbu_NrpWE77OwzA2NWqBnpPnTJ-U4BcZcAt1u_j9X-EZygWUF34cZvyZb6REFBDA3IuxGSZ-ZVmVKoPvOpgNoxoNf0l5Cg-0WqE7mgY1M9aFiirwnEbDHYeqYgoPopm3KoKw',
  refreshToken: 'vSYGtY9lMOsVQaolJJO_TwTjtO0UrjS1Ie5HQ4Yg4WQ',
  scopes: [],
  tokenAdditionalParameters: {},
  tokenType: 'Bearer',
  authorizationCode: '',
};

const EXAMPLE_REFRESH_RESULT = {
  ...EXAMPLE_AUTH_RESULT,
  accessTokenExpirationDate: '2024-12-03T10:00:50Z',
};

const CONTENTPASS_TOKEN_WITH_PLANS =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY5NzUwYTZjLTNmYjctNDUyNi05NWY4LTVhZmYxMmIyZjFjOSJ9.eyJhdXRoIjp0cnVlLCJ0eXBlIjoiY3AiLCJwbGFucyI6WyIwYWNhZTkxNy1iZTk5LTQ4ZWEtYjhmMS0yMGZhNjhhNDdkM2EiLCI0NDIxNjI4Yy05NjA2LTRjMDEtOGU1ZC1jMmE5YmNhNjhhYjQiLCI3ZThkZTBjYy0zZTk3LTQ5YTItODgxZC05ZmZiNWI4NDE1MTUiLCJhNDcyMWRiNS02N2RmLTQxNDUtYmJiZi1jYmQwOWY3ZTAzOTciLCJjNGQzYjBmNS05ODlhLTRmN2ItOGFjNy0zZDhmZmE5NTcxN2YiLCI2NGRkOTkwNS05NmUxLTRmYjItOTgwZC01MDdmMTYzNzVmZTkiXSwiYXVkIjoiY2MzZmM0YWQiLCJpYXQiOjE3MzMxMzU2ODEsImV4cCI6MTczMzMxMjA4MX0.CMtH7HRLf2HVgw3_cZRN0en8tml_SQKM73iLGJAp72-vJuRJaq85xBp6Jgy9WD3L7x4itRlBAYZxX8tLxZGogU0WP4_dMGFQ2QlcwKshwJygwRM1YqvxGWX2Az_KxEMc2QGHvpE1qe2MAr_xOU7VFfc0-vWxFc3hRzpAM5j7YHctj2t1v6h9-M7V2Hkcn37569QmtgU8gJkUxXsgUTufbb1ikjjjAvnjvTluHJo51_utbimpUbCk3EFxXVCVEI_pAqiZQXNninUQ6dbSujLb3L2UlEdQzLeUiBdYroeFzSyruLrR841ledLQ5ZP2OqzF5oUMuAGVOOhmgGdwGMCDRQ';

export const CONTENTPASS_TOKEN_WITHOUT_PLANS =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY5NzUwYTZjLTNmYjctNDUyNi05NWY4LTVhZmYxMmIyZjFjOSJ9.eyJhdXRoIjp0cnVlLCJ0eXBlIjoiY3AiLCJwbGFucyI6W10sImF1ZCI6ImNjM2ZjNGFkIiwiaWF0IjoxNzMzMTM1NjgxLCJleHAiOjE3MzMzMTIwODF9.CMtH7HRLf2HVgw3_cZRN0en8tml_SQKM73iLGJAp72-vJuRJaq85xBp6Jgy9WD3L7x4itRlBAYZxX8tLxZGogU0WP4_dMGFQ2QlcwKshwJygwRM1YqvxGWX2Az_KxEMc2QGHvpE1qe2MAr_xOU7VFfc0-vWxFc3hRzpAM5j7YHctj2t1v6h9-M7V2Hkcn37569QmtgU8gJkUxXsgUTufbb1ikjjjAvnjvTluHJo51_utbimpUbCk3EFxXVCVEI_pAqiZQXNninUQ6dbSujLb3L2UlEdQzLeUiBdYroeFzSyruLrR841ledLQ5ZP2OqzF5oUMuAGVOOhmgGdwGMCDRQ';

describe('Contentpass', () => {
  let contentpass: Contentpass;
  let authorizeSpy: jest.SpyInstance;
  let refreshSpy: jest.SpyInstance;
  let reportErrorSpy: jest.SpyInstance;
  let fetchContentpassTokenSpy: jest.SpyInstance;
  let oidcAuthStorageMock: OidcAuthStateStorage;
  let sendStatsSpy: jest.SpyInstance;
  let sendPageViewEventSpy: jest.SpyInstance;
  let enableLoggerSpy: jest.SpyInstance;
  let initSentrySpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    authorizeSpy = jest
      .spyOn(AppAuthModule, 'authorize')
      .mockResolvedValue(EXAMPLE_AUTH_RESULT);
    refreshSpy = jest
      .spyOn(AppAuthModule, 'refresh')
      .mockResolvedValue(EXAMPLE_REFRESH_RESULT);
    reportErrorSpy = jest
      .spyOn(SentryIntegrationModule, 'reportError')
      .mockReturnValue(undefined);

    initSentrySpy = jest
      .spyOn(SentryIntegrationModule, 'initSentry')
      .mockReturnValue(undefined);

    oidcAuthStorageMock = {
      storeOidcAuthState: jest.fn(),
      getOidcAuthState: jest.fn(),
      clearOidcAuthState: jest.fn(),
    } as any as OidcAuthStateStorage;

    jest
      .spyOn(OidcAuthStateStorageModule, 'default')
      .mockReturnValue(oidcAuthStorageMock);

    fetchContentpassTokenSpy = jest
      .spyOn(FetchContentpassTokenModule, 'default')
      .mockResolvedValue(CONTENTPASS_TOKEN_WITH_PLANS);

    sendStatsSpy = jest
      .spyOn(SendStatsModule, 'default')
      .mockResolvedValue({ ok: true } as any);

    sendPageViewEventSpy = jest
      .spyOn(SendPageViewEventModule, 'default')
      .mockResolvedValue({ ok: true } as any);

    enableLoggerSpy = jest
      .spyOn(LoggerModule, 'enableLogger')
      .mockReturnValue(undefined);

    contentpass = new Contentpass(config);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should throw an error if sampling rate is not between 0 and 1', () => {
      expect(
        () =>
          new Contentpass({
            ...config,
            samplingRate: -1,
          })
      ).toThrow('Sampling rate must be between 0 and 1');

      expect(
        () =>
          new Contentpass({
            ...config,
            samplingRate: 2,
          })
      ).toThrow('Sampling rate must be between 0 and 1');
    });

    it('should initialise sentry', () => {
      expect(initSentrySpy).toHaveBeenCalledWith({
        propertyId: config.propertyId,
      });
    });

    it('should initialise contentpass state', () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });
      expect(contentpassStates).toHaveLength(1);
      expect(contentpassStates[0]).toEqual({
        state: 'UNAUTHENTICATED',
        hasValidSubscription: false,
      });
    });

    it('should initialise with previous state if exists in storage', async () => {
      (oidcAuthStorageMock.getOidcAuthState as jest.Mock).mockResolvedValue(
        EXAMPLE_AUTH_RESULT
      );
      contentpass = new Contentpass(config);
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      await jest.advanceTimersByTimeAsync(100);

      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[0]).toEqual({
        state: 'INITIALISING',
      });
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });
    });

    it('should refresh token instantly if the token from previous state expired', async () => {
      (oidcAuthStorageMock.getOidcAuthState as jest.Mock).mockResolvedValue({
        ...EXAMPLE_AUTH_RESULT,
        accessTokenExpirationDate: '2024-12-02T11:53:56.272Z',
      });
      contentpass = new Contentpass(config);
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      expect(contentpassStates).toHaveLength(1);
      expect(contentpassStates[0]).toEqual({
        state: 'INITIALISING',
      });

      await jest.advanceTimersByTimeAsync(100);

      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(refreshSpy).toHaveBeenCalledWith(
        {
          clientId: config.propertyId,
          redirectUrl: config.redirectUrl,
          issuer: config.issuer,
          scopes: SCOPES,
        },
        { refreshToken: EXAMPLE_AUTH_RESULT.refreshToken }
      );
      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });
    });

    it('should enable logger if logLevel is set', () => {
      contentpass = new Contentpass({
        ...config,
        logLevel: 'info',
      });

      expect(enableLoggerSpy).toHaveBeenCalledWith('info');
    });
  });

  describe('authenticate', () => {
    it('should call authorize with the correct parameters', async () => {
      await contentpass.authenticate();

      expect(authorizeSpy).toHaveBeenCalledWith({
        additionalParameters: {
          cp_property: config.propertyId,
          cp_plan: config.planId,
          cp_route: 'login',
          prompt: 'consent',
        },
        clientId: config.propertyId,
        issuer: config.issuer,
        redirectUrl: config.redirectUrl,
        scopes: ['openid', 'offline_access', 'contentpass'],
      });
    });

    it('should change contentpass state to error when authorize throws an error', async () => {
      const contentpassStates: ContentpassState[] = [];
      const error = new Error('Authorize error');
      authorizeSpy.mockRejectedValue(error);
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      await expect(async () => {
        await contentpass.authenticate();
      }).rejects.toThrow(error);

      expect(reportErrorSpy).toHaveBeenCalledWith(error, {
        msg: 'Failed to authorize',
      });

      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'ERROR',
        error,
      });
    });

    it('should fetch contentpass token and validate it after successful authorize', async () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      await contentpass.authenticate();

      expect(oidcAuthStorageMock.storeOidcAuthState).toHaveBeenCalledWith(
        EXAMPLE_AUTH_RESULT
      );
      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });
    });

    it('should set error state if fetching contentpass token fails after successful authorize', async () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });
      const error = new Error('Fetch error');
      fetchContentpassTokenSpy.mockRejectedValue(error);

      await contentpass.authenticate();

      expect(oidcAuthStorageMock.storeOidcAuthState).toHaveBeenCalledWith(
        EXAMPLE_AUTH_RESULT
      );
      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'ERROR',
        error,
      });
    });

    it('should setup a refresh token timer', async () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      await contentpass.authenticate();

      const expirationDate = new Date(
        EXAMPLE_AUTH_RESULT.accessTokenExpirationDate
      ).getTime();
      const expectedDelay = expirationDate - NOW;

      expect(refreshSpy).toHaveBeenCalledTimes(0);
      jest.advanceTimersByTime(expectedDelay);
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(refreshSpy).toHaveBeenCalledWith(
        {
          clientId: config.propertyId,
          redirectUrl: config.redirectUrl,
          issuer: config.issuer,
          scopes: SCOPES,
        },
        { refreshToken: EXAMPLE_AUTH_RESULT.refreshToken }
      );

      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });
    });

    it('should not setup a refresh token timer if no expiration date is available', async () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      authorizeSpy.mockResolvedValue({
        ...EXAMPLE_AUTH_RESULT,
        accessTokenExpirationDate: undefined,
      });

      await contentpass.authenticate();

      expect(refreshSpy).toHaveBeenCalledTimes(0);

      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });
    });

    it('should set error state if refresh token fails', async () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      await contentpass.authenticate();

      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });

      const expirationDate = new Date(
        EXAMPLE_AUTH_RESULT.accessTokenExpirationDate
      ).getTime();
      const expectedDelay = expirationDate - NOW;

      const refreshError = new Error('Refresh error');
      refreshSpy.mockRejectedValue(refreshError);

      await jest.advanceTimersByTimeAsync(expectedDelay);
      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });

      await jest.advanceTimersByTimeAsync(30000);
      expect(contentpassStates).toHaveLength(2);
      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });

      // after 6 retries the state should change to error
      await jest.advanceTimersByTimeAsync(120001);
      expect(reportErrorSpy).toHaveBeenCalledTimes(1);
      expect(reportErrorSpy).toHaveBeenCalledWith(refreshError, {
        msg: 'Failed to refresh token after 6 retries',
      });
      expect(contentpassStates).toHaveLength(3);
      expect(contentpassStates[2]).toEqual({
        state: 'UNAUTHENTICATED',
        hasValidSubscription: false,
      });
    });
  });

  describe('registerObserver', () => {
    it('should call the observer with the current state', () => {
      const observer = jest.fn();
      contentpass.registerObserver(observer);

      expect(observer).toHaveBeenCalledWith({
        state: 'UNAUTHENTICATED',
        hasValidSubscription: false,
      });
    });

    it('should call the observer with the new state when the state changes', async () => {
      const observer = jest.fn();
      contentpass.registerObserver(observer);

      await contentpass.authenticate();

      expect(observer).toHaveBeenLastCalledWith({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });
    });

    it('should not add the same observer twice', () => {
      const observer = jest.fn();
      contentpass.registerObserver(observer);
      contentpass.registerObserver(observer);

      expect(observer).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterObserver', () => {
    it('should remove the observer', () => {
      const observer = jest.fn();
      contentpass.registerObserver(observer);
      expect(observer).toHaveBeenCalledTimes(1);

      contentpass.unregisterObserver(observer);

      contentpass.authenticate();

      expect(observer).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should clear the auth state and change the state', async () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      await contentpass.authenticate();

      expect(contentpassStates[1]).toEqual({
        state: 'AUTHENTICATED',
        hasValidSubscription: true,
      });

      await contentpass.logout();

      expect(oidcAuthStorageMock.clearOidcAuthState).toHaveBeenCalled();
      expect(contentpassStates).toHaveLength(3);
      expect(contentpassStates[2]).toEqual({
        state: 'UNAUTHENTICATED',
        hasValidSubscription: false,
      });
    });
  });

  describe('recoverFromError', () => {
    it('should change the state to INITIALISING and call initialiseAuthState', async () => {
      const contentpassStates: ContentpassState[] = [];
      contentpass.registerObserver((state) => {
        contentpassStates.push(state);
      });

      const error = new Error('Authorize error');
      authorizeSpy.mockRejectedValue(error);

      await expect(async () => {
        await contentpass.authenticate();
      }).rejects.toThrow(error);
      expect(contentpassStates[1]).toEqual({
        state: 'ERROR',
        error,
      });

      await contentpass.recoverFromError();

      expect(contentpassStates).toHaveLength(4);
      expect(contentpassStates[2]).toEqual({
        state: 'INITIALISING',
      });
      expect(contentpassStates[3]).toEqual({
        state: 'UNAUTHENTICATED',
        hasValidSubscription: false,
      });
    });
  });

  describe('countImpression', () => {
    it('should count paid impression if user has valid subscription and access token', async () => {
      await contentpass.authenticate();

      await contentpass.countImpression();

      expect(sendPageViewEventSpy).toHaveBeenCalledWith(config.apiUrl, {
        propertyId: config.propertyId,
        impressionId: expect.any(String),
        accessToken: EXAMPLE_AUTH_RESULT.accessToken,
      });
      expect(sendStatsSpy).toHaveBeenCalled();
    });

    it('should not count paid impression if user is authenticated, but does not have valid subscription', async () => {
      fetchContentpassTokenSpy.mockResolvedValue(
        CONTENTPASS_TOKEN_WITHOUT_PLANS
      );
      await contentpass.authenticate();

      await contentpass.countImpression();

      expect(sendPageViewEventSpy).not.toHaveBeenCalled();
      expect(sendStatsSpy).toHaveBeenCalled();
    });

    it('should report error if counting paid impression fails', async () => {
      await contentpass.authenticate();

      const error = new Error('Send page view event error');
      sendPageViewEventSpy.mockRejectedValue(error);

      await contentpass.countImpression();

      expect(reportErrorSpy).toHaveBeenCalledWith(error, {
        msg: 'Failed to count paid impression',
      });
      expect(sendStatsSpy).toHaveBeenCalled();
    });

    it('should count sampled impression even if user does not have valid subscription', async () => {
      await contentpass.countImpression();

      expect(sendPageViewEventSpy).not.toHaveBeenCalled();
      expect(sendStatsSpy).toHaveBeenCalledWith(config.apiUrl, {
        cpabid: expect.any(String),
        cppid: '5803179c',
        cpsr: config.samplingRate,
        ea: 'load',
        ec: 'tcf-sampled',
      });
    });

    it('should report error if counting sampled impression fails', async () => {
      const error = new Error('Send stats error');
      sendStatsSpy.mockRejectedValue(error);

      await contentpass.countImpression();

      expect(reportErrorSpy).toHaveBeenCalledWith(error, {
        msg: 'Failed to count sampled impression',
      });
    });

    it('should not send sampled impression when generatedSample is higher than samplingRate', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      contentpass = new Contentpass({ ...config, samplingRate: 0.4 });

      await contentpass.countImpression();
      expect(sendStatsSpy).not.toHaveBeenCalled();
      expect(sendPageViewEventSpy).not.toHaveBeenCalled();
    });
  });
});
