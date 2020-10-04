import {h} from 'preact';

import styled from 'styled-components';

interface IconDef {
  viewBox: string;
  d: string;
}

const SVGIcon = (props: {icon: IconDef}) => {
  return (
    <svg
      aria-hidden={true}
      focusable={'false'}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox={props.icon.viewBox}
    >
      <path
        fill="currentColor"
        fillOpacity="1"
        stroke="none"
        d={props.icon.d}
      />
    </svg>
  );
};

const pattern: IconDef = {
  viewBox: '0 0 500 500',
  d:
    'M28.48 408.109 L181.996 79.398 251.16 79.398 97.645 408.109 28.48 408.109 Z M251.48 408.109 L404.996 79.398 474.16 79.398 320.645 408.109 251.48 408.109 Z M186.285 356 L186.285 284.32 251.324 284.32 251.324 356 186.285 356 Z',
};

export const PatternIcon = () => <SVGIcon icon={pattern} />;
