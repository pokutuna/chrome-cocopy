Add
===

## Generate function for the gallery

- [cocopy: generate link for gallery](https://us-central1-cocopy.cloudfunctions.net/redirect?f=eyJuYW1lIjoiY29jb3B5OiBnZW5lcmF0ZSBsaW5rIGZvciBnYWxsZXJ5IiwiY29kZSI6Ii8qKlxuICogR2VuZXJhdGUgbWVzc2FnZSBmb3IgY29jb3B5IGZ1bmN0aW9uIGdhbGxlcnkuXG4gKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9wb2t1dHVuYS9jaHJvbWUtY29jb3B5L2Jsb2IvbWFzdGVyL2dhbGxlcnkvYWRkLm1kXG4gKi9cbih7dXJsLCBjb250ZW50fSkgPT4ge1xuICBjb25zdCBlbmNvZGVkID0gdXJsLm1hdGNoKC9cXD9mPSg%252FPGY%252BLispLykuZ3JvdXBzLmY7XG4gIGNvbnN0IGZuID0gSlNPTi5wYXJzZShhdG9iKGRlY29kZVVSSUNvbXBvbmVudChlbmNvZGVkKSkpO1xuXG4gIGNvbnN0IGxpbmsgPSBuZXcgVVJMKCdodHRwczovL3VzLWNlbnRyYWwxLWNvY29weS5jbG91ZGZ1bmN0aW9ucy5uZXQvcmVkaXJlY3QnKTtcbiAgbGluay5zZWFyY2hQYXJhbXMuc2V0KCdmJywgZW5jb2RlZCk7XG5cbiAgY29uc3QgdGVtcGxhdGUgPSAnLSBbe3tuYW1lfX1dKHt7Jmxpbmt9fSlcXG5cXG5gYGBqc1xcbnt7JmNvZGV9fVxcbmBgYCc7XG4gIGNvbnN0IHZpZXcgPSB7XG4gICAgbGluazogbGluay50b1N0cmluZygpLFxuICAgIG5hbWU6IGZuLm5hbWUsXG4gICAgY29kZTogZm4uY29kZSxcbiAgfTtcbiAgcmV0dXJuIHJlbmRlcih0ZW1wbGF0ZSwgdmlldyk7XG59IiwicGF0dGVybiI6ImNocm9tZS1leHRlbnNpb246Ly8uKy9vcHRpb25zLmh0bWwjL2luc3RhbGwiLCJ0aGVtZSI6eyJ0ZXh0Q29sb3IiOiIjRkZGRkZGIiwiYmFja2dyb3VuZENvbG9yIjoiIzVGNjM2OCJ9LCJ2ZXJzaW9uIjoxfQ%253D%253D)

```js
/**
 * Generate message for cocopy function gallery.
 * @see https://github.com/pokutuna/chrome-cocopy/blob/master/gallery/add.md
 */
({url, content}) => {
  const encoded = url.match(/\?f=(?<f>.+)/).groups.f;
  const fn = JSON.parse(atob(decodeURIComponent(encoded)));

  const link = new URL('https://us-central1-cocopy.cloudfunctions.net/redirect');
  link.searchParams.set('f', encoded);

  const template = '- [{{name}}]({{&link}})\n\n```js\n{{&code}}\n```';
  const view = {
    link: link.toString(),
    name: fn.name,
    code: fn.code,
  };
  return render(template, view);
}
```
