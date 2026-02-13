import type { Purpose } from './types';
import { getTcfPurposes } from './purposes';

const makePurpose = (
  overrides: Partial<Purpose> & Pick<Purpose, 'type' | 'groupId'>
): Purpose => ({
  purposeId: '',
  descriptionLegal: '',
  legIntStatus: 0,
  vendorsLinkedInfo: '',
  parent: '',
  consentStatus: 0,
  firstPartyCookies: [],
  iabIllustrations: [],
  showSDKListLink: false,
  generalVendorsIds: [],
  groupDescription: '',
  children: [],
  groupName: '',
  isIabPurpose: true,
  consentToggleStatus: 0,
  ...overrides,
});

describe('getTcfPurposes', () => {
  it('should return an empty array when given no purposes', () => {
    expect(getTcfPurposes([])).toEqual([]);
  });

  // --- IAB2_PURPOSE ---

  it('should extract key from IAB2_PURPOSE with IABV2_ prefix', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_1' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['1']);
  });

  it('should not add a resultPrefix for IAB2_PURPOSE', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_42' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['42']);
  });

  // --- IAB2V2_PURPOSE ---

  it('should extract key from IAB2V2_PURPOSE with IAB2V2_ prefix', () => {
    const purposes = [
      makePurpose({ type: 'IAB2V2_PURPOSE', groupId: 'IAB2V2_3' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['3']);
  });

  // --- IAB2_SPL_PURPOSE ---

  it('should prefix result with "s" for IAB2_SPL_PURPOSE', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_SPL_PURPOSE', groupId: 'ISPV2_5' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['s5']);
  });

  // --- IAB2V2_SPL_PURPOSE ---

  it('should prefix result with "s" for IAB2V2_SPL_PURPOSE', () => {
    const purposes = [
      makePurpose({ type: 'IAB2V2_SPL_PURPOSE', groupId: 'ISP2V2_7' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['s7']);
  });

  // --- IAB2_FEATURE ---

  it('should prefix result with "f" for IAB2_FEATURE', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_FEATURE', groupId: 'IFEV2_2' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['f2']);
  });

  // --- IAB2V2_FEATURE ---

  it('should prefix result with "f" for IAB2V2_FEATURE', () => {
    const purposes = [
      makePurpose({ type: 'IAB2V2_FEATURE', groupId: 'IFE2V2_9' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['f9']);
  });

  // --- IAB2_SPL_FEATURE ---

  it('should prefix result with "sf" for IAB2_SPL_FEATURE', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_SPL_FEATURE', groupId: 'ISFV2_4' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['sf4']);
  });

  // --- IAB2V2_SPL_FEATURE ---

  it('should prefix result with "sf" for IAB2V2_SPL_FEATURE', () => {
    const purposes = [
      makePurpose({ type: 'IAB2V2_SPL_FEATURE', groupId: 'ISF2V2_6' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['sf6']);
  });

  // --- filtering & edge cases ---

  it('should ignore purposes with an unknown type', () => {
    const purposes = [
      makePurpose({ type: 'UNKNOWN_TYPE', groupId: 'IABV2_1' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual([]);
  });

  it('should ignore purposes whose groupId does not start with the expected prefix', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_PURPOSE', groupId: 'WRONG_1' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual([]);
  });

  it('should ignore purposes where groupId equals the prefix exactly (empty key)', () => {
    const purposes = [makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_' })];

    expect(getTcfPurposes(purposes)).toEqual([]);
  });

  it('should ignore purposes with an undefined groupId', () => {
    const purposes = [
      makePurpose({
        type: 'IAB2_PURPOSE',
        groupId: undefined as unknown as string,
      }),
    ];

    expect(getTcfPurposes(purposes)).toEqual([]);
  });

  // --- multiple purposes ---

  it('should collect results from multiple top-level purposes', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_1' }),
      makePurpose({ type: 'IAB2_FEATURE', groupId: 'IFEV2_2' }),
      makePurpose({ type: 'IAB2_SPL_PURPOSE', groupId: 'ISPV2_3' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['1', 'f2', 's3']);
  });

  it('should skip non-matching purposes while collecting matching ones', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_1' }),
      makePurpose({ type: 'UNKNOWN_TYPE', groupId: 'IABV2_99' }),
      makePurpose({ type: 'IAB2_FEATURE', groupId: 'IFEV2_2' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['1', 'f2']);
  });

  // --- nested children ---

  it('should recursively visit children and collect their results', () => {
    const purposes = [
      makePurpose({
        type: 'IAB2_PURPOSE',
        groupId: 'IABV2_1',
        children: [
          makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_2' }),
          makePurpose({ type: 'IAB2_FEATURE', groupId: 'IFEV2_3' }),
        ],
      }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['1', '2', 'f3']);
  });

  it('should handle deeply nested children', () => {
    const purposes = [
      makePurpose({
        type: 'IAB2_PURPOSE',
        groupId: 'IABV2_1',
        children: [
          makePurpose({
            type: 'IAB2_PURPOSE',
            groupId: 'IABV2_2',
            children: [
              makePurpose({ type: 'IAB2_SPL_FEATURE', groupId: 'ISFV2_10' }),
            ],
          }),
        ],
      }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['1', '2', 'sf10']);
  });

  it('should collect children even when the parent does not match', () => {
    const purposes = [
      makePurpose({
        type: 'UNKNOWN_TYPE',
        groupId: 'WHATEVER',
        children: [makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_5' })],
      }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['5']);
  });

  it('should handle children being an empty array', () => {
    const purposes = [
      makePurpose({
        type: 'IAB2_PURPOSE',
        groupId: 'IABV2_1',
        children: [],
      }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['1']);
  });

  // --- groupId key extraction ---

  it('should preserve multi-character keys after the prefix', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_123' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['123']);
  });

  it('should preserve non-numeric keys after the prefix', () => {
    const purposes = [
      makePurpose({ type: 'IAB2_PURPOSE', groupId: 'IABV2_abc' }),
    ];

    expect(getTcfPurposes(purposes)).toEqual(['abc']);
  });
});
