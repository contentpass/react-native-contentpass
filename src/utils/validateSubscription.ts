import parseContentpassToken from './parseContentpassToken';

export default function validateSubscription(contentpassToken: string) {
  const { body } = parseContentpassToken(contentpassToken);

  return !!body.auth && !!body.plans.length;
}
