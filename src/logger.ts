import { consoleTransport, logger } from 'react-native-logs';
import type { Severity } from './types/ContentpassConfig';

const log = logger.createLogger({
  // by default loggger is disabled
  enabled: false,
  transport: consoleTransport,
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
  },
});

export const enableLogger = (severity: Severity) => {
  log.setSeverity(severity);
  log.enable();

  log.debug('Logger enabled with severity', severity);
};

export default log;
