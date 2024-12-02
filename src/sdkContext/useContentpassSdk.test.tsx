import React from 'react';
import { renderHook } from '@testing-library/react-native';
import useContentpassSdk from './useContentpassSdk';
import { contentpassSdkContext } from './ContentpassSdkProvider';
import Contentpass from '../Contentpass';

describe('useContentpassSdk', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should return the contentpassSdk from the context', () => {
    const contentpassSdk = 'contentpassSdk';
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <contentpassSdkContext.Provider
        value={contentpassSdk as any as Contentpass}
      >
        {children}
      </contentpassSdkContext.Provider>
    );

    const { result } = renderHook(() => useContentpassSdk(), { wrapper });

    expect(result.current).toBe(contentpassSdk);
  });

  it('should throw an error if used outside of a ContentpassSdkProvider', async () => {
    // mock console.error to prevent error output in test
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useContentpassSdk());
    }).toThrow(
      'useContentpassSdk must be used within a ContentpassSdkProvider'
    );
  });
});
