Function Gallery
===

## Notice

- These links work if you installed this extension.
- Working with redirector to link with special url scheme `chrome-extension://` from github.
- Welcome your addition. Edit `./gallery.yaml`  & create a pull request.


## Built-Ins



### [Markdown: \[title\](url)](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiTWFya2Rvd246IFt0aXRsZV0odXJsKSIsImNvZGUiOiIvKipcbiAqIENvcHkgbGluayBhcyBNYXJrZG93bi5cbiAqL1xuKHt0aXRsZSwgdXJsfSkgPT4ge1xuICBjb25zdCBlc2NhcGVkID0gdGl0bGUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xuICByZXR1cm4gYFske2VzY2FwZWR9XSgke3VybH0pYDtcbn07IiwidGhlbWUiOnsidGV4dENvbG9yIjoiIzAwMDAwMCIsImJhY2tncm91bmRDb2xvciI6IiNmNWY1ZjUifSwidmVyc2lvbiI6MX0%3D)



<details>
<summary>detail</summary>

- color: <span style="color:#000000; background-color:#f5f5f5">#f5f5f5</span>

```js
/**
 * Copy link as Markdown.
 */
({title, url}) => {
  const escaped = title.replace(/[\[\]]/g, '\\$&');
  return `[${escaped}](${url})`;
};
```
</details>



### [HTML: &lt;a href&#x3D;{url}&gt;{title}&lt;&#x2F;a&gt;](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiSFRNTDogPGEgaHJlZj17dXJsfT57dGl0bGV9PC9hPiIsImNvZGUiOiIvKipcbiAqIENvcHkgYXMgYW5jaG9yIGVsZW1lbnQuXG4gKlxuICogWW91IGNhbiB1c2UgbXVzdGFjaGUgdGVtcGxhdGUgd2l0aCBgcmVuZGVyYCBmdW5jdGlvbi5cbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanNcbiAqL1xucGFnZSA9PiByZW5kZXIoJzxhIGhyZWY9XCJ7eyZ1cmx9fVwiPnt7dGl0bGV9fTwvYT4nLCBwYWdlKTsiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiI2ZmNTcyMiJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)



<details>
<summary>detail</summary>

- color: <span style="color:#FFFFFF; background-color:#ff5722">#ff5722</span>

```js
/**
 * Copy as anchor element.
 *
 * You can use mustache template with `render` function.
 * @see https://github.com/janl/mustache.js
 */
page => render('<a href="{{&url}}">{{title}}</a>', page);
```
</details>



## Notations

Link notations for various formats and services.


### [Scrapbox: \[title url\]](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiU2NyYXBib3g6IFt0aXRsZSB1cmxdIiwiY29kZSI6Iih7dGl0bGUsIHVybH0pID0%2BIGBbJHt0aXRsZS5yZXBsYWNlKC9cXHMqW1xcW1xcXV1cXHMqL2csICcgJyl9ICR7dXJsfV1gOyIsInRoZW1lIjp7InRleHRDb2xvciI6IiNGRkZGRkYiLCJiYWNrZ3JvdW5kQ29sb3IiOiIjMDZCNjMyIn0sInZlcnNpb24iOjF9)



<details>
<summary>detail</summary>

- color: <span style="color:#FFFFFF; background-color:#06B632">#06B632</span>

```js
({title, url}) => `[${title.replace(/\s*[\[\]]\s*/g, ' ')} ${url}]`;
```
</details>



### [Hatena: \[{url}:title&#x3D;{title}\]](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiSGF0ZW5hOiBbe3VybH06dGl0bGU9e3RpdGxlfV0iLCJjb2RlIjoiLyoqXG4gKiBDb3B5IGFzIFx1MzA2Zlx1MzA2Nlx1MzA2YVx1OGExOFx1NmNkNVxuICogQHNlZSBodHRwczovL2hlbHAuaGF0ZW5hYmxvZy5jb20vZW50cnkvdGV4dC1oYXRlbmEtbGlzdFxuICovXG4oe3RpdGxlLCB1cmx9KSA9PiBgWyR7dXJsfTp0aXRsZT0ke3RpdGxlfV1gOyIsInBhdHRlcm4iOiIiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzAwOGJmZiJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)



