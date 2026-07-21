import type OTPublishersNativeSDK from 'react-native-onetrust-cmp';
import { OTConsentInteraction, OTEventName } from 'react-native-onetrust-cmp';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import type { BannerData, PreferenceCenterData } from './types';
import { getTcfPurposes } from './purposes';

const CONSENT_CHANGE_EVENTS = new Set<OTEventName>([
  OTEventName.preferenceCenterAcceptAll,
  OTEventName.preferenceCenterRejectAll,
  OTEventName.preferenceCenterConfirmChoices,
  OTEventName.vendorConfirmChoices,
]);

const CONSENT_STATUS_REFRESH_DELAYS_MS = [100, 500, 1000];
const BANNER_SETTLEMENT_TIMEOUT_MS = 10_000;

export type OnetrustCmpAdapterOptions = {
  /**
   * OneTrust group IDs whose state is controlled by App Tracking Transparency.
   *
   * These groups are still logged, but do not determine whether Contentpass can
   * dismiss its consent layer. Apple can keep an ATT-linked group disabled even
   * after a user accepts all CMP purposes.
   */
  attGroupIds?: string[];
};

type ConsentStatus = {
  groupId: string;
  status: number;
  isAttGroup: boolean;
};

type ConsentState = {
  shouldShowBanner: boolean;
  consentStatuses: ConsentStatus[];
};

type FullConsentDecision = {
  fullConsent: boolean;
  bannerSettlementActive: boolean;
  bannerAcknowledgedUntil: number | null;
};

export async function createOnetrustCmpAdapter(
  sdk: OTPublishersNativeSDK,
  options: OnetrustCmpAdapterOptions = {}
): Promise<OnetrustCmpAdapter> {
  console.debug('[OnetrustCmpAdapter::create] fetching CMP API data');

  try {
    await sdk.fetchPreferencesCmpApiData();

    const bannerData = await sdk.getBannerData();
    const preferenceCenterData: PreferenceCenterData | null =
      await sdk.getPreferenceCenterData();

    if (!Array.isArray(preferenceCenterData?.purposes)) {
      throw new Error(
        'OneTrust returned no preference center data after fetching CMP API data'
      );
    }

    console.debug('[OnetrustCmpAdapter::create] CMP API data fetched', {
      purposeCount: preferenceCenterData?.purposes?.length ?? 0,
      shouldResetLocalState:
        preferenceCenterData?.appConfig?.shouldResetLocalState,
      templateChanged: preferenceCenterData?.appConfig?.templateChanged,
      showBanner: preferenceCenterData?.appConfig?.showBanner,
      bannerReason: preferenceCenterData?.appConfig?.bannerReason,
      bannerReasonCode: preferenceCenterData?.appConfig?.bannerReasonCode,
    });

    return new OnetrustCmpAdapter(
      sdk,
      bannerData,
      preferenceCenterData,
      options
    );
  } catch (error: any) {
    console.error('[OnetrustCmpAdapter::create] failed', error);
    throw error;
  }
}

export default class OnetrustCmpAdapter implements CmpAdapter {
  private readonly groupIds: string[];
  private readonly attGroupIds: ReadonlySet<string>;
  private readonly numVendors: number;
  private readonly tcfPurposes: string[];
  private readonly eventListeners = new Set<
    (eventName: OTEventName, data?: any) => void
  >();
  private readonly eventSubscriptions: Array<{ remove: () => void }> = [];
  private readonly consentStatusChangeListeners = new Set<
    (fullConsent: boolean) => void
  >();
  private consentStatusRevision = 0;
  private bannerAcknowledgedUntil = 0;

