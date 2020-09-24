Function Gallery
===

## Notice
- These links work if you installed this extension.
- Links use a redirector to link with special url scheme `chrome-extension://`.
- Welcome your addition. See [add.md](./add.md) & give me your pull request.


## Scrapbox

- [Scrapbox: [title url]](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiU2NyYXBib3g6IFt0aXRsZSB1cmxdIiwiY29kZSI6Iih7dGl0bGUsIHVybH0pID0%2BIGBbJHt0aXRsZS5yZXBsYWNlKC9cXHMqW1xcW1xcXV1cXHMqL2csICcgJyl9ICR7dXJsfV1gOyIsInRoZW1lIjp7InRleHRDb2xvciI6IiNGRkZGRkYiLCJiYWNrZ3JvdW5kQ29sb3IiOiIjMDZCNjMyIn0sInZlcnNpb24iOjF9)


```js
/**
 * Copy link as Scrapbox
 * @see https://scrapbox.io/help/Syntax
 */
({title, url}) => `[${title.replace(/\s*[\[\]]\s*/g, ' ')} ${url}]`;
```


## GCP

### Document

- [Scrapbox: GCP document with anchor](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiU2NyYXBib3g6IEdDUCBkb2N1bWVudCB3aXRoIGFuY2hvciIsImNvZGUiOiIvKipcbiAqIENyZWF0ZSBsaW5rIHRvIEdDUCBkb2N1bWVudCBmb3IgU2NyYXBib3hcbiAqL1xuKHt0aXRsZSwgdXJsLCBjb250ZW50LCBzZWxlY3RpbmdUZXh0fSkgPT4ge1xuXG4gIC8vIHByZXBlbmQgaGVhZGluZyB0byB0aXRsZSBpZiB1cmwgaGFzIGFuY2hvclxuICBjb25zdCBoYXNoID0gbmV3IFVSTCh1cmwpLmhhc2g7XG4gIGlmIChoYXNoKSB7XG4gICAgY29uc3QgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhjb250ZW50LCAndGV4dC9odG1sJyk7XG4gICAgY29uc3QgaGVhZGluZyA9IGRvYy5xdWVyeVNlbGVjdG9yKGhhc2gpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICB0aXRsZSA9IGAke2hlYWRpbmcuZ2V0QXR0cmlidXRlKCdkYXRhLXRleHQnKX0gLSAke3RpdGxlfWA7XG4gICAgfVxuICB9XG5cbiAgLy8gYXBwZW5kIHF1b3RlIGlmIHNlbGVjdGluZyB0ZXh0XG4gIGxldCBxdW90ZTtcbiAgaWYgKHNlbGVjdGluZ1RleHQpIHtcbiAgICBxdW90ZSA9ICc%252BICcgKyBzZWxlY3RpbmdUZXh0LnJlcGxhY2UoL1xcbi9nLCAnICcpO1xuICB9XG5cbiAgY29uc3QgbGluayA9IGBbJHt0aXRsZS5yZXBsYWNlKC9cXHMqW1xcW1xcXV1cXHMqL2csICcgJyl9ICR7dXJsfV1gO1xuICByZXR1cm4gcXVvdGUgPyBbbGluaywgcXVvdGVdLmpvaW4oJ1xcbicpIDogbGluaztcbn0iLCJwYXR0ZXJuIjoiaHR0cHM6Ly9jbG91ZC5nb29nbGUuY29tLy4qL2RvY3MvLioiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzFhNzNlOCJ9LCJ2ZXJzaW9uIjoxfQ%253D%253D)

```js
/**
 * Create link to GCP document for Scrapbox
 */
({title, url, content, selectingText}) => {

  // prepend heading to title if url has anchor
  const hash = new URL(url).hash;
  if (hash) {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const heading = doc.querySelector(hash);
    if (heading) {
      title = `${heading.getAttribute('data-text')} - ${title}`;
    }
  }

  // append quote if selecting text
  let quote;
  if (selectingText) {
    quote = '> ' + selectingText.replace(/\n/g, ' ');
  }

  const link = `[${title.replace(/\s*[\[\]]\s*/g, ' ')} ${url}]`;
  return quote ? [link, quote].join('\n') : link;
}
```