<details>
<summary>detail</summary>

- color: <span style="color:#FFFFFF; background-color:#008bff">#008bff</span>

```js
/**
 * Copy as はてな記法
 * @see https://help.hatenablog.com/entry/text-hatena-list
 */
({title, url}) => `[${url}:title=${title}]`;
```
</details>



## GCP

Create a link to Google Cloud Platform. Linking to a resource considers whether should have &#x60;?project&#x3D;&#x60; parameters or not.

### Document



#### [Markdown: GCP document with section anchor](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiTWFya2Rvd246IEdDUCBkb2N1bWVudCB3aXRoIHNlY3Rpb24gYW5jaG9yIiwiY29kZSI6Ii8qKlxuICogQ3JlYXRlIGxpbmsgdG8gR0NQIGRvY3VtZW50IGZvciBTY3JhcGJveFxuICovXG4oe3RpdGxlLCB1cmwsIGNvbnRlbnQsIHNlbGVjdGluZ1RleHR9KSA9PiB7XG5cbiAgLy8gcHJlcGVuZCBoZWFkaW5nIHRvIHRpdGxlIGlmIHVybCBoYXMgYW5jaG9yXG4gIGNvbnN0IGhhc2ggPSBuZXcgVVJMKHVybCkuaGFzaDtcbiAgaWYgKGhhc2gpIHtcbiAgICBjb25zdCBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGNvbnRlbnQsICd0ZXh0L2h0bWwnKTtcbiAgICBjb25zdCBoZWFkaW5nID0gZG9jLnF1ZXJ5U2VsZWN0b3IoaGFzaCk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIHRpdGxlID0gYCR7aGVhZGluZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV4dCcpfSAtICR7dGl0bGV9YDtcbiAgICB9XG4gIH1cblxuICAvLyBhcHBlbmQgcXVvdGUgaWYgc2VsZWN0aW5nIHRleHRcbiAgbGV0IHF1b3RlO1xuICBpZiAoc2VsZWN0aW5nVGV4dCkge1xuICAgIHF1b3RlID0gJz4gJyArIHNlbGVjdGluZ1RleHQucmVwbGFjZSgvXFxuL2csICcgJyk7XG4gIH1cblxuICBjb25zdCBsaW5rID0gYFske3RpdGxlLnJlcGxhY2UoL1tcXFtcXF1dL2csICdcXFxcJCYnKX1dKCR7dXJsfSlgO1xuICByZXR1cm4gcXVvdGUgPyBbbGluaywgcXVvdGVdLmpvaW4oJ1xcbicpIDogbGluaztcbn0iLCJwYXR0ZXJuIjoiaHR0cHM6Ly9jbG91ZC5nb29nbGUuY29tLy4qL2RvY3MvLioiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzFhNzNlOCJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)



<details>
<summary>detail</summary>

