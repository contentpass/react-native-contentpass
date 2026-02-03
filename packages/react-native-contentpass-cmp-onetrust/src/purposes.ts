import type { Purpose } from './types';

const TYPE_MAP = {
  IAB2_PURPOSE: {
    groupIdPrefix: 'IABV2_',
    resultPrefix: '',
  },
  IAB2V2_PURPOSE: {
    groupIdPrefix: 'IAB2V2_',
    resultPrefix: '',
  },
  IAB2_SPL_PURPOSE: {
    groupIdPrefix: 'ISPV2_',
    resultPrefix: 's',
  },
  IAB2V2_SPL_PURPOSE: {
    groupIdPrefix: 'ISP2V2_',
    resultPrefix: 's',
  },
  IAB2_FEATURE: {
    groupIdPrefix: 'IFEV2_',
    resultPrefix: 'f',
  },
  IAB2V2_FEATURE: {
    groupIdPrefix: 'IFE2V2_',
    resultPrefix: 'f',
  },
  IAB2_SPL_FEATURE: {
    groupIdPrefix: 'ISFV2_',
    resultPrefix: 'sf',
  },
  IAB2V2_SPL_FEATURE: {
    groupIdPrefix: 'ISF2V2_',
    resultPrefix: 'sf',
  },
};

export function getTcfPurposes(purposes: Purpose[]): string[] {
  const results: string[] = [];

  const visit = (purpose: Purpose) => {
    const mapped = TYPE_MAP[purpose.type as keyof typeof TYPE_MAP];
    if (mapped && purpose.groupId?.startsWith(mapped.groupIdPrefix)) {
      const key = purpose.groupId.substring(mapped.groupIdPrefix.length);
      if (key) {
        results.push(`${mapped.resultPrefix}${key}`);
      }
    }

    if (purpose.children?.length) {
      purpose.children.forEach(visit);
    }
  };

  purposes.forEach(visit);

  return results;
}
