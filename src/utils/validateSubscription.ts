import parseContentpassToken from './parseContentpassToken';

export default function validateSubscription(contentpassToken: string) {
  try {
    const { body } = parseContentpassToken(contentpassToken);
    return !!body.auth && !!body.plans.length;
  } catch (err) {
    // FIXME: logger for error
    return false;
  }
}