- color: <span style="color:#FFFFFF; background-color:#1a73e8">#1a73e8</span>
- pattern: `https://cloud.google.com/.*/docs/.*`
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

  const link = `[${title.replace(/[\[\]]/g, '\\$&')}](${url})`;
  return quote ? [link, quote].join('\n') : link;
}
```
</details>



#### [Scrapbox: GCP document with section anchor](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiU2NyYXBib3g6IEdDUCBkb2N1bWVudCB3aXRoIHNlY3Rpb24gYW5jaG9yIiwiY29kZSI6Ii8qKlxuICogQ3JlYXRlIGxpbmsgdG8gR0NQIGRvY3VtZW50IGZvciBTY3JhcGJveFxuICovXG4oe3RpdGxlLCB1cmwsIGNvbnRlbnQsIHNlbGVjdGluZ1RleHR9KSA9PiB7XG5cbiAgLy8gcHJlcGVuZCBoZWFkaW5nIHRvIHRpdGxlIGlmIHVybCBoYXMgYW5jaG9yXG4gIGNvbnN0IGhhc2ggPSBuZXcgVVJMKHVybCkuaGFzaDtcbiAgaWYgKGhhc2gpIHtcbiAgICBjb25zdCBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGNvbnRlbnQsICd0ZXh0L2h0bWwnKTtcbiAgICBjb25zdCBoZWFkaW5nID0gZG9jLnF1ZXJ5U2VsZWN0b3IoaGFzaCk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIHRpdGxlID0gYCR7aGVhZGluZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV4dCcpfSAtICR7dGl0bGV9YDtcbiAgICB9XG4gIH1cblxuICAvLyBhcHBlbmQgcXVvdGUgaWYgc2VsZWN0aW5nIHRleHRcbiAgbGV0IHF1b3RlO1xuICBpZiAoc2VsZWN0aW5nVGV4dCkge1xuICAgIHF1b3RlID0gJz4gJyArIHNlbGVjdGluZ1RleHQucmVwbGFjZSgvXFxuL2csICcgJyk7XG4gIH1cblxuICBjb25zdCBsaW5rID0gYFske3RpdGxlLnJlcGxhY2UoL1xccypbXFxbXFxdXVxccyovZywgJyAnKX0gJHt1cmx9XWA7XG4gIHJldHVybiBxdW90ZSA%2FIFtsaW5rLCBxdW90ZV0uam9pbignXFxuJykgOiBsaW5rO1xufSIsInBhdHRlcm4iOiJodHRwczovL2Nsb3VkLmdvb2dsZS5jb20vLiovZG9jcy8uKiIsInRoZW1lIjp7InRleHRDb2xvciI6IiNGRkZGRkYiLCJiYWNrZ3JvdW5kQ29sb3IiOiIjMWE3M2U4In0sInZlcnNpb24iOjF9)



<details>
<summary>detail</summary>

- color: <span style="color:#FFFFFF; background-color:#1a73e8">#1a73e8</span>
- pattern: `https://cloud.google.com/.*/docs/.*`
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
</details>



### Cloud Storage



#### [Scrapbox: GCS storage browser with gs:&#x2F;&#x2F;...](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiU2NyYXBib3g6IEdDUyBzdG9yYWdlIGJyb3dzZXIgd2l0aCBnczovLy4uLiIsImNvZGUiOiIvKipcbiAqIENyZWF0ZSBsaW5rIHRvIHRoZSBHQ1MgYnJvd3NlciB3aXRoIGdzOi8vLi4uIHRpdGxlXG4gKi9cbih7dGl0bGUsIHVybCwgY29udGVudCwgc2VsZWN0aW5nVGV4dH0pID0%2BIHtcbiAgY29uc3QgdSA9IG5ldyBVUkwodXJsKTtcbiAgY29uc3QgbSA9IHUucGF0aG5hbWUubWF0Y2goL1xcL3N0b3JhZ2VcXC9icm93c2VyXFwvKD86X2RldGFpbHNcXC8pPyg%2FPHBhdGg%2BW147XSspKD86O3RhYj0uKyk%2FLyk7XG4gIGNvbnN0IHBhdGggPSBtLmdyb3Vwcy5wYXRoO1xuICBpZiAoIXBhdGgpdGhyb3cgbmV3IEVycm9yKCd1bmV4cGVjdGVkIHBhdGhuYW1lIG9uIEdDUycpO1xuXG4gIHJldHVybiBgW2dzOi8vJHtwYXRofSAke3Uub3JpZ2lufSR7dS5wYXRobmFtZX1dYDtcbn0iLCJwYXR0ZXJuIjoiXmh0dHBzOi8vY29uc29sZS5jbG91ZC5nb29nbGUuY29tL3N0b3JhZ2UvYnJvd3Nlci8iLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzFhNzNlOCJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)



<details>
<summary>detail</summary>

