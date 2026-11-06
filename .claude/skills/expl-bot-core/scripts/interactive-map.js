async page => {
  // expl-bot interactive map: the researcher's dense input.
  // Every visible interactive element with role, accessible name, attributes, state and nearest section container.
  return await page.evaluate(() => {
    const MAX = 300;
    const UTILITY = /^(flex|grid|col|row|d-|mt-|mb-|ml-|mr-|mx-|my-|pt-|pb-|pl-|pr-|px-|py-|p-|m-|w-|h-|bg-|text-|items-|justify-|rounded|border|shadow|space-|gap-|relative|absolute|hidden|block|inline|container|overflow|font-|sm:|md:|lg:|xl:)/;
    const GENERATED = /(ember\d+|react-select|^rc-|^ng-|^cdk-|^mat-|[0-9a-f]{8,}|\d{4,})/i;

    const visible = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const clean = t => (t || '').replace(/\s+/g, ' ').trim().slice(0, 80);

    const implicitRole = el => {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (tag === 'a' && el.hasAttribute('href')) return 'link';
      if (tag === 'button' || (tag === 'input' && ['button', 'submit', 'reset', 'image'].includes(type))) return 'button';
      if (tag === 'select') return el.multiple ? 'listbox' : 'combobox';
      if (tag === 'textarea') return 'textbox';
      if (tag === 'summary') return 'button';
      if (tag === 'input') {
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        if (type === 'range') return 'slider';
        if (type === 'number') return 'spinbutton';
        if (type === 'search') return 'searchbox';
        if (type === 'file') return 'file-input';
        if (type === 'hidden') return null;
        return 'textbox';
      }
      if (el.isContentEditable) return 'textbox';
      return null;
    };

    const nameOf = el => {
      const aria = el.getAttribute('aria-label');
      if (aria) return clean(aria);
      const lb = el.getAttribute('aria-labelledby');
      if (lb) {
        const t = lb.split(/\s+/).map(id => document.getElementById(id)?.innerText || '').join(' ');
        if (clean(t)) return clean(t);
      }
      if (el.labels && el.labels.length) return clean([...el.labels].map(l => l.innerText).join(' '));
      const txt = clean(el.innerText);
      if (txt) return txt;
      return clean(el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('alt') || el.value || '');
    };

    const semanticClass = el => [...el.classList].find(c => !UTILITY.test(c) && !GENERATED.test(c) && c.length > 2);

    // nearest section container: returns a single semantic selector or null
    const SECTION_TAGS = { nav: 'navigation', aside: 'panes', header: 'navigation', footer: 'navigation', main: 'content', form: 'content', table: 'list', ul: 'list', ol: 'list', dialog: 'overlay' };
    const sectionOf = el => {
      let n = el.parentElement;
      while (n && n !== document.body) {
        const role = n.getAttribute('role');
        const tag = n.tagName.toLowerCase();
        let kind = null;
        if (role === 'dialog' || role === 'alertdialog' || n.getAttribute('aria-modal') === 'true' || tag === 'dialog') kind = 'overlay';
        else if (role === 'navigation' || role === 'banner' || role === 'contentinfo') kind = 'navigation';
        else if (role === 'menu' || role === 'menubar' || role === 'toolbar' || role === 'listbox') kind = 'menu';
        else if (role === 'table' || role === 'grid' || role === 'list' || role === 'tablist') kind = role === 'tablist' ? 'menu' : 'list';
        else if (role === 'main') kind = 'content';
        else if (SECTION_TAGS[tag]) kind = SECTION_TAGS[tag];
        else if (n.id && !GENERATED.test(n.id)) kind = 'content';
        else if (semanticClass(n) && /list|panel|sidebar|toolbar|menu|modal|drawer|detail|form|card|table|content|pagination/i.test(n.className)) kind = 'content';
        if (kind) {
          let sel = null;
          if (n.id && !GENERATED.test(n.id)) sel = '#' + CSS.escape(n.id);
          else if (role) sel = `[role="${role}"]`;
          else if (n.getAttribute('aria-label')) sel = `[aria-label="${n.getAttribute('aria-label')}"]`;
          else if (semanticClass(n)) sel = '.' + CSS.escape(semanticClass(n));
          else if (n.getAttribute('data-testid')) sel = `[data-testid="${n.getAttribute('data-testid')}"]`;
          return { kind, container: sel, tag };
        }
        n = n.parentElement;
      }
      return { kind: 'content', container: null, tag: 'body' };
    };

    const SELECTOR = [
      'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', 'summary',
      '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]', '[role="menuitemcheckbox"]',
      '[role="menuitemradio"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]', '[role="combobox"]',
      '[role="textbox"]', '[role="option"]', '[role="treeitem"]', '[role="slider"]', '[contenteditable="true"]'
    ].join(',');

    const all = [...document.querySelectorAll(SELECTOR)].filter(visible);
    const seen = new Set();
    const items = [];
    for (const el of all) {
      if (seen.has(el)) continue;
      seen.add(el);
      const role = el.getAttribute('role') || implicitRole(el);
      if (!role) continue;
      const tag = el.tagName.toLowerCase();
      const sec = sectionOf(el);
      const href = tag === 'a' ? (el.getAttribute('href') || '') : '';
      items.push({
        i: items.length,
        section: sec.kind,
        container: sec.container,
        role,
        name: nameOf(el),
        tag,
        type: el.getAttribute('type') || undefined,
        id: el.id && !GENERATED.test(el.id) ? el.id : undefined,
        nameAttr: el.getAttribute('name') || undefined,
        testid: el.getAttribute('data-testid') || undefined,
        ariaLabel: el.getAttribute('aria-label') || undefined,
        placeholder: el.getAttribute('placeholder') || undefined,
        href: href ? href.replace(/^https?:\/\/[^/]+/, '').split('?')[0].slice(0, 60) : undefined,
        cls: semanticClass(el),
        disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true' || undefined,
        checked: el.checked === true || el.getAttribute('aria-checked') === 'true' || undefined,
        expanded: el.getAttribute('aria-expanded') || undefined,
        required: el.required === true || el.getAttribute('aria-required') === 'true' || undefined,
        selected: el.getAttribute('aria-selected') === 'true' || undefined,
        value: ['textbox', 'searchbox', 'spinbutton'].includes(role) && el.value ? String(el.value).slice(0, 40) : undefined
      });
      if (items.length >= MAX) break;
    }

    // frames the page contains (rows of type iframe)
    const iframes = [...document.querySelectorAll('iframe')].filter(visible).map(f => ({
      id: f.id || undefined, name: f.getAttribute('name') || undefined, title: f.getAttribute('title') || undefined,
      src: (f.getAttribute('src') || '').slice(0, 80)
    }));

    // duplicate (role,name) pairs: these need a container or an index
    const counts = {};
    items.forEach(x => { const k = x.role + '|' + x.name; counts[k] = (counts[k] || 0) + 1; });
    const duplicates = Object.entries(counts).filter(([, c]) => c > 1).map(([k, c]) => ({ roleName: k, count: c })).slice(0, 40);

    // pagination hints
    const pagination = {
      controls: !!document.querySelector('[aria-label*="agination" i], nav[aria-label*="page" i], .pagination, [role="navigation"] [aria-label*="next" i]'),
      loadMore: [...document.querySelectorAll('button,a')].some(b => /^(load more|show more|more)$/i.test(clean(b.innerText)))
    };

    return { url: location.href, total: all.length, returned: items.length, truncated: all.length > MAX, items, iframes, duplicates, pagination };
  });
}
