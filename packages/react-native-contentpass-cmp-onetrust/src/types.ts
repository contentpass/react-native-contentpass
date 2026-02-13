export interface PreferenceCenterData {
  purposes: Purpose[];
  pcUIData: any;
  appConfig: any;
  otConsentString: string;
  storageKeys: any;
}

export interface Purpose {
  purposeId: string;
  descriptionLegal: string;
  legIntStatus: number;
  vendorsLinkedInfo: string;
  parent: string;
  consentStatus: number;
  firstPartyCookies: any[];
  iabIllustrations: string[];
  showSDKListLink: boolean;
  generalVendorsIds: any[];
  groupDescription: string;
  children: Purpose[];
  type: string;
  groupName: string;
  groupId: string;
  isIabPurpose: boolean;
  consentToggleStatus: number;
}

export interface BannerData {
  otConsentString: string;
  bannerUIData: BannerUIData;
  appConfig: any;
  storageKeys: any;
}

export interface BannerUIData {
  summary: Summary;
  buttons: Buttons;
  general: General;
  logo: Logo;
}

export interface Summary {
  dpdTitle: Title;
  title: Title;
  description: Title;
  dpdDescription: Title;
}

export interface Title {
  text: string;
  textColor: string;
  textColorDark: string;
  textAlign: string;
  fontSize: string;
}

export interface Buttons {
  acceptAll: Button;
  vendorList: Button;
  rejectAll: Button;
  showPreferences: Button;
}

export interface Button {
  section: any;
  showText: boolean;
  interactionType: string;
  position: number;
  colorDark: string;
  voiceOverText: string;
  textColor: string;
  textColorDark: string;
  showAsLink: boolean;
  color: string;
  imgcolor: string;
  text: string;
  fontSize: string;
  borderRadius: string;
  imgcolorDark: string;
  homeIconShow: boolean;
}

export interface General {
  useRTL: boolean;
  backgroundColor: string;
  additionalDescriptionPlacement: string;
  bannerLinkScreenReaderAriaLabel: string;
  bannerLandingDescription: string;
  buttonBorderShow: boolean;
  layoutHeight: number;
  backgroundColorDark: string;
  openNewViewAriaLabel: string;
}

export interface Logo {
  url: string;
  logoVoiceOverText: string;
}

export interface AppConfig {
  regionCode: string;
  shouldResetLocalState: boolean;
  templateChanged: boolean;
  showBanner: boolean;
  templateType: string;
  countryCode: string;
  bannerReasonCode: number;
  bannerReason: string;
}