- [Markdown: GCP document with anchor](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiTWFya2Rvd246IEdDUCBkb2N1bWVudCB3aXRoIGFuY2hvciIsImNvZGUiOiIvKipcbiAqIENyZWF0ZSBsaW5rIHRvIEdDUCBkb2N1bWVudCBmb3IgTWFya2Rvd25cbiAqL1xuKHt0aXRsZSwgdXJsLCBjb250ZW50LCBzZWxlY3RpbmdUZXh0fSkgPT4ge1xuXG4gIC8vIHByZXBlbmQgaGVhZGluZyB0byB0aXRsZSBpZiB1cmwgaGFzIGFuY2hvclxuICBjb25zdCBoYXNoID0gbmV3IFVSTCh1cmwpLmhhc2g7XG4gIGlmIChoYXNoKSB7XG4gICAgY29uc3QgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhjb250ZW50LCAndGV4dC9odG1sJyk7XG4gICAgY29uc3QgaGVhZGluZyA9IGRvYy5xdWVyeVNlbGVjdG9yKGhhc2gpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICB0aXRsZSA9IGAke2hlYWRpbmcuZ2V0QXR0cmlidXRlKCdkYXRhLXRleHQnKX0gLSAke3RpdGxlfWA7XG4gICAgfVxuICB9XG5cbiAgLy8gYXBwZW5kIHF1b3RlIGlmIHNlbGVjdGluZyB0ZXh0XG4gIGxldCBxdW90ZTtcbiAgaWYgKHNlbGVjdGluZ1RleHQpIHtcbiAgICBxdW90ZSA9ICc%252BICcgKyBzZWxlY3RpbmdUZXh0LnJlcGxhY2UoL1xcbi9nLCAnICcpO1xuICB9XG5cbiAgY29uc3QgbGluayA9IGBbJHt0aXRsZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCAnXFxcXCQmJyl9XSgke3VybH0pYDtcbiAgcmV0dXJuIHF1b3RlID8gW2xpbmssIHF1b3RlXS5qb2luKCdcXG4nKSA6IGxpbms7XG59IiwicGF0dGVybiI6Imh0dHBzOi8vY2xvdWQuZ29vZ2xlLmNvbS8uKi9kb2NzLy4qIiwidGhlbWUiOnsidGV4dENvbG9yIjoiI0ZGRkZGRiIsImJhY2tncm91bmRDb2xvciI6IiMxYTczZTgifSwidmVyc2lvbiI6MX0%253D)

```js
/**
 * Create link to GCP document for Markdown
 */
({title, url, content, selectingText}) => {

  // prepend heading to title if url has anchor
  const hash = new URL(url).hash;
  if (hash) {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const heading = doc.querySelector(hash);
    if (heading) {
      title = `${heading.getAttribute('data-text')} - ${title}`;
    }
  }

  // append quote if selecting text
  let quote;
  if (selectingText) {
    quote = '> ' + selectingText.replace(/\n/g, ' ');
  }

  const link = `[${title.replace(/[\[\]]/g, '\\$&')}](${url})`;
  return quote ? [link, quote].join('\n') : link;
}
```

### BigQuery