  constructor(
    private readonly sdk: OTPublishersNativeSDK,
    bannerData: BannerData,
    preferenceCenterData: PreferenceCenterData,
    options: OnetrustCmpAdapterOptions = {}
  ) {
    this.groupIds = preferenceCenterData.purposes
      .map(({ groupId }) => groupId)
      .filter(Boolean);
    this.attGroupIds = new Set(options.attGroupIds ?? []);
    this.numVendors = OnetrustCmpAdapter.getNumVendors(
      bannerData.bannerUIData?.summary?.description?.text ?? ''
    );
    this.tcfPurposes = getTcfPurposes(preferenceCenterData.purposes);

    const unknownAttGroupIds = [...this.attGroupIds].filter(
      (groupId) => !this.groupIds.includes(groupId)
    );
    console.debug('[OnetrustCmpAdapter::constructor] configured', {
      groupIds: this.groupIds,
      attGroupIds: [...this.attGroupIds],
      unknownAttGroupIds,
      tcfPurposes: this.tcfPurposes,
      numVendors: this.numVendors,
    });
    if (unknownAttGroupIds.length > 0) {
      console.warn('[OnetrustCmpAdapter::constructor] unknown ATT group IDs', {
        unknownAttGroupIds,
      });
    }

    this.initializeEventBridge();
  }