- color: <span style="color:#FFFFFF; background-color:#1a73e8">#1a73e8</span>
- pattern: `^https://console.cloud.google.com/storage/browser/`
```js
/**
 * Create link to the GCS browser with gs://... title
 */
({title, url, content, selectingText}) => {
  const u = new URL(url);
  const m = u.pathname.match(/\/storage\/browser\/(?:_details\/)?(?<path>[^;]+)(?:;tab=.+)?/);
  const path = m.groups.path;
  if (!path)throw new Error('unexpected pathname on GCS');

  return `[gs://${path} ${u.origin}${u.pathname}]`;
}
```
</details>



### BigQuery



#### [Markdown: BigQuery project.dataset.table](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiTWFya2Rvd246IEJpZ1F1ZXJ5IHByb2plY3QuZGF0YXNldC50YWJsZSIsImNvZGUiOiIvKipcbiAqIENvcHkgcHJvamVjdC5kYXRhc2V0LnRhYmxlIGFzIE1hcmtkb3duXG4gKiBcbiAqIFRoaXMgcmVtb3ZlcyB0aGUgd29ya2luZyBwcm9qZWN0KGA%2FcHJvamVjdD1gKSBwYXJhbXMuXG4gKi9cbihwYWdlKSA9PiB7XG4gIGNvbnN0IG9yaWcgPSBuZXcgVVJMKHBhZ2UudXJsKTtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChvcmlnLnBhdGgsIG9yaWcub3JpZ2luKTtcbiAgY29uc3QgcGFydHMgPSBbXTtcbiAgWydwJywgJ2QnLCAndCddLmZvckVhY2goayA9PiB7XG4gICAgY29uc3QgcGFyYW0gPSBvcmlnLnNlYXJjaFBhcmFtcy5nZXQoayk7XG4gICAgcGFydHMucHVzaChwYXJhbSk7XG4gICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoaywgcGFyYW0pO1xuICB9KTtcbiAgcmV0dXJuIGBbJHtwYXJ0cy5qb2luKCcuJyl9IC0gQmlnUXVlcnldKCR7dXJsLnRvU3RyaW5nKCl9KWA7XG59IiwicGF0dGVybiI6Imh0dHBzOi8vY29uc29sZS5jbG91ZC5nb29nbGUuY29tL2JpZ3F1ZXJ5IiwidGhlbWUiOnsidGV4dENvbG9yIjoiI0ZGRkZGRiIsImJhY2tncm91bmRDb2xvciI6IiMxYTczZTgifSwidmVyc2lvbiI6MX0%3D)



<details>
<summary>detail</summary>

- color: <span style="color:#FFFFFF; background-color:#1a73e8">#1a73e8</span>
- pattern: `https://console.cloud.google.com/bigquery`
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
</details>




## Other Web Sites


### Amazon.co.jp



#### [Amazon.co.jp: Simplify URL](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiQW1hem9uLmNvLmpwOiBTaW1wbGlmeSBVUkwiLCJjb2RlIjoiLyoqXG4gKiBDb3B5IHNpbXBsaWZpZWQgYW1hem9uLmNvLmpwIGl0ZW0gVVJMLlxuICpcbiAqIFJldHVybmluZyBmYWxzeSB2YWx1ZSBkb2Vzbid0IG92ZXJ3cml0ZSB5b3VyIGNsaXBib2FyZC5cbiAqL1xuKHt1cmx9KSA9PiB7XG4gIGNvbnN0IG1hdGNoID0gdXJsLm1hdGNoKC8oXFwvZHBcXC9cXHcrKVsvP10%2FLyk7XG4gIHJldHVybiBtYXRjaCA%2FIG5ldyBVUkwodXJsKS5vcmlnaW4gKyBtYXRjaFsxXSA6IHVuZGVmaW5lZDtcbn0iLCJwYXR0ZXJuIjoiXmh0dHBzOi8vd3d3XFwuYW1hem9uXFwuY29cXC5qcC8uKy9kcC8uKyQiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjMDAwMDAwIiwiYmFja2dyb3VuZENvbG9yIjoiI2ZmYTcyNCJ9LCJ2ZXJzaW9uIjoxfQ%3D%3D)



<details>
<summary>detail</summary>

- color: <span style="color:#000000; background-color:#ffa724">#ffa724</span>
- pattern: `^https://www\.amazon\.co\.jp/.+/dp/.+$`
```js
/**
 * Copy simplified amazon.co.jp item URL.
 *
 * Returning falsy value doesn't overwrite your clipboard.
 */
({url}) => {
  const match = url.match(/(\/dp\/\w+)[/?]?/);
  return match ? new URL(url).origin + match[1] : undefined;
}
```
</details>



