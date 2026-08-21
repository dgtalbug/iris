
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

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const editing = target instanceof HTMLElement && (
      target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
    );
    if (editing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === '/') {
      const input = document.querySelector('[data-filter-input]');
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

setupTabs();
setupViewToggle();
setupFilter();
setupTheme();
setupKeyboardShortcuts();
setupCardNavigation();
document.documentElement.setAttribute('data-iris-js', 'ready');
