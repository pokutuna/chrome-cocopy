const {TextDecoder, TextEncoder} = require('util');

Object.assign(global, {TextDecoder, TextEncoder});
Object.assign(global, require('jest-chrome'));
