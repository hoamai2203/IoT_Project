(() => {
  const tbody = document.getElementById('sensorTbody');
  if (!tbody) return;

  const paginationEl = document.getElementById('sensorPagination');
  const thead = document.querySelector('#sensorTable thead');
  const searchInput = document.getElementById('sensorSearchInput');
  const searchBtn = document.getElementById('sensorSearchBtn');
  const fieldSelect = document.getElementById('sensorFieldSelect');

  const state = { page: 1, limit: 10, sortField: 'created_at', sortOrder: 'DESC', searchValue: '', searchField: '' };
  const fmt = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d)) return '';
    return d.toLocaleString('vi-VN');
  };

  async function load() {
    const params = { page: state.page, limit: state.limit, sortField: state.sortField, sortOrder: state.sortOrder };
    if (state.searchValue && state.searchField) {
      const res = await API.sensors.search(state.searchValue, state.searchField, params);
      if (res && res.success) render(res.data, res.pagination); else render([], { page: 1, totalPages: 1 });
      return;
    }
    const res = await API.sensors.getData(params);
    if (res && res.success) render(res.data, res.pagination); else render([], { page: 1, totalPages: 1 });
  }

  function render(rows, pagination) {
    ListPage.renderRows(tbody, rows, r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.temperature ?? ''}</td>
        <td>${r.humidity ?? ''}</td>
        <td>${r.light_intensity ?? ''}</td>
        <td>${fmt(r.created_at)}</td>
      </tr>
    `);
    ListPage.renderPagination(paginationEl, pagination.page, pagination.totalPages, (p) => { state.page = p; load(); });
  }

  // events
  ListPage.attachSortHandlers(thead, { field: state.sortField, order: state.sortOrder }, (f, o) => {
    state.sortField = f; state.sortOrder = o; state.page = 1; load();
  });
  searchBtn.addEventListener('click', () => {
    state.searchValue = (searchInput.value || '').trim();
    state.searchField = fieldSelect.value || '';
    state.page = 1; load();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      state.searchValue = (searchInput.value || '').trim();
      state.searchField = fieldSelect.value || '';
      state.page = 1; load();
    }
  });

  load();
})();


