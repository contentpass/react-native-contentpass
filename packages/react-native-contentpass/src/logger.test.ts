import log, { enableLogger } from './logger';
import type { Severity } from './types/ContentpassConfig';
import { logger } from 'react-native-logs';

jest.mock('react-native-logs', () => {
  return {
    consoleTransport: jest.fn(),
    logger: {
      createLogger: jest.fn().mockReturnValue({
        setSeverity: jest.fn(),
        enable: jest.fn(),
        debug: jest.fn(),
      }),
    },
  };
});

describe('Logger', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should create a disabled logger', () => {
    expect(logger.createLogger).toHaveBeenCalledWith({
      enabled: false,
      transport: expect.any(Function),
      transportOptions: expect.any(Object),
    });
  });

  it('should enable the logger with the correct severity', () => {
    const severity: Severity = 'info';
    const setSeveritySpy = jest.spyOn(log, 'setSeverity');
    const enableSpy = jest.spyOn(log, 'enable');
    const debugSpy = jest.spyOn(log, 'debug');

    enableLogger(severity);

    expect(setSeveritySpy).toHaveBeenCalledWith(severity);
    expect(enableSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalledWith(
      'Logger enabled with severity',
      severity
    );
  });
});
