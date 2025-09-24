// Minimal helpers for list pages (render table, pagination, sorting, search)
window.ListPage = {
  renderRows(tbody, rows, renderFn) {
    tbody.innerHTML = rows.map(renderFn).join('');
  },
  renderPagination(container, page, totalPages, onPage) {
    const btn = (p, label = p, cls = 'page') => `<button data-page="${p}" class="${cls} ${p===page?'active':''}">${label}</button>`;
    const items = [];
    // Always render controls (even if one page) for consistency
    items.push(btn(Math.max(1, page-1), '«', 'nav'));
    const start = Math.max(1, page-2), end = Math.min(totalPages, page+2);
    for (let p = start; p <= end; p++) items.push(btn(p));
    items.push(btn(Math.min(totalPages, page+1), '»', 'nav'));
    container.innerHTML = items.join('');
    container.querySelectorAll('button[data-page]')
      .forEach(el => el.addEventListener('click', () => onPage(parseInt(el.dataset.page))));
  },
  attachSortHandlers(thead, current, onSort) {
    thead.querySelectorAll('[data-sort]')
      .forEach(th => th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        const order = current.field === field && current.order === 'DESC' ? 'ASC' : 'DESC';
        onSort(field, order);
      }));
  }
};


