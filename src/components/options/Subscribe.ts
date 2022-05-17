import {useEffect} from 'react';
import {CopyFunction} from '../../lib/function';

export function useSubscribeFunctions(
  update: (functions: CopyFunction[]) => void
) {
  useEffect(() => {
    const onChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if ('functions' in changes) {
        update(changes['functions'].newValue);
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [update]);
}
