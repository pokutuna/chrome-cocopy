import {useEffect} from 'react';

import {FunctionRepository} from '../../lib/function-store/repository';

/**
 * Re-runs `refresh` whenever the repository publishes a new active snapshot,
 * so a change made in another options window or in the popup shows up here.
 *
 * The listener carries no payload by design: subscribers re-read from the
 * repository rather than trusting the change event
 * (docs/function-storage.md, "Storage Port").
 */
export function useSubscribeFunctions(
  repository: FunctionRepository,
  refresh: () => void,
) {
  useEffect(() => {
    return repository.subscribe(refresh);
  }, [repository, refresh]);
}
