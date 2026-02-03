/* istanbul ignore file */

export type Severity = 'debug' | 'info' | 'warn' | 'error';

export type ContentpassConfig = {
  propertyId: string;
  planId: string;
  redirectUrl: string;
  issuer: string;
  apiUrl: string;
  samplingRate?: number;
  logLevel?: Severity;
};
