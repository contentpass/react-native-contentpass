import type OTPublishersNativeSDK from 'react-native-onetrust-cmp';
import { OTConsentInteraction, OTEventName } from 'react-native-onetrust-cmp';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import type { BannerData, PreferenceCenterData } from './types';
import { getTcfPurposes } from './purposes';

export async function createOnetrustCmpAdapter(
  sdk: OTPublishersNativeSDK
): Promise<OnetrustCmpAdapter> {
  try {
    const bannerData = await sdk.getBannerData();
    console.log('Banner data', bannerData);

    const preferenceCenterData: PreferenceCenterData =
      await sdk.getPreferenceCenterData();
    console.log('Preference center data', preferenceCenterData);

    return new OnetrustCmpAdapter(sdk, bannerData, preferenceCenterData);
  } catch (error: any) {
    console.error('Error getting banner or preference center data', error);
    throw error;
  }
}

export default class OnetrustCmpAdapter implements CmpAdapter {
  private readonly groupIds: string[] = [];
  private readonly numVendors: number = 0;
  private readonly tcfPurposes: string[] = [];
  private readonly eventListeners = new Set<
    (eventName: OTEventName, data?: any) => void
  >();
  private readonly eventSubscriptions: Array<{ remove: () => void }> = [];
  private readonly consentStatusChangeListeners = new Set<
    (fullConsent: boolean) => void
  >();

  constructor(
    private readonly sdk: OTPublishersNativeSDK,
    bannerData: BannerData,
    preferenceCenterData: PreferenceCenterData
  ) {
    this.groupIds = preferenceCenterData.purposes
      .map(({ groupId }) => groupId)
      .filter(Boolean);
    this.numVendors = OnetrustCmpAdapter.getNumVendors(
      bannerData.bannerUIData?.summary?.description?.text ?? ''
    );
    this.tcfPurposes = getTcfPurposes(preferenceCenterData.purposes);
    this.initializeEventBridge();
  }

  private static getNumVendors(description: string): number {
    const match = description.match(/[0-9]+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async waitForInit(): Promise<void> {
    return Promise.resolve();
  }

  async acceptAll(): Promise<void> {
    console.debug('[OnetrustCmpAdapter::acceptAll]');
    await this.sdk.saveConsent(OTConsentInteraction.bannerAllowAll);
    const hasFullConsent = await this.hasFullConsent();
    this.emitConsentStatusChange(hasFullConsent);
  }

  async denyAll(): Promise<void> {
    console.debug('[OnetrustCmpAdapter::denyAll]');
    await this.sdk.saveConsent(OTConsentInteraction.bannerRejectAll);
    const hasFullConsent = await this.hasFullConsent();
    this.emitConsentStatusChange(hasFullConsent);
  }

  getNumberOfVendors(): Promise<number> {
    return Promise.resolve(this.numVendors);
  }

  getRequiredPurposes(): Promise<string[]> {
    return Promise.resolve(this.tcfPurposes);
  }

  showSecondLayer(view: 'vendor' | 'purpose'): Promise<void> {
    console.debug('[OnetrustCmpAdapter::showSecondLayer]', view);
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
            remove();
            resolve();
            break;
          default:
            break;
        }
      });

      if (view === 'vendor') {
        this.sdk.showPreferenceCenterUI();
      } else {
        this.sdk.showConsentPurposesUI();
      }
    });
  }

  // FIXME handle reconsent scenarios
  hasFullConsent = async (): Promise<boolean> => {
    console.debug('[OnetrustCmpAdapter::hasFullConsent]');
    const consentStatuses = await Promise.all(
      this.groupIds.map((groupId) =>
        this.sdk.getConsentStatusForCategory(groupId)
      )
    );

    return consentStatuses.every(
      (consentStatus: number) => consentStatus === 1
    );
  };

  onConsentStatusChange(callback: (fullConsent: boolean) => void): () => void {
    this.consentStatusChangeListeners.add(callback);
    setTimeout(() => {
      this.hasFullConsent().then((fullConsent) =>
        this.emitConsentStatusChangeEventSingle(fullConsent, callback)
      );
    }, 0);
    return () => this.consentStatusChangeListeners.delete(callback);
  }

  onEvent(callback: (eventName: OTEventName, data?: any) => void): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
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
  }

  private emitEvent(eventName: OTEventName, data?: any): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(eventName, data);
      } catch (error) {
        console.error('[OnetrustCmpAdapter::onEvent] listener failed', error);
      }
    });
  }

  private emitConsentStatusChange(fullConsent: boolean): void {
    this.consentStatusChangeListeners.forEach((listener) =>
      this.emitConsentStatusChangeEventSingle(fullConsent, listener)
    );
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
