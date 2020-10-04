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
    'M38.041 305.93 L38.041 261.335 460.976 261.335 460.976 305.93 38.041 305.93 Z M38.066 410.543 L38 366.668 460.934 366.031 461 409.907 38.066 410.543 Z M161.225 130.505 C142.489 130.505 126.635 134.698 113.664 143.082 102.135 151.048 88.203 165.512 71.869 186.474 L38 160.691 C69.707 112.897 110.782 89 161.225 89 197.256 89 230.884 103.883 262.111 133.649 287.092 157.547 312.313 169.495 337.775 169.495 355.55 169.495 371.404 165.407 385.336 157.232 399.268 149.057 413.199 135.327 427.131 116.041 L461 141.825 C431.695 187.942 390.62 211 337.775 211 301.264 211 267.395 196.117 236.169 166.351 211.187 142.453 186.206 130.505 161.225 130.505 Z',
};

export const PatternIcon = () => <SVGIcon icon={pattern} />;
