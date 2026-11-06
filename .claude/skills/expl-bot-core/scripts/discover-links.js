async page => {
  // expl-bot discovery input: every visible anchor with text, target and whether it stays on the same origin.
  // Read-only: it only reads the DOM. Buttons and href="#" links are NOT listed here; the discoverer follows those
  // by clicking (site-scope.md, "Following navigation controls").
  return await page.evaluate(() => {
    const MAX = 200;
    const visible = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const clean = t => (t || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const links = [];
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href]')) {
      if (!visible(a)) continue;
      const raw = a.getAttribute('href') || '';
      if (!raw || raw.startsWith('#') || /^(mailto:|tel:|javascript:|data:|file:)/i.test(raw)) continue;
      let u;
      try { u = new URL(a.href, location.href); } catch { continue; }
      const sameOrigin = u.origin === location.origin;
      const key = (sameOrigin ? u.pathname + u.search : u.href);
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        text: clean(a.innerText || a.getAttribute('aria-label') || a.getAttribute('title') || a.querySelector('img')?.alt),
        path: sameOrigin ? u.pathname + u.search : undefined,
        external: sameOrigin ? undefined : u.origin,
        target: a.getAttribute('target') || undefined,
        testid: a.getAttribute('data-test') || a.getAttribute('data-testid') || undefined,
      });
      if (links.length >= MAX) break;
    }
    // controls that navigate without an href (candidates for the click-and-record pass)
    const navButtons = [...document.querySelectorAll('button, [role="button"], a:not([href]), a[href="#"]')]
      .filter(visible)
      .map(el => ({
        text: clean(el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || ''),
        tag: el.tagName.toLowerCase(),
        testid: el.getAttribute('data-test') || el.getAttribute('data-testid') || undefined,
      }))
      .filter(x => x.text || x.testid)
      .slice(0, 80);
    return { url: location.href, origin: location.origin, title: document.title, links, navButtons };
  });
}
