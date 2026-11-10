/* QuickServe | table floor status */
const Tables = {
  render() {
    const by = {};
    active().forEach(o => by[o.table] = o);
    const busy = S.tables.filter(t => by[t.id]).length;
    $('#v-tables').innerHTML = `<div class="legend"><span class="badge">${Math.round(busy / (S.tables.length || 1) * 100)}% occupancy</span><span class="badge">${S.tables.reduce((a, x) => a + x.seats, 0)} seats</span><span class="badge Ready">${S.tables.length - busy} available</span><span class="badge Pending">${busy} occupied</span></div>
      <div class="tgrid">${S.tables.map(t => { const o = by[t.id]; return `
        <button class="card tbl ${o ? 'busy' : 'free'}" data-act="tbl" data-id="${t.id}"><b>${t.id}</b><span class="seats">${'<i></i>'.repeat(t.seats)}</span><small>${t.seats} seats</small>
        ${o ? `<span class="badge ${o.status}">${o.status}</span><small>${inr(o.total)} · ${ago(o)}</small>` : '<span class="badge Ready">Available</span>'}</button>`; }).join('')}</div>`;
  },
};
