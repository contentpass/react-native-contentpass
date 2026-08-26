import packageJson from '../../package.json';

const THEME = 'classic-app';

const SDK_VERSION = `react-native-contentpass-ui@${packageJson.version}`;

export default function buildFirstLayerUrl({
  baseUrl,
  propertyId,
  planId,
  purposesList,
  vendorCount,
  locale,
  cacheNonce,
}: {
  baseUrl: string;
  propertyId: string;
  planId: string;
  purposesList: string[];
  vendorCount: number;
  locale?: string;
  cacheNonce?: string;
}): string {
  // FIXME handle trailing slash in baseUrl
  const url = new URL(`${baseUrl}/first-layer/`);
  url.searchParams.set('start', 'true');
  url.searchParams.set('theme', THEME);
  // Unknown start-query keys 400 the first-layer entrypoint, so the per-mount
  // cache nonce has to ride on the already-allowed `v` param.
  url.searchParams.set(
    'v',
    cacheNonce ? `${SDK_VERSION}.${cacheNonce}` : SDK_VERSION
  );
  if (locale) {
    url.searchParams.set('locale', locale);
  }
  url.searchParams.set('planId', planId);
  url.searchParams.set('propertyId', propertyId);
  url.searchParams.set('purposesList', purposesList.join(','));
  url.searchParams.set('vendorCount', vendorCount.toString());
  // url.searchParams.set('config', 'undefined');
  // FIXME why is it not able to handle the start=true parameter?
  const firstLayerUrl = url.toString().replace('?start=true', '?start');

  return firstLayerUrl;
}
