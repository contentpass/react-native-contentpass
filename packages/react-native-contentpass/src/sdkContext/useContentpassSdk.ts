import { useContext } from 'react';
import { contentpassSdkContext } from './ContentpassSdkProvider';

const useContentpassSdk = () => {
  const contentpassSdk = useContext(contentpassSdkContext);

  if (!contentpassSdk) {
    throw new Error(
      'useContentpassSdk must be used within a ContentpassSdkProvider'
    );
  }

  return contentpassSdk;
};

export default useContentpassSdk;
