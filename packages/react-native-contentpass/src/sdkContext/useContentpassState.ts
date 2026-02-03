import { useEffect, useState } from 'react';
import useContentpassSdk from './useContentpassSdk';
import {
  type ContentpassState,
  ContentpassStateType,
} from '../types/ContentpassState';

const useContentpassState = () => {
  const sdk = useContentpassSdk();
  const [state, setState] = useState<ContentpassState>({
    state: ContentpassStateType.INITIALISING,
  });

  useEffect(() => {
    const observer = (nextState: ContentpassState) => setState(nextState);
    sdk.registerObserver(observer);

    return () => {
      sdk.unregisterObserver(observer);
    };
  }, [sdk]);

  return state;
};

export default useContentpassState;
