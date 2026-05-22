import type { CmSdkReactNativeV3Module } from 'cm-sdk-react-native-v3';
import {
  addConsentListener,
  addCloseConsentLayerListener,
} from 'cm-sdk-react-native-v3';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

const GRANTED_STATUS = 'granted';

export async function createConsentmanagerCmpAdapter(
  sdk: CmSdkReactNativeV3Module
): Promise<ConsentmanagerCmpAdapter> {
  return new ConsentmanagerCmpAdapter(sdk);
}

export default class ConsentmanagerCmpAdapter implements CmpAdapter {
  private readonly eventSubscriptions: Array<{ remove: () => void }> = [];
  private readonly consentStatusChangeListeners = new Set<
    (fullConsent: boolean) => void
  >();
  constructor(private readonly sdk: CmSdkReactNativeV3Module) {
    this.initializeEventBridge();
  }

  waitForInit(): Promise<void> {
    return Promise.resolve();
  }

  async acceptAll(): Promise<void> {
    console.debug('[ConsentmanagerCmpAdapter::acceptAll]');
    await this.sdk.acceptAll();
    const fullConsent = await this.hasFullConsent();
    this.emitConsentStatusChange(fullConsent);
  }

  async denyAll(): Promise<void> {
    console.debug('[ConsentmanagerCmpAdapter::denyAll]');
    await this.sdk.rejectAll();
    const fullConsent = await this.hasFullConsent();
    this.emitConsentStatusChange(fullConsent);
  }

  async getNumberOfVendors(): Promise<number> {
    const userStatus = await this.sdk.getUserStatus();
    return Object.keys(userStatus.vendors ?? {}).length;
  }

  async getRequiredPurposes(): Promise<string[]> {
    const userStatus = await this.sdk.getUserStatus();
    return Object.keys(userStatus.purposes ?? {}).filter(
      (purpose) => !purpose.startsWith('r')
    );
  }

  showSecondLayer(_view: 'vendor' | 'purpose'): Promise<void> {
    console.debug('[ConsentmanagerCmpAdapter::showSecondLayer]', _view);
    return new Promise<void>((resolve) => {
      const subscription = addCloseConsentLayerListener(() => {
        subscription.remove();
        this.hasFullConsent().then((fullConsent) => {
          this.emitConsentStatusChange(fullConsent);
          resolve();
        });
      });

      this.sdk.forceOpen(true);
    });
  }

  hasFullConsent = async (): Promise<boolean> => {
    console.debug('[ConsentmanagerCmpAdapter::hasFullConsent]');
    const userStatus = await this.sdk.getUserStatus();
    const purposes = userStatus.purposes ?? {};
    const purposeIds = Object.keys(purposes);
    if (purposeIds.length === 0) {
      return false;
    }

    return Object.values(purposes).every(
      (status: string) => status === GRANTED_STATUS
    );
  };

  onConsentStatusChange(callback: (fullConsent: boolean) => void): () => void {
    this.consentStatusChangeListeners.add(callback);
    setTimeout(() => {
      if (!this.consentStatusChangeListeners.has(callback)) {
        return;
      }
      this.hasFullConsent().then((fullConsent) =>
        this.emitConsentStatusChangeEventSingle(fullConsent, callback)
      );
    }, 0);
    return () => this.consentStatusChangeListeners.delete(callback);
  }

  private initializeEventBridge(): void {
    const subscription = addConsentListener(() => {
      this.hasFullConsent().then((fullConsent) => {
        this.emitConsentStatusChange(fullConsent);
      });
    });
    this.eventSubscriptions.push(subscription);
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
        '[ConsentmanagerCmpAdapter::emitConsentStatusChangeEventSingle] listener failed',
        error
      );
    }
  }
}
