const extensionId = 'ihnfodlbkhgjnbheemjhkjfkfglgbdgc';
const optionsPage = extensionId =>
  `chrome-extension://${extensionId}/options.html`;

exports.app = (req, res) => {
  const f = req.query.f;
  const eid = req.query.override_extension_id || extensionId;

  if (!f) {
    return res.status(404).send('no function given');
  }
  console.log(JSON.stringify({f}));

  const url = new URL(optionsPage(eid));
  const hash = new URL('/install', 'http://host.invalid');
  hash.searchParams.set('f', f);
  url.hash = hash.pathname + hash.search;

  return res.redirect(url.toString());
};