- [BigQuery project.dataset.table as Markdown](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiQmlnUXVlcnkgcHJvamVjdC5kYXRhc2V0LnRhYmxlIGFzIE1hcmtkb3duIiwiY29kZSI6Ii8qKlxuICogQ29weSBwcm9qZWN0LmRhdGFzZXQudGFibGUgYXMgTWFya2Rvd25cbiAqIFxuICogVGhpcyByZW1vdmVzIHRoZSB3b3JraW5nIHByb2plY3QoYD9wcm9qZWN0PWApIHBhcmFtcy5cbiAqL1xuKHBhZ2UpID0%2BIHtcbiAgY29uc3Qgb3JpZyA9IG5ldyBVUkwocGFnZS51cmwpO1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKG9yaWcucGF0aCwgb3JpZy5vcmlnaW4pO1xuICBjb25zdCBwYXJ0cyA9IFtdO1xuICBbJ3AnLCAnZCcsICd0J10uZm9yRWFjaChrID0%2BIHtcbiAgICBjb25zdCBwYXJhbSA9IG9yaWcuc2VhcmNoUGFyYW1zLmdldChrKTtcbiAgICBwYXJ0cy5wdXNoKHBhcmFtKTtcbiAgICB1cmwuc2VhcmNoUGFyYW1zLnNldChrLCBwYXJhbSk7XG4gIH0pO1xuICByZXR1cm4gYFske3BhcnRzLmpvaW4oJy4nKX0gLSBCaWdRdWVyeV0oJHt1cmwudG9TdHJpbmcoKX0pYDtcbn0iLCJwYXR0ZXJuIjoiaHR0cHM6Ly9jb25zb2xlLmNsb3VkLmdvb2dsZS5jb20vYmlncXVlcnkiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzFhNzNlOCJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)

```js
/**
 * Copy project.dataset.table as Markdown
 *
 * This removes the working project(`?project=`) params.
 */
(page) => {
  const orig = new URL(page.url);
  const url = new URL(orig.path, orig.origin);
  const parts = [];
  ['p', 'd', 't'].forEach(k => {
    const param = orig.searchParams.get(k);
    parts.push(param);
    url.searchParams.set(k, param);
  });
  return `[${parts.join('.')} - BigQuery](${url.toString()})`;
}
```



## Amazon.co.jp

- [Amazon.co.jp: URL Simplify](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiQW1hem9uLmNvLmpwOiBTaW1wbGlmeSBVUkwiLCJjb2RlIjoiLyoqXG4gKiBDb3B5IHNpbXBsaWZpZWQgYW1hem9uLmNvLmpwIGl0ZW0gVVJMLlxuICpcbiAqIFJldHVybmluZyBmYWxzeSB2YWx1ZSBkb2Vzbid0IG92ZXJ3cml0ZSB5b3VyIGNsaXBib2FyZC5cbiAqL1xuKHt1cmx9KSA9PiB7XG4gIGNvbnN0IG1hdGNoID0gdXJsLm1hdGNoKC8oXFwvZHBcXC9cXHcrKVsvP10%2FLyk7XG4gIHJldHVybiBtYXRjaCA%2FIG5ldyBVUkwodXJsKS5vcmlnaW4gKyBtYXRjaFsxXSA6IHVuZGVmaW5lZDtcbn0iLCJwYXR0ZXJuIjoiXmh0dHBzOi8vd3d3XFwuYW1hem9uXFwuY29cXC5qcC8uKy9kcC8uKyQiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjMDAwMDAwIiwiYmFja2dyb3VuZENvbG9yIjoiI2ZmYTcyNCJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)

```js
/**
 * Copy simplified amazon.co.jp item URL.
 * Returning falsy value doesn't overwrite your clipboard.
 */
({url}) => {
  const match = url.match(/(\/dp\/\w+)[/?]?/);
  return match ? new URL(url).origin + match[1] : undefined;
}
```


## Text::Hatena

- [Hatena: [{url}:title&#x3D;{title}]](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiSGF0ZW5hOiBbe3VybH06dGl0bGU9e3RpdGxlfV0iLCJjb2RlIjoiLyoqXG4gKiBDb3B5IGFzIFx1MzA2Zlx1MzA2Nlx1MzA2YVx1OGExOFx1NmNkNVxuICogQHNlZSBodHRwczovL2hlbHAuaGF0ZW5hYmxvZy5jb20vZW50cnkvdGV4dC1oYXRlbmEtbGlzdFxuICovXG4oe3RpdGxlLCB1cmx9KSA9PiBgWyR7dXJsfTp0aXRsZT0ke3RpdGxlfV1gOyIsInBhdHRlcm4iOiIiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzAwOGJmZiJ9LCJ2ZXJzaW9uIjoxfQ%253D%253D)

```js
/**
 * Copy as はてな記法
 * @see https://help.hatenablog.com/entry/text-hatena-list
 */
({title, url}) => `[${url}:title=${title}]`;
```
