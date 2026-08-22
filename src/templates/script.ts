export const BASE_COMPONENTS_JS = `
function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    /* Private browsing and file:// restrictions must not break navigation. */
  }
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function syncThemeButtons(theme) {
  for (const button of document.querySelectorAll('[data-theme-set]')) {
    const active = button.getAttribute('data-theme-set') === theme;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function setTheme(theme, persist) {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) writeStored('iris-theme', theme);
  syncThemeButtons(theme);
  // Diagrams cannot read custom properties, so they re-theme from this event.
  document.dispatchEvent(new CustomEvent('iris:theme', { detail: theme }));
}

function setupTheme() {
  const stored = readStored('iris-theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  syncThemeButtons(currentTheme());
  for (const button of document.querySelectorAll('[data-theme-set]')) {
    button.addEventListener('click', () => setTheme(button.getAttribute('data-theme-set'), true));
  }
}

function setupNavigation() {
  const root = document.documentElement;
  if (readStored('iris-nav') === 'collapsed') root.setAttribute('data-nav', 'collapsed');

  const setCollapsed = (collapsed) => {
    if (collapsed) root.setAttribute('data-nav', 'collapsed');
    else root.removeAttribute('data-nav');
    writeStored('iris-nav', collapsed ? 'collapsed' : 'expanded');
    for (const control of document.querySelectorAll('[data-nav-toggle]')) {
      control.setAttribute('aria-expanded', String(!collapsed));
      control.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }
  };

  for (const control of document.querySelectorAll('[data-nav-toggle]')) {
    control.addEventListener('click', () => setCollapsed(root.getAttribute('data-nav') !== 'collapsed'));
  }

  const setMenuOpen = (open) => {
    if (open) root.setAttribute('data-nav-open', '');
    else root.removeAttribute('data-nav-open');
    for (const control of document.querySelectorAll('[data-menu-toggle]')) {
      control.setAttribute('aria-expanded', String(open));
    }
  };

  for (const control of document.querySelectorAll('[data-menu-toggle]')) {
    control.addEventListener('click', (event) => {
      event.stopPropagation();
      setMenuOpen(!root.hasAttribute('data-nav-open'));
    });
  }

  document.addEventListener('click', (event) => {
    if (!root.hasAttribute('data-nav-open')) return;
    const target = event.target;
    if (target instanceof Element && target.closest('[data-sidebar]')) return;
    setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.hasAttribute('data-nav-open')) setMenuOpen(false);
  });

  return { setCollapsed };
}

function wireTabs(root) {
  for (const group of root.querySelectorAll('[data-tabs]')) {
    if (group.hasAttribute('data-tabs-ready')) continue;
    group.setAttribute('data-tabs-ready', '');
    const buttons = Array.from(group.querySelectorAll('[role="tab"]'));
    const groupId = group.getAttribute('data-tabs');
    const panels = root.querySelectorAll('[data-tab-group="' + groupId + '"]');
    const activate = (button, moveFocus) => {
      buttons.forEach((it) => {
        const selected = it === button;
        it.setAttribute('aria-selected', String(selected));
        it.setAttribute('tabindex', selected ? '0' : '-1');
      });
      panels.forEach((panel) => {
        panel.hidden = panel.getAttribute('data-tab-id') !== button.getAttribute('data-tab-id');
      });
      document.dispatchEvent(new CustomEvent('iris:visibilitychange'));
      if (moveFocus) button.focus();
    };
    buttons.forEach((button) => {
      button.addEventListener('click', () => activate(button, false));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = buttons.indexOf(button);
        const next = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        activate(buttons[next], true);
      });
    });
  }
}

function setupTabs() {
  wireTabs(document);
}

function setupFilter() {
  const input = document.querySelector('[data-filter-input]');
  if (!input) return;
  const apply = () => {
    const query = input.value.trim().toLowerCase();
    for (const item of document.querySelectorAll('[data-work-item]')) {
      const searchable = item.getAttribute('data-work-search') || item.textContent || '';
      item.hidden = query !== '' && !searchable.toLowerCase().includes(query);
    }
    const visible = Array.from(document.querySelectorAll('[data-work-list-item]'))
      .filter((item) => !item.hidden).length;
    for (const count of document.querySelectorAll('[data-work-result-count]')) {
      count.textContent = visible + (visible === 1 ? ' item' : ' items');
    }
  };
  input.addEventListener('input', apply);
  apply();
}

function setupKeyboardShortcuts(navigation) {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const editing = target instanceof HTMLElement && (
      target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
    );
    if (editing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === '/') {
      const input = Array.from(document.querySelectorAll('[data-filter-input]'))
        .find((candidate) => !candidate.closest('[hidden]'));
      if (input instanceof HTMLElement) {
        event.preventDefault();
        input.focus();
      }
    }
    if (event.key.toLowerCase() === 't') {
      event.preventDefault();
      setTheme(currentTheme() === 'light' ? 'dark' : 'light', true);
    }
    if (event.key.toLowerCase() === 'b' && navigation) {
      event.preventDefault();
      navigation.setCollapsed(document.documentElement.getAttribute('data-nav') !== 'collapsed');
    }
  });
}

function setupCardNavigation() {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const cards = Array.from(document.querySelectorAll('[data-work-open]'))
      .filter((card) => !card.closest('[hidden]'));
    const index = cards.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const offset = event.key === 'ArrowDown' ? 1 : -1;
    const next = cards[(index + offset + cards.length) % cards.length];
    if (next instanceof HTMLElement) next.focus();
  });
}

function setupWorkDrawer() {
  const shell = document.querySelector('[data-work-drawer]');
  const drawer = shell && shell.querySelector('[role="dialog"]');
  const main = document.querySelector('[data-dashboard-main]');
  if (!(shell instanceof HTMLElement) || !(drawer instanceof HTMLElement) || !(main instanceof HTMLElement)) return;

  const closeButton = shell.querySelector('[data-work-drawer-close]');
  const backdrop = shell.querySelector('[data-work-drawer-backdrop]');
  const fullPage = shell.querySelector('[data-work-drawer-full-page]');
  let lastOpener = null;

  const slot = (name) => shell.querySelector('[data-work-drawer-' + name + ']');
  const setText = (name, value) => {
    const target = slot(name);
    if (target) target.textContent = value || 'not set';
  };
  const itemForId = (id) => Array.from(document.querySelectorAll('[data-work-item]'))
    .find((item) => item.getAttribute('data-work-id') === id);

  const open = (opener, updateHash) => {
    const item = opener.closest('[data-work-item]');
    if (!(item instanceof HTMLElement)) return;
    lastOpener = opener;
    for (const selected of document.querySelectorAll('[data-work-selected]')) selected.removeAttribute('data-work-selected');
    for (const match of document.querySelectorAll('[data-work-item]')) {
      if (match.getAttribute('data-work-id') === item.dataset.workId) match.setAttribute('data-work-selected', '');
    }
    setText('id', item.dataset.workId);
    setText('title', item.dataset.workTitle);
    setText('type', item.dataset.workType);
    setText('status', item.dataset.workStatus);
    setText('priority', item.dataset.workPriority);
    setText('updated', item.dataset.workUpdated);
    setText('agent', item.dataset.workAgent);
    setText('description', item.dataset.workDescription);
    setText('evidence', item.dataset.workEvidence);
    setText('tags', item.dataset.workTags || 'not set');
    if (fullPage instanceof HTMLAnchorElement) fullPage.href = item.dataset.workHref || opener.href;
    shell.hidden = false;
    main.setAttribute('inert', '');
    document.body.classList.add('drawer-open');
    if (closeButton instanceof HTMLElement) closeButton.focus();
    const id = item.dataset.workId || '';
    const hash = '#work=' + encodeURIComponent(id);
    if (updateHash && location.hash !== hash) history.pushState(null, '', hash);
  };

  const close = (restoreFocus, clearHash) => {
    if (shell.hidden) return;
    shell.hidden = true;
    main.removeAttribute('inert');
    document.body.classList.remove('drawer-open');
    for (const selected of document.querySelectorAll('[data-work-selected]')) selected.removeAttribute('data-work-selected');
    if (clearHash && location.hash.startsWith('#work=')) {
      history.replaceState(null, '', location.href.split('#')[0]);
    }
    if (restoreFocus && lastOpener instanceof HTMLElement && document.contains(lastOpener)) lastOpener.focus();
  };

  for (const opener of document.querySelectorAll('[data-work-open]')) {
    opener.addEventListener('click', (event) => {
      event.preventDefault();
      open(opener, true);
    });
    opener.addEventListener('keydown', (event) => {
      if (event.key !== ' ') return;
      event.preventDefault();
      open(opener, true);
    });
  }

  for (const row of document.querySelectorAll('[data-work-row]')) {
    row.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('a, button, input, select, textarea')) return;
      const opener = row.querySelector('[data-work-open]');
      if (opener instanceof HTMLElement) opener.click();
    });
  }

  if (closeButton) closeButton.addEventListener('click', () => close(true, true));
  if (backdrop) backdrop.addEventListener('click', () => close(true, true));
  drawer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true, true);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hasAttribute('hidden'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const syncHash = () => {
    if (!location.hash.startsWith('#work=')) {
      close(true, false);
      return;
    }
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(6)); } catch { return; }
    const item = itemForId(id);
    if (!(item instanceof HTMLElement)) return;
    const opener = item.matches('[data-work-open]') ? item : item.querySelector('[data-work-open]');
    if (opener instanceof HTMLElement) open(opener, false);
  };
  window.addEventListener('hashchange', syncHash);
  syncHash();
}

async function setupMermaid() {
  if (!globalThis.mermaid || typeof globalThis.mermaid.initialize !== 'function') return;
  // Spec records arrive from the bundle after load, so figures are queried per pass.
  const figures = () => Array.from(document.querySelectorAll('[data-mermaid-figure]'));

  const token = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function initialize() {
    globalThis.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering', 'maxEdges', 'htmlLabels', 'flowchart'],
      htmlLabels: false,
      maxTextSize: 50000,
      maxEdges: 500,
      suppressErrorRendering: true,
      theme: 'base',
      themeVariables: {
        darkMode: document.documentElement.getAttribute('data-theme') !== 'light',
        background: 'transparent',
        fontFamily: token('--font-mono') || 'ui-monospace, Menlo, monospace',
        fontSize: '13px',
        primaryColor: token('--mmd-primary'),
        primaryTextColor: token('--mmd-primary-text'),
        primaryBorderColor: token('--mmd-primary-border'),
        lineColor: token('--mmd-line'),
        secondaryColor: token('--mmd-secondary'),
        tertiaryColor: token('--mmd-tertiary'),
        noteBkgColor: token('--mmd-note-bg'),
        noteTextColor: token('--mmd-note-text'),
        actorBorder: token('--mmd-actor-border'),
        signalColor: token('--mmd-signal'),
      },
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      flowchart: { htmlLabels: false, useMaxWidth: true },
    });
  }

  initialize();

  // Sources are captured before the first render so a theme change can redraw
  // from the original text rather than from an already-rendered SVG.
  const sources = new Map();
  let renderSequence = 0;

  async function renderFigure(figure) {
    if (figure.hasAttribute('data-render-state')) return;
    const host = figure.querySelector('[data-mermaid-host]');
    const status = figure.querySelector('[data-mermaid-status]');
    if (!(host instanceof HTMLElement) || !(status instanceof HTMLElement)) return;
    host.setAttribute('data-render-state', 'measuring');
    if (host.getClientRects().length === 0) {
      host.removeAttribute('data-render-state');
      return;
    }
    if (!sources.has(host)) sources.set(host, host.textContent || '');
    const source = sources.get(host);
    host.textContent = source;
    host.classList.add('mermaid');
    host.setAttribute('data-render-state', 'pending');
    figure.setAttribute('data-render-state', 'pending');
    status.textContent = 'Rendering diagram…';
    try {
      if (source.length > 50000) throw new Error('diagram source exceeds 50000 characters');
      // Rendering by explicit id rather than mermaid.run: run() derives its id
      // from Date.now(), so two diagrams finishing in the same millisecond —
      // which is what a theme re-render does — collide and draw into one host.
      renderSequence += 1;
      const { svg: markup } = await globalThis.mermaid.render(
        'iris-mermaid-' + renderSequence,
        source,
      );
      host.innerHTML = markup;
      const svg = host.querySelector('svg');
      if (!(svg instanceof SVGElement)) throw new Error('Mermaid did not produce an SVG');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', host.getAttribute('aria-label') || 'Mermaid diagram');
      host.setAttribute('data-render-state', 'rendered');
      figure.setAttribute('data-render-state', 'rendered');
      status.textContent = 'Diagram rendered.';
    } catch (error) {
      host.textContent = source;
      host.setAttribute('data-render-state', 'error');
      figure.setAttribute('data-render-state', 'error');
      status.textContent = 'Diagram could not be rendered. Escaped source is shown below.';
    }
  }

  async function renderVisibleFigures() {
    for (const figure of figures()) await renderFigure(figure);
  }

  // \`toggle\` does not bubble; capturing on the document also covers injected <details>.
  document.addEventListener('toggle', (event) => {
    if (event.target instanceof HTMLDetailsElement && event.target.open) void renderVisibleFigures();
  }, true);
  document.addEventListener('iris:visibilitychange', () => void renderVisibleFigures());
  document.addEventListener('iris:theme', () => {
    initialize();
    for (const figure of figures()) {
      const host = figure.querySelector('[data-mermaid-host]');
      if (!(host instanceof HTMLElement) || !sources.has(host)) continue;
      host.removeAttribute('data-render-state');
      figure.removeAttribute('data-render-state');
    }
    void renderVisibleFigures();
  });
  await renderVisibleFigures();
}

function setupSpecBrowser() {
  const index = document.querySelector('[data-spec-index]');
  const region = document.querySelector('[data-spec-detail]');
  const slot = document.querySelector('[data-spec-detail-content]');
  if (!(index instanceof HTMLElement) || !(region instanceof HTMLElement) || !(slot instanceof HTMLElement)) return;

  const bundle = globalThis.IRIS_SPEC;
  const records = bundle && bundle.records ? bundle.records : null;
  const crumb = document.querySelector('[data-spec-crumb]');
  const crumbDefault = crumb ? crumb.textContent : '';

  const showIndex = () => {
    region.hidden = true;
    slot.textContent = '';
    index.hidden = false;
    if (crumb) crumb.textContent = crumbDefault;
  };

  const showRecord = (record) => {
    index.hidden = true;
    region.hidden = false;
    // Content is generated and escaped by Iris at render time; inserted script
    // elements do not execute, and the parser output is already escaped.
    slot.innerHTML = record.html;
    wireTabs(slot);
    if (crumb) crumb.textContent = record.title;
    const heading = slot.querySelector('h1');
    if (heading instanceof HTMLElement) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
    document.dispatchEvent(new CustomEvent('iris:visibilitychange'));
  };

  const sync = () => {
    const hash = location.hash;
    if (!records || !hash.startsWith('#/')) {
      showIndex();
      return;
    }
    let key = '';
    try {
      const parts = hash.slice(2).split('/');
      const kind = parts.shift() || '';
      key = kind + ':' + decodeURIComponent(parts.join('/'));
    } catch (error) {
      showIndex();
      return;
    }
    const record = Object.prototype.hasOwnProperty.call(records, key) ? records[key] : undefined;
    if (!record) {
      showIndex();
      return;
    }
    showRecord(record);
  };

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('[data-spec-back]')) {
      event.preventDefault();
      if (location.hash.startsWith('#/')) history.replaceState(null, '', location.href.split('#')[0]);
      showIndex();
    }
  });

  window.addEventListener('hashchange', sync);
  sync();
}

const navigation = setupNavigation();
setupTheme();
setupTabs();
setupFilter();
setupKeyboardShortcuts(navigation);
setupCardNavigation();
setupWorkDrawer();
setupSpecBrowser();
void setupMermaid();
document.documentElement.setAttribute('data-iris-js', 'ready');
`;
