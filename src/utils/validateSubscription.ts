import parseContentpassToken from './parseContentpassToken';
import { reportError } from '../sentryIntegration';

export default function validateSubscription(contentpassToken: string) {
  try {
    const { body } = parseContentpassToken(contentpassToken);
    return !!body.auth && !!body.plans.length;
  } catch (err: any) {
    reportError(err, { msg: 'Failed to validate subscription' });
    return false;
  }
}
