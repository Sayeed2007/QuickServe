/* QuickServe | app core: shared state, helpers, navigation, dashboard, events */
const $ = s => document.querySelector(s);
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const STATUS = ['Pending', 'Preparing', 'Ready', 'Delivered'];
const NEXT = { Pending: 'Start preparing', Preparing: 'Mark ready', Ready: 'Mark delivered' };
const S = { view: 'dashboard', menu: [], orders: [], tables: [], cats: [], cart: [], table: null, cat: 'All', q: '' };
const active = () => S.orders.filter(o => o.status !== 'Completed');
const oid = o => '#' + String(o.id).slice(-4).toUpperCase().padStart(3, '0');
const at = o => new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PAGES = {
  dashboard: ['Dashboard', 'Your café at a glance'],
  menu: ['Menu & Ordering', 'Add items, pick a table, place the order'],
  orders: ['Active Orders', 'Everything still in progress'],
  kitchen: ['Kitchen Display', 'Update preparation status'],
  tables: ['Tables', 'See which tables are free'],
  billing: ['Billing & Receipts', 'Bill delivered orders and review history'],
};
const VIEWS = { dashboard: dash, menu: () => { Menu.render(); Cart.render(); }, orders: Orders.render, kitchen: Kitchen.render, tables: Tables.render, billing: Orders.billing };

const ago = o => { const m = Math.max(0, (Date.now() - new Date(o.createdAt)) / 6e4 | 0); return m < 60 ? m + 'm' : m < 1440 ? (m / 60 | 0) + 'h' : (m / 1440 | 0) + 'd'; };
const mins = o => Math.max(0, (Date.now() - new Date(o.createdAt)) / 6e4 | 0);
const stat = (i, l, v, k = '', s = '') => `<div class="card stat ${k}"><span>${i}</span><b>${v}</b><small>${l}</small>${s ? `<em>${s}</em>` : ''}</div>`;
const COL = { Pending: '#ffb02e', Preparing: '#4da3ff', Ready: '#2bffb0', Delivered: '#a970ff', Completed: '#5b6797' };

function dash() {
  const c = s => S.orders.filter(o => o.status === s).length, A = active(), done = S.orders.filter(o => o.status === 'Completed');
  const occ = new Set(A.map(o => o.table)).size, n = S.tables.length || 15, pct = Math.round(occ / n * 100);
  const rev = done.reduce((a, o) => a + o.total, 0), pipe = A.reduce((a, o) => a + o.total, 0);
  const avg = S.orders.length ? Math.round(S.orders.reduce((a, o) => a + o.total, 0) / S.orders.length) : 0;
  const cnt = {}; S.orders.forEach(o => o.items.forEach(i => cnt[i.name] = (cnt[i.name] || 0) + i.qty));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = top[0]?.[1] || 1, em = Object.fromEntries(S.menu.map(m => [m.name, m.emoji]));
  const all = Object.keys(COL), tot = S.orders.length || 1; let acc = 0;
  const donut = all.map(s => { const p = c(s) / tot * 100, seg = `${COL[s]} ${acc}% ${acc + p}%`; acc += p; return seg; }).join(',');
  const h = new Date().getHours(), hi = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const recent = S.orders.slice(-6).reverse().map(o => `<div class="row feed"><span class="dot" style="--c:${COL[o.status]}"></span><span><b>Table ${o.table}</b> <small>${oid(o)} · ${o.items.reduce((a, i) => a + i.qty, 0)} items · ${ago(o)} ago</small></span><span class="badge ${o.status}">${o.status}</span><b>${inr(o.total)}</b></div>`).join('') || '<p class="empty">No orders yet.</p>';
  $('#v-dashboard').innerHTML = `<div class="card hero"><div><small>${hi.toUpperCase()}, OPERATOR</small><h2>${A.length ? A.length + ' order' + (A.length > 1 ? 's' : '') + ' in the pipeline' : 'All systems idle'}</h2><p>${inr(pipe)} in progress · ${n - occ} of ${n} tables free</p></div><button class="btn" data-view="menu">＋ New order</button></div>
    <div class="stats">${stat('🧾', 'Total orders', S.orders.length)}${stat('⏳', 'Pending', c('Pending'), 'warn')}${stat('🔥', 'Preparing', c('Preparing'), 'info')}${stat('🔔', 'Ready', c('Ready'), 'ok')}${stat('💰', 'Revenue', inr(rev), 'ok', done.length + ' paid')}${stat('📈', 'Avg order', inr(avg), 'info')}</div>
    <div class="three"><div class="card"><h3>Floor load</h3><div class="ringwrap"><div class="ring" style="--p:${pct}"><b>${pct}%</b></div><div><p><b>${occ}</b> occupied</p><p><b>${n - occ}</b> available</p><small>${S.tables.reduce((a, t) => a + t.seats, 0)} total seats</small></div></div></div>
      <div class="card"><h3>Order status mix</h3><div class="ringwrap"><div class="ring multi" style="--g:conic-gradient(${donut})"><b>${S.orders.length}</b></div><div class="key">${all.map(s => `<small><i style="background:${COL[s]}"></i>${s} ${c(s)}</small>`).join('')}</div></div></div>
      <div class="card"><h3>Top sellers</h3>${top.map(([k, v]) => `<div class="bar2"><span>${em[k] || '🍽️'} ${k}</span><div><i style="width:${v / mx * 100}%"></i></div><b>${v}</b></div>`).join('') || '<p class="empty">No sales yet.</p>'}</div></div>
    <div class="card"><div class="row"><h3>Live activity</h3><small>auto-refreshing</small></div>${recent}</div>`;
}

