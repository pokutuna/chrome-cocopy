/**
 * exporting members are assigned to window in sandbox
 * @packageDescription
 */

import {render} from 'mustache';

export interface Library {
  render: typeof render;
}

export {render};
