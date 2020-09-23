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

## Text::Hatena

- [Hatena: [{url}:title={title}]](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiSGF0ZW5hOiBbe3VybH06dGl0bGU9e3RpdGxlfV0iLCJjb2RlIjoiLyoqXG4gKiBDb3B5IGFzIFx1MzA2Zlx1MzA2Nlx1MzA2YVx1OGExOFx1NmNkNVxuICogQHNlZSBodHRwczovL2hlbHAuaGF0ZW5hYmxvZy5jb20vZW50cnkvdGV4dC1oYXRlbmEtbGlzdFxuICovXG4oe3RpdGxlLCB1cmx9KSA9PiBgWyR7dXJsfTp0aXRsZT0ke3RpdGxlfV1gOyIsInBhdHRlcm4iOiIiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzAwOGJmZiJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)


```js
/**
 * Copy as はてな記法
 * @see https://help.hatenablog.com/entry/text-hatena-list
 */
({title, url}) => `[${url}:title=${title}]`;
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

## BigQuery

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