function draw() {
  VIEWS[S.view]();
  $('#nOrders').textContent = active().length || '';
}

function go(v) {
  S.view = v;
  document.querySelectorAll('.view').forEach(e => e.hidden = e.id !== 'v-' + v);
  document.querySelectorAll('.side [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  [$('#title').textContent, $('#sub').textContent] = PAGES[v];
  draw();
}

async function refresh() {
  [S.menu, S.orders, S.tables, S.cats] = await Promise.all(['menu', 'orders', 'tables', 'categories'].map(c => Api.get('/' + c)));
  draw();
}

function toast(msg, type = 'ok') {
  const t = $('#toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.className = '', 2800);
}

Api.onOffline = () => {
  $('#sys').textContent = 'DEMO MODE'; $('#sysSub').textContent = 'Saved in this browser'; $('.sys').classList.add('off');
  const b = $('#banner');
  b.hidden = false;
  b.innerHTML = 'Can’t reach the JSON Server at localhost:3000, so you’re seeing demo data saved in this browser. <button class="link" data-act="retry">Retry connection</button>';
};
Api.onOnline = () => { $('#banner').hidden = true; $('#sys').textContent = 'ONLINE'; $('#sysSub').textContent = 'JSON Server linked'; $('.sys').classList.remove('off'); };

const ACT = {
  add: id => Cart.add(id), inc: id => Cart.change(id, 1), dec: id => Cart.change(id, -1), del: id => Cart.remove(id), clear: () => Cart.remove(),
  table: id => { S.table = S.table == id ? null : +id; Cart.render(); },
  place: () => Cart.place(),
  cat: (_, v) => { S.cat = v; Menu.render(); },
  status: id => Kitchen.advance(id),
  bill: id => Orders.receipt(id), complete: id => Orders.complete(id),
  print: () => window.print(), close: () => $('#receipt').close(),
  retry: () => { Api.retry(); refresh(); },
  tbl: id => { if (active().some(o => o.table == id)) return go('orders'); S.table = +id; go('menu'); },
};

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act],[data-view]');
  if (!t) return;
  if (t.dataset.view) return go(t.dataset.view);
  ACT[t.dataset.act]?.(t.dataset.id, t.dataset.v);
});
$('#search').addEventListener('input', e => { S.q = e.target.value.trim().toLowerCase(); Menu.render(); });

const tick = () => $('#clock').textContent = new Date().toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
tick(); setInterval(tick, 30000);
setInterval(() => S.view !== 'menu' && refresh(), 5000);
setInterval(() => ['kitchen', 'orders'].includes(S.view) && draw(), 30000); // keeps kitchen and orders in sync

go('dashboard');
refresh();
