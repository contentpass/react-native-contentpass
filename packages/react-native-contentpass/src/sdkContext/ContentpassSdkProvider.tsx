import React, { createContext, useEffect, useState } from 'react';
import type { ContentpassConfig } from '../types/ContentpassConfig';
import Contentpass from '../Contentpass';

export const contentpassSdkContext = createContext<Contentpass | undefined>(
  undefined
);

export const ContentpassSdkProvider = ({
  children,
  contentpassConfig,
}: {
  children: React.ReactNode;
  contentpassConfig: ContentpassConfig;
}) => {
  const [contentpassSdk, setContentpassSdk] = useState<
    Contentpass | undefined
  >();

  useEffect(() => {
    const contentpass = new Contentpass(contentpassConfig);

    setContentpassSdk(contentpass);
  }, [contentpassConfig]);

  if (!contentpassSdk) {
    return null;
  }

  return (
    <contentpassSdkContext.Provider value={contentpassSdk}>
      {children}
    </contentpassSdkContext.Provider>
  );
};
