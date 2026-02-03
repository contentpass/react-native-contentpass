// const THEME = 'classic';
// const THEME = 'classic-app';
const THEME = 'steps';

// FIXME pass something from this SDK?
const SDK_VERSION = '20260203105802-ef26e7d899';

export default function buildFirstLayerUrl({
  baseUrl,
  propertyId,
  planId,
  purposesList,
  vendorCount,
}: {
  baseUrl: string;
  propertyId: string;
  planId: string;
  purposesList: string[];
  vendorCount: number;
}): string {
  // FIXME handle trailing slash in baseUrl
  const url = new URL(`${baseUrl}/first-layer/`);
  url.searchParams.set('start', 'true');
  url.searchParams.set('theme', THEME);
  url.searchParams.set('v', SDK_VERSION);
  url.searchParams.set('locale', 'en-US');
  url.searchParams.set('planId', planId);
  url.searchParams.set('propertyId', propertyId);
  url.searchParams.set(
    'purposesList',
    encodeURIComponent(purposesList.join(','))
  );
  url.searchParams.set('vendorCount', vendorCount.toString());
  // url.searchParams.set('config', 'undefined');
  // FIXME why is it not able to handle the start=true parameter?
  const firstLayerUrl = url.toString().replace('?start=true', '?start');

  return firstLayerUrl;
}