  private static getNumVendors(description: string): number {
    const match = description.match(/[0-9]+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async waitForInit(): Promise<void> {
    console.debug('[OnetrustCmpAdapter::waitForInit] already initialized');
  }

  async acceptAll(): Promise<void> {
    const revision = this.beginConsentStatusOperation('acceptAll');
    console.debug('[OnetrustCmpAdapter::acceptAll] saving banner consent', {
      revision,
    });
    this.logConsentSnapshot('acceptAll: before saveConsent');

    try {
      await this.sdk.saveConsent(OTConsentInteraction.bannerAllowAll);
      console.debug('[OnetrustCmpAdapter::acceptAll] saveConsent resolved', {
        revision,
      });
      this.bannerAcknowledgedUntil = Date.now() + BANNER_SETTLEMENT_TIMEOUT_MS;
      this.logConsentSnapshot('acceptAll: after saveConsent');
      this.scheduleConsentStatusRefreshes(revision, 'acceptAll');
      await this.emitConsentStatusForRevision(revision, 'acceptAll');
    } catch (error) {
      console.error('[OnetrustCmpAdapter::acceptAll] saveConsent failed', {
        revision,
        error,
      });
      throw error;
    }
  }

  async denyAll(): Promise<void> {
    const revision = this.beginConsentStatusOperation('denyAll');
    console.debug('[OnetrustCmpAdapter::denyAll] saving banner consent', {
      revision,
    });
    this.logConsentSnapshot('denyAll: before saveConsent');

    try {
      await this.sdk.saveConsent(OTConsentInteraction.bannerRejectAll);
      console.debug('[OnetrustCmpAdapter::denyAll] saveConsent resolved', {
        revision,
      });
      this.bannerAcknowledgedUntil = 0;
      this.logConsentSnapshot('denyAll: after saveConsent');
      this.scheduleConsentStatusRefreshes(revision, 'denyAll');
      await this.emitConsentStatusForRevision(revision, 'denyAll');
    } catch (error) {
      console.error('[OnetrustCmpAdapter::denyAll] saveConsent failed', {
        revision,
        error,
      });
      throw error;
    }
  }

  getNumberOfVendors(): Promise<number> {
    console.debug('[OnetrustCmpAdapter::getNumberOfVendors]', {
      numVendors: this.numVendors,
    });
    return Promise.resolve(this.numVendors);
  }

  getRequiredPurposes(): Promise<string[]> {
    console.debug('[OnetrustCmpAdapter::getRequiredPurposes]', {
      tcfPurposes: this.tcfPurposes,
    });
    return Promise.resolve(this.tcfPurposes);
  }

  showSecondLayer(view: 'vendor' | 'purpose'): Promise<void> {
    console.debug('[OnetrustCmpAdapter::showSecondLayer] opening', { view });
    return new Promise<void>((resolve) => {
      const remove = this.onEvent((eventName: OTEventName, _?: any) => {
        switch (eventName) {
          case OTEventName.hidePreferenceCenter:
          case OTEventName.preferenceCenterAcceptAll:
          case OTEventName.preferenceCenterRejectAll:
          case OTEventName.preferenceCenterConfirmChoices:
          case OTEventName.hideVendorList:
          case OTEventName.vendorConfirmChoices:
          case OTEventName.allSDKViewsDismissed:
            console.debug('[OnetrustCmpAdapter::showSecondLayer] closed', {
              view,
              eventName,
            });
            remove();
            const revision = this.beginConsentStatusOperation(
              `showSecondLayer: closed:${eventName}`
            );
            this.logConsentSnapshot(`showSecondLayer: closed:${eventName}`);
            this.scheduleConsentStatusRefreshes(
              revision,
              `showSecondLayer: closed:${eventName}`
            );
            this.emitConsentStatusForRevision(
              revision,
              `showSecondLayer: closed:${eventName}`
            );
            resolve();
            break;
          default:
            break;
        }
      });

      this.sdk.showPreferenceCenterUI();
    });
  }

  hasFullConsent = async (): Promise<boolean> => {
    const consentState = await this.getConsentState();
    const consentDecision = this.getFullConsentDecision(consentState);

    console.debug('[OnetrustCmpAdapter::hasFullConsent]', {
      ...consentDecision,
      ...consentState,
    });

    return consentDecision.fullConsent;
  };

  onConsentStatusChange(callback: (fullConsent: boolean) => void): () => void {
    this.consentStatusChangeListeners.add(callback);
    console.debug('[OnetrustCmpAdapter::onConsentStatusChange] subscribed', {
      listenerCount: this.consentStatusChangeListeners.size,
    });

    setTimeout(() => {
      const revision = this.consentStatusRevision;
      console.debug(
        '[OnetrustCmpAdapter::onConsentStatusChange] initial status check',
        { revision }
      );
      this.emitConsentStatusForRevision(
        revision,
        'initial subscription',
        callback
      );
    }, 0);

    return () => {
      this.consentStatusChangeListeners.delete(callback);
      console.debug(
        '[OnetrustCmpAdapter::onConsentStatusChange] unsubscribed',
        {
          listenerCount: this.consentStatusChangeListeners.size,
        }
      );
    };
  }

  onEvent(callback: (eventName: OTEventName, data?: any) => void): () => void {
    this.eventListeners.add(callback);
    console.debug('[OnetrustCmpAdapter::onEvent] subscribed', {
      listenerCount: this.eventListeners.size,
    });
    return () => {
      this.eventListeners.delete(callback);
      console.debug('[OnetrustCmpAdapter::onEvent] unsubscribed', {
        listenerCount: this.eventListeners.size,
      });
    };
  }

  private initializeEventBridge(): void {
    (Object.values(OTEventName) as OTEventName[]).forEach((eventName) => {
      const subscription = this.sdk.addEventListener(
        eventName,
        (data?: any) => {
          this.emitEvent(eventName, data);
        }
      );
      this.eventSubscriptions.push(subscription);
    });
    console.debug('[OnetrustCmpAdapter::initializeEventBridge] ready', {
      subscriptionCount: this.eventSubscriptions.length,
    });
  }

  private emitEvent(eventName: OTEventName, data?: any): void {
    console.debug('[OnetrustCmpAdapter::onEvent] received', {
      eventName,
      data,
    });
    if (CONSENT_CHANGE_EVENTS.has(eventName)) {
      const revision = this.beginConsentStatusOperation(`event:${eventName}`);
      if (eventName === OTEventName.preferenceCenterAcceptAll) {
        this.bannerAcknowledgedUntil =
          Date.now() + BANNER_SETTLEMENT_TIMEOUT_MS;
        console.debug(
          '[OnetrustCmpAdapter::onEvent] started banner settlement',
          {
            eventName,
            bannerAcknowledgedUntil: this.bannerAcknowledgedUntil,
          }
        );
      }
      this.emitConsentStatusForRevision(revision, `event:${eventName}`);
    }

    this.eventListeners.forEach((listener) => {
      try {
        listener(eventName, data);
      } catch (error) {
        console.error('[OnetrustCmpAdapter::onEvent] listener failed', error);
      }
    });
  }

  private beginConsentStatusOperation(context: string): number {
    this.consentStatusRevision += 1;
    console.debug('[OnetrustCmpAdapter::consentStatusOperation] started', {
      context,
      revision: this.consentStatusRevision,
    });
    return this.consentStatusRevision;
  }

  private scheduleConsentStatusRefreshes(
    revision: number,
    context: string
  ): void {
    CONSENT_STATUS_REFRESH_DELAYS_MS.forEach((delay) => {
      setTimeout(() => {
        this.logConsentSnapshot(`${context}: +${delay}ms`);
        this.emitConsentStatusForRevision(revision, `${context}: +${delay}ms`);
      }, delay);
    });
  }

  private async emitConsentStatusForRevision(
    revision: number,
    context: string,
    listener?: (fullConsent: boolean) => void
  ): Promise<void> {
    try {
      const fullConsent = await this.hasFullConsent();
      if (revision !== this.consentStatusRevision) {
        console.debug(
          '[OnetrustCmpAdapter::emitConsentStatus] ignored stale status',
          {
            context,
            revision,
            currentRevision: this.consentStatusRevision,
            fullConsent,
          }
        );
        return;
      }

      if (listener) {
        if (!this.consentStatusChangeListeners.has(listener)) {
          console.debug(
            '[OnetrustCmpAdapter::emitConsentStatus] listener unsubscribed before initial status',
            { context, revision }
          );
          return;
        }
        this.emitConsentStatusChangeEventSingle(fullConsent, listener);
        return;
      }

      this.emitConsentStatusChange(fullConsent, context, revision);
    } catch (error) {
      console.error('[OnetrustCmpAdapter::emitConsentStatus] failed', {
        context,
        revision,
        error,
      });
    }
  }

  private emitConsentStatusChange(
    fullConsent: boolean,
    context: string,
    revision: number
  ): void {
    console.debug('[OnetrustCmpAdapter::emitConsentStatusChange]', {
      context,
      revision,
      fullConsent,
      listenerCount: this.consentStatusChangeListeners.size,
    });
    this.consentStatusChangeListeners.forEach((listener) =>
      this.emitConsentStatusChangeEventSingle(fullConsent, listener)
    );
  }

  private async getConsentState(): Promise<ConsentState> {
    const [shouldShowBanner, statuses] = await Promise.all([
      this.sdk.shouldShowBanner(),
      Promise.all(
        this.groupIds.map((groupId) =>
          this.sdk.getConsentStatusForCategory(groupId).then((status) => ({
            groupId,
            status,
            isAttGroup: this.attGroupIds.has(groupId),
          }))
        )
      ),
    ]);

    return { shouldShowBanner, consentStatuses: statuses };
  }

  private getFullConsentDecision({
    shouldShowBanner,
    consentStatuses,
  }: ConsentState): FullConsentDecision {
    const now = Date.now();
    if (
      !shouldShowBanner ||
      (this.bannerAcknowledgedUntil > 0 && now >= this.bannerAcknowledgedUntil)
    ) {
      this.bannerAcknowledgedUntil = 0;
    }

    const bannerSettlementActive = this.bannerAcknowledgedUntil > 0;
    const fullConsent =
      (!shouldShowBanner || bannerSettlementActive) &&
      consentStatuses
        .filter(({ isAttGroup }) => !isAttGroup)
        .every(({ status }) => status === 1);

    return {
      fullConsent,
      bannerSettlementActive,
      bannerAcknowledgedUntil: this.bannerAcknowledgedUntil || null,
    };
  }

  private async logConsentSnapshot(context: string): Promise<void> {
    try {
      const [consentState, attStatus] = await Promise.all([
        this.getConsentState(),
        this.getAttStatus(),
      ]);
      const consentDecision = this.getFullConsentDecision(consentState);
      console.debug('[OnetrustCmpAdapter::consentSnapshot]', {
        context,
        timestamp: new Date().toISOString(),
        ...consentDecision,
        attStatus,
        ...consentState,
      });
    } catch (error) {
      console.error('[OnetrustCmpAdapter::consentSnapshot] failed', {
        context,
        error,
      });
    }
  }

  private async getAttStatus(): Promise<string> {
    if (!this.sdk.getATTStatus) {
      return 'not exposed by react-native-onetrust-cmp';
    }

    try {
      return String(await this.sdk.getATTStatus());
    } catch (error) {
      console.error('[OnetrustCmpAdapter::getAttStatus] failed', error);
      return 'failed to read';
    }
  }

  private emitConsentStatusChangeEventSingle(
    fullConsent: boolean,
    listener: (fullConsent: boolean) => void
  ): void {
    try {
      listener(fullConsent);
    } catch (error) {
      console.error(
        '[OnetrustCmpAdapter::emitConsentStatusChangeEventSingle] listener failed',
        error
      );
    }
  }
}
