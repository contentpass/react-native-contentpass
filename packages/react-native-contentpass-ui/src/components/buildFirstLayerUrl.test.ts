import buildFirstLayerUrl from './buildFirstLayerUrl';

describe('buildFirstLayerUrl', () => {
  const defaultParams = {
    baseUrl: 'https://example.com',
    propertyId: 'prop-123',
    planId: 'plan-456',
    purposesList: ['analytics', 'marketing'],
    vendorCount: 5,
  };

  it('should build a URL with the correct base path', () => {
    const url = buildFirstLayerUrl(defaultParams);

    expect(url).toContain('https://example.com/first-layer/');
  });

  it('should include the start parameter without =true', () => {
    const url = buildFirstLayerUrl(defaultParams);

    expect(url).toContain('?start&');
    expect(url).not.toContain('start=true');
  });

  it('should include the theme parameter', () => {
    const url = buildFirstLayerUrl(defaultParams);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('theme')).toBe('steps');
  });

  it('should include the SDK version parameter', () => {
    const url = buildFirstLayerUrl(defaultParams);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('v')).toBeTruthy();
  });

  it('should set locale to en-US', () => {
    const url = buildFirstLayerUrl(defaultParams);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('locale')).toBe('en-US');
  });

  it('should include the planId parameter', () => {
    const url = buildFirstLayerUrl(defaultParams);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('planId')).toBe('plan-456');
  });

  it('should include the propertyId parameter', () => {
    const url = buildFirstLayerUrl(defaultParams);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('propertyId')).toBe('prop-123');
  });

  it('should include the vendorCount as a string', () => {
    const url = buildFirstLayerUrl(defaultParams);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('vendorCount')).toBe('5');
  });

  it('should encode and join purposesList with commas', () => {
    const url = buildFirstLayerUrl(defaultParams);
    const parsed = new URL(url);
    const purposesList = parsed.searchParams.get('purposesList');

    // The value is double-encoded: encodeURIComponent is called before set()
    expect(purposesList).toBe(encodeURIComponent('analytics,marketing'));
  });

  it('should handle a single purpose in the list', () => {
    const url = buildFirstLayerUrl({
      ...defaultParams,
      purposesList: ['analytics'],
    });
    const parsed = new URL(url);

    expect(parsed.searchParams.get('purposesList')).toBe(
      encodeURIComponent('analytics')
    );
  });

  it('should handle an empty purposes list', () => {
    const url = buildFirstLayerUrl({
      ...defaultParams,
      purposesList: [],
    });
    const parsed = new URL(url);

    expect(parsed.searchParams.get('purposesList')).toBe(
      encodeURIComponent('')
    );
  });

  it('should handle vendorCount of 0', () => {
    const url = buildFirstLayerUrl({
      ...defaultParams,
      vendorCount: 0,
    });
    const parsed = new URL(url);

    expect(parsed.searchParams.get('vendorCount')).toBe('0');
  });

  it('should handle a baseUrl with a trailing path', () => {
    const url = buildFirstLayerUrl({
      ...defaultParams,
      baseUrl: 'https://cdn.example.com/consent',
    });

    expect(url).toContain('https://cdn.example.com/consent/first-layer/');
  });
});
