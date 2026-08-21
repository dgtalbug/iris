
function setupTabs() {
  for (const group of document.querySelectorAll('[data-tabs]')) {
    const buttons = group.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[data-tab-group="' + group.getAttribute('data-tabs') + '"]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((it) => it.setAttribute('aria-selected', String(it === button)));
        panels.forEach((panel) => {
          panel.hidden = panel.getAttribute('data-tab-id') !== button.getAttribute('data-tab-id');
        });
      });
    });
  }
}

function setupViewToggle() {
  const listBtn = document.querySelector('[data-view="list"]');
  const boardBtn = document.querySelector('[data-view="board"]');
  const list = document.querySelector('[data-dashboard-list]');
  const board = document.querySelector('[data-dashboard-board]');
  if (!listBtn || !boardBtn || !list || !board) return;
  const setView = (view) => {
    list.hidden = view !== 'list';
    board.hidden = view !== 'board';
    listBtn.setAttribute('aria-selected', String(view === 'list'));
    boardBtn.setAttribute('aria-selected', String(view === 'board'));
  };
  listBtn.addEventListener('click', () => setView('list'));
  boardBtn.addEventListener('click', () => setView('board'));
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
  const blocks = document.querySelectorAll('[data-mermaid-source]');
  if (blocks.length === 0) return;
  const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs');
  const mermaid = mermaidModule.default;
  mermaid.initialize({ startOnLoad: false });
  for (const block of blocks) {
    const source = block.getAttribute('data-mermaid-source');
    if (!source) continue;
    const id = 'mermaid-' + Math.random().toString(36).slice(2);
    const rendered = await mermaid.render(id, source);
    block.innerHTML = rendered.svg;
  }
}

async function setupCodeCards() {
  const blocks = document.querySelectorAll('[data-code-card]');
  if (blocks.length === 0) return;
  const shiki = await import('https://cdn.jsdelivr.net/npm/shiki@3.12.2/dist/index.mjs');
  for (const block of blocks) {
    const source = block.getAttribute('data-code-source') || '';
    const lang = block.getAttribute('data-code-lang') || 'text';
    const html = await shiki.codeToHtml(source, { lang, theme: 'github-dark' });
    block.innerHTML = html;
  }
}

function setupCharts() {
  const blocks = document.querySelectorAll('canvas[data-chart-config]');
  if (blocks.length === 0) return;
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js';
  script.onload = () => {
    for (const block of blocks) {
      const config = block.getAttribute('data-chart-config');
      if (!config) continue;
      // @ts-ignore
      new window.Chart(block, JSON.parse(config));
    }
  };
  document.head.appendChild(script);
}

setupTabs();
setupViewToggle();
setupFilter();
setupTheme();
setupMermaid().catch(() => {});
setupCodeCards().catch(() => {});
setupCharts();
document.documentElement.setAttribute('data-iris-js', 'ready');
