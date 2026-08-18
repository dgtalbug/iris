
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function drawSignature() {
  const canvas = document.querySelector('[data-signature-canvas]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  const nodes = Array.from({ length: 60 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }));

  const frame = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'hsl(198 90% 57% / 0.9)';
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x <= 0 || n.x >= width) n.vx *= -1;
      if (n.y <= 0 || n.y >= height) n.vy *= -1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 48) {
          ctx.strokeStyle = 'hsl(198 90% 57% / 0.2)';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  };

  if (isReducedMotion) {
    frame();
    return;
  }

  let ticking = true;
  const onVisibility = () => {
    ticking = !document.hidden;
    if (ticking) requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', onVisibility, { passive: true });

  function loop() {
    if (!ticking) return;
    frame();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
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
drawSignature();
setupMermaid();
setupCodeCards();
setupCharts();
