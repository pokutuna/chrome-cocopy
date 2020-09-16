import {useEffect} from 'preact/hooks';
import {CopyFunctionWithTheme} from '../../lib/function';

export function useSubscribeFunctions(
  update: (functions: CopyFunctionWithTheme[]) => void
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
