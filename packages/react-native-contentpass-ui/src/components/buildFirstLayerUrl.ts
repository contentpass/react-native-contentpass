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
}: {
  baseUrl: string;
  propertyId: string;
  planId: string;
  purposesList: string[];
  vendorCount: number;
  locale?: string;
}): string {
  // FIXME handle trailing slash in baseUrl
  const url = new URL(`${baseUrl}/first-layer/`);
  url.searchParams.set('start', 'true');
  url.searchParams.set('theme', THEME);
  url.searchParams.set('v', SDK_VERSION);
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
