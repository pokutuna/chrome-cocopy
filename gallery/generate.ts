import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

import {render} from 'mustache';
import {decodeSharable} from '../src/lib/share';

const template = fs.readFileSync(
  path.join(__dirname, './README.template.md'),
  'utf8'
);
const gallery = yaml.load(
  fs.readFileSync(path.join(__dirname, './gallery.yaml'), 'utf8')
);

const category = `
{{start}}
{{h}} {{category}}

{{#description}}
{{description}}
{{/description}}
{{#categories}}{{> category}}{{/categories}}
{{#functions}}
{{> func}}

{{/functions}}

{{end}}
`.trim();

const func = `
{{start}}
{{decode}}
{{h}} [{{#md}}{{fn.name}}{{/md}}](https://us-central1-cocopy.cloudfunctions.net/redirect?f={{&f}})

{{&description}}

<details>
<summary>detail</summary>

- color: <span style="color:{{fn.theme.textColor}}; background-color:{{fn.theme.backgroundColor}}">{{fn.theme.backgroundColor}}</span>
{{#fn.pattern}}- pattern: \`{{&fn.pattern}}\`{{/fn.pattern}}
\`\`\`js
{{&fn.code}}
\`\`\`
</details>
{{end}}
`.trim();

let h = '#';

const start = function (this: any) {
  // stop looking up parent context
  if (!this.categories) this.categories = null;
  if (!this.description) this.description = null;

  h += '#';
};

const end = function () {
  h = h.substring(1);
};

const decode = function (this: any) {
  this.fn = decodeSharable(decodeURIComponent(this.f));
};

(global.window as any) = {};

const rendered = render(
  template,
  {
    gallery,
    start,
    end,
    h: () => h,
    decode,
    md: () => (t: string, r: any) => r(t).replace(/[[\]]/g, '\\$&'),
  },
  {
    category,
    func,
  }
);

fs.writeFileSync(path.join(__dirname, './README.md'), rendered);
