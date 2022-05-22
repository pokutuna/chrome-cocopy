export type Modifier = {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

export const EMPTY_MODIFIER: Modifier = {
  alt: false,
  ctrl: false,
  meta: false,
  shift: false,
};

export function isModifier(input: any): input is Modifier {
  return (
    typeof input === 'object' &&
    typeof input.alt === 'boolean' &&
    typeof input.ctrl === 'boolean' &&
    typeof input.meta === 'boolean' &&
    typeof input.shift === 'boolean'
  );
}

export function getModifier(e: KeyboardEvent): Modifier {
  return {
    alt: e.altKey,
    ctrl: e.ctrlKey,
    meta: e.metaKey,
    shift: e.shiftKey,
  };
}

export function hasModifierChanged(prev: Modifier, next: Modifier): boolean {
  return (
    prev.alt !== next.alt ||
    prev.ctrl !== next.ctrl ||
    prev.meta !== next.meta ||
    prev.shift !== next.shift
  );
}
