import {useState, useEffect, useCallback} from 'react';
import {
  Modifier,
  getModifier,
  hasModifierChanged,
  EMPTY_MODIFIER,
} from '../../lib/modifier';

export function useModifier(): Modifier {
  const [modifier, setModifier] = useState<Modifier>(EMPTY_MODIFIER);

  const handler = useCallback(
    (e: KeyboardEvent) => {
      const next = getModifier(e);
      if (hasModifierChanged(modifier, next)) setModifier(next);
    },
    [modifier]
  );

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handler]);

  useEffect(() => {
    document.addEventListener('keyup', handler);
    return () => document.removeEventListener('keyup', handler);
  }, [handler]);

  return modifier;
}
