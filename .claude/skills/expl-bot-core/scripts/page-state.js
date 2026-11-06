async page => {
  // expl-bot page state: URL, title, headings, open overlay -> JSON + deterministic state key.
  // "Regex for form, AI for meaning": the key is computed here, never by the model.
  return await page.evaluate(() => {
    const visible = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const clean = t => (t || '').replace(/\s+/g, ' ').trim().slice(0, 80);

    const headings = [...document.querySelectorAll('h1,h2,h3')]
      .filter(visible)
      .map(h => clean(h.innerText))
      .filter(Boolean)
      .slice(0, 12);

    const overlayEls = [...document.querySelectorAll('dialog[open],[role="dialog"],[role="alertdialog"],[aria-modal="true"]')]
      .filter(visible);
    const overlays = overlayEls.map(o => {
      const label = o.getAttribute('aria-label')
        || (o.getAttribute('aria-labelledby') && clean(document.getElementById(o.getAttribute('aria-labelledby'))?.innerText))
        || clean(o.querySelector('h1,h2,h3,[role="heading"]')?.innerText)
        || '(unnamed)';
      return { role: o.getAttribute('role') || o.tagName.toLowerCase(), name: clean(label) };
    });

    // collapse ids so /products/42/edit and /products/77/edit are the same state
    const path = location.pathname
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/:uuid')
      .replace(/\/\d+(?=\/|$)/g, '/:id');

    const overlayPart = overlays.length ? overlays.map(o => o.name).join('+') : '-';
    const headingPart = headings.slice(0, 5).join('>');
    const stateKey = `${path}|${overlayPart}|${headingPart}`;

    // djb2 hash for file names / compact comparison
    let h = 5381;
    for (let i = 0; i < stateKey.length; i++) h = ((h << 5) + h + stateKey.charCodeAt(i)) >>> 0;

    const pageKey = ((path === '/' ? 'home' : path.replace(/^\//, '').replace(/\/:?(id|uuid)/g, '-id').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()) || 'home')
      + (overlays.length ? '--modal-' + overlays[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) : '');

    return {
      url: location.href,
      path,
      title: document.title,
      headings,
      overlays,
      focused: document.activeElement && document.activeElement !== document.body
        ? { tag: document.activeElement.tagName.toLowerCase(), name: clean(document.activeElement.getAttribute('aria-label') || document.activeElement.name || document.activeElement.id || document.activeElement.innerText) }
        : null,
      stateKey,
      stateHash: h.toString(16),
      pageKey
    };
  });
}
