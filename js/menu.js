/* QuickServe | menu browsing: categories, search, availability */
const Menu = {
  render() {
    const cats = [{ name: 'All', icon: '🍽️' }, ...S.cats];
    $('#chips').innerHTML = cats.map(c => `<button class="chip ${c.name === S.cat ? 'on' : ''}" data-act="cat" data-v="${c.name}">${c.icon} ${c.name}</button>`).join('');
    const sold = {}; S.orders.forEach(o => o.items.forEach(i => sold[i.id] = (sold[i.id] || 0) + i.qty));
    const pop = Object.keys(sold).sort((a, b) => sold[b] - sold[a]).slice(0, 3);
    const list = S.menu.filter(m => (S.cat === 'All' || m.category === S.cat) && m.name.toLowerCase().includes(S.q));
    $('#items').innerHTML = list.map(m => {
      const q = (S.cart.find(l => l.id == m.id) || {}).qty;
      return `<article class="card item ${m.available ? '' : 'off'}"><div class="emo">${m.emoji}${pop.includes(String(m.id)) ? '<span class="hot">🔥 HOT</span>' : ''}</div><h4>${m.name}</h4><small>${m.category}${sold[m.id] ? ' · ' + sold[m.id] + ' sold' : ''}</small>
        <div class="row"><b>${inr(m.price)}</b>${m.available
          ? `<button class="btn sm" data-act="add" data-id="${m.id}">${q ? 'Add (' + q + ')' : 'Add'}</button>`
          : '<span class="badge">Sold out</span>'}</div></article>`;
    }).join('') || '<p class="empty">No items match your search.</p>';
  },
};
