import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

import {decodeSharable} from '../src/lib/share';

interface GalleryCategory {
  category: string;
  functions?: {f: string; format: string}[];
  categories?: GalleryCategory[];
}

const gallery = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, './gallery.yaml'), 'utf8')
) as GalleryCategory[];

const run = (c: GalleryCategory) => {
  test(c.category, () =>
    expect(() =>
      (c.functions || []).forEach(fn =>
        decodeSharable(decodeURIComponent(fn.f))
      )
    ).not.toThrowError()
  );
};

gallery.forEach(run);
