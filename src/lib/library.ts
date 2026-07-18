/**
 * exporting members are assigned to window in sandbox
 * @packageDescription
 */

import Mustache from 'mustache';

export interface Library {
  render: typeof Mustache.render;
}

export const {render} = Mustache;
