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
  try {
    const userStatus = await sdk.getUserStatus();
    const purposeIds = Object.keys(userStatus.purposes ?? {});
    const vendorCount = Object.keys(userStatus.vendors ?? {}).length;

    return new ConsentmanagerCmpAdapter(sdk, purposeIds, vendorCount);
  } catch (error: any) {
    console.error('Error initializing Consentmanager CMP adapter', error);
    throw error;
  }
}

export default class ConsentmanagerCmpAdapter implements CmpAdapter {
  private readonly eventSubscriptions: Array<{ remove: () => void }> = [];
  private readonly consentStatusChangeListeners = new Set<
    (fullConsent: boolean) => void
  >();

  constructor(
    private readonly sdk: CmSdkReactNativeV3Module,
    private readonly purposeIds: string[],
    private readonly numVendors: number
  ) {
    this.initializeEventBridge();
  }

  async waitForInit(): Promise<void> {
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

  getNumberOfVendors(): Promise<number> {
    return Promise.resolve(this.numVendors);
  }

  getRequiredPurposes(): Promise<string[]> {
    return Promise.resolve(this.purposeIds);
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
    if (this.purposeIds.length === 0) {
      return false;
    }

    const statuses = await Promise.all(
      this.purposeIds.map((id) => this.sdk.getStatusForPurpose(id))
    );

    return statuses.every((status: string) => status === GRANTED_STATUS);
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
