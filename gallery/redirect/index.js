const extensionId = 'ihnfodlbkhgjnbheemjhkjfkfglgbdgc';
const optionsPage = `chrome-extension://${extensionId}/options.html`;

exports.app = (req, res) => {
  const f = req.query.f;
  if (!f) {
    return res.status(404).send('given no function.');
  }

  const url = new URL(optionsPage);
  const hash = new URL('/install', 'http://host.invalid');
  hash.searchParams.set('f', f);
  url.hash = hash.pathname + hash.search;

  return res.redirect(url.toString());
};
