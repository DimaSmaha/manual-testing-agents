async page => {
  // expl-bot locator check (explorbot research stage 2 "Test").
  // TEMPLATE: the researcher writes a COPY into runs/<RUN_ID>/scripts/locator-check-<page-key>.js with CHECKS filled in.
  // Do not run this template as-is. Run the copy:
  //   playwright-cli --raw -s=<SESSION> run-code --filename=.workflow-artifacts/expl-bot/runs/<RUN_ID>/scripts/locator-check-<page-key>.js > .workflow-artifacts/expl-bot/runs/<RUN_ID>/out/locator-check-<page-key>.out 2>&1
  //
  // Each check:
  //   section    - section name from the UI map (list, overlay, ...)
  //   element    - the row's Element column
  //   container  - single CSS selector from "> Container:" or null
  //   aria       - { role, text } or null
  //   css        - CSS selector (Playwright syntax, :has-text allowed) or null
  //   xpath      - XPath starting with // or null
  const CHECKS = [
    // { section: 'list', element: 'Add to cart', container: '.product-list', aria: { role: 'button', text: 'Add to cart' }, css: '.add-btn', xpath: null },
  ];

  const count = async loc => {
    try { return await loc.count(); } catch (e) { return -1; }
  };
  const status = n => (n === 1 ? 'OK' : n === 0 ? 'BROKEN' : n < 0 ? 'INVALID' : 'AMBIGUOUS');

  const containers = {};
  for (const c of CHECKS) {
    if (c.container && !(c.container in containers)) {
      containers[c.container] = await count(page.locator(c.container));
    }
  }

  const rows = [];
  for (const c of CHECKS) {
    const scope = c.container && containers[c.container] === 1 ? page.locator(c.container) : page;
    const row = { section: c.section, element: c.element, containerStatus: c.container ? status(containers[c.container]) : 'NONE' };
    if (c.aria) {
      const n = await count(scope.getByRole(c.aria.role, { name: c.aria.text }));
      row.aria = { n, status: status(n) };
      if (c.container && containers[c.container] === 1) {
        const free = await count(page.getByRole(c.aria.role, { name: c.aria.text }));
        row.aria.withoutContainer = free;
      }
    }
    if (c.css) {
      const n = await count(scope.locator(c.css));
      row.css = { n, status: status(n) };
    }
    if (c.xpath) {
      const n = await count(page.locator('xpath=' + c.xpath));
      row.xpath = { n, status: status(n) };
    }
    const results = [row.aria, row.css, row.xpath].filter(Boolean);
    row.overall = results.some(r => r.status === 'OK') ? 'OK' : results.length ? 'NEEDS_FIX' : 'NO_LOCATOR';
    rows.push(row);
  }

  const summary = {
    total: rows.length,
    ok: rows.filter(r => r.overall === 'OK').length,
    needsFix: rows.filter(r => r.overall === 'NEEDS_FIX').length,
    containersOk: Object.values(containers).filter(n => n === 1).length,
    containersBroken: Object.entries(containers).filter(([, n]) => n !== 1).map(([k, n]) => ({ container: k, n }))
  };
  // explorbot rule: all containers broken or > 80% locators broken -> redo stage 1
  summary.redoResearch = rows.length > 0 && (summary.needsFix / rows.length > 0.8 ||
    (Object.keys(containers).length > 0 && summary.containersOk === 0));
  return { summary, rows };
}
