
function setupTabs() {
  for (const group of document.querySelectorAll('[data-tabs]')) {
    const buttons = Array.from(group.querySelectorAll('[role="tab"]'));
    const groupId = group.getAttribute('data-tabs');
    const panels = document.querySelectorAll('[data-tab-group="' + groupId + '"]');
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

function setupFilter() {
  const input = document.querySelector('[data-filter-input]');
  if (!input) return;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    for (const card of document.querySelectorAll('[data-page-card]')) {
      card.hidden = query !== '' && !card.textContent.toLowerCase().includes(query);
    }
  });
}

function setupKeyboardShortcuts() {
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
      const toggle = document.querySelector('[data-theme-toggle]');
      if (toggle instanceof HTMLElement) {
        event.preventDefault();
        toggle.click();
      }
    }
  });
}

function setupCardNavigation() {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const cards = Array.from(document.querySelectorAll('[data-page-card]:not([hidden])'));
    const index = cards.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const offset = event.key === 'ArrowDown' ? 1 : -1;
    const next = cards[(index + offset + cards.length) % cards.length];
    if (next instanceof HTMLElement) next.focus();
  });
}

function setupTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const stored = localStorage.getItem('iris-theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('iris-theme', next);
  });
}

async function setupMermaid() {
  const figures = Array.from(document.querySelectorAll('[data-mermaid-figure]'));
  if (figures.length === 0) return;
  if (!globalThis.mermaid || typeof globalThis.mermaid.initialize !== 'function') return;

  globalThis.mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering', 'maxEdges', 'htmlLabels', 'flowchart'],
    htmlLabels: false,
    maxTextSize: 50000,
    maxEdges: 500,
    suppressErrorRendering: true,
    theme: 'neutral',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    flowchart: { htmlLabels: false, useMaxWidth: true },
  });

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
    const source = host.textContent || '';
    host.classList.add('mermaid');
    host.setAttribute('data-render-state', 'pending');
    figure.setAttribute('data-render-state', 'pending');
    status.textContent = 'Rendering diagram…';
    try {
      if (source.length > 50000) throw new Error('diagram source exceeds 50000 characters');
      await globalThis.mermaid.run({ nodes: [host], suppressErrors: true });
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
    for (const figure of figures) await renderFigure(figure);
  }

  for (const details of document.querySelectorAll('details')) {
    details.addEventListener('toggle', () => {
      if (details.open) void renderVisibleFigures();
    });
  }
  document.addEventListener('iris:visibilitychange', () => void renderVisibleFigures());
  await renderVisibleFigures();
}

setupTabs();
setupFilter();
setupTheme();
setupKeyboardShortcuts();
setupCardNavigation();
void setupMermaid();
document.documentElement.setAttribute('data-iris-js', 'ready');
