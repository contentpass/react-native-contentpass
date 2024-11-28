import React, { createContext, useContext, useEffect, useState } from 'react';
import { Contentpass } from 'react-native-contentpass';
import { contentpassConfig } from './contentpassConfig';

const contentpassSdkContext = createContext<Contentpass | undefined>(undefined);

export const ContentpassSdkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contentpassSdk, setContentpassSdk] = useState<
    Contentpass | undefined
  >();

  useEffect(() => {
    const contentpass = new Contentpass(contentpassConfig);

    setContentpassSdk(contentpass);
  }, []);

  if (!contentpassSdk) {
    return null;
  }

  return (
    <contentpassSdkContext.Provider value={contentpassSdk}>
      {children}
    </contentpassSdkContext.Provider>
  );
};

export const useContentpassSdk = () => {
  const contentpassSdk = useContext(contentpassSdkContext);

  if (!contentpassSdk) {
    throw new Error(
      'useContentpassSdk must be used within a ContentpassSdkProvider'
    );
  }

  return contentpassSdk;
};
