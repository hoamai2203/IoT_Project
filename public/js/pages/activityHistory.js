(() => {
  const tbody = document.getElementById('historyTbody');
  const paginationEl = document.getElementById('historyPagination');
  const thead = document.querySelector('#historyTable thead');
  const searchInput = document.getElementById('historySearchInput');
  const searchBtn = document.getElementById('historySearchBtn');
  const fieldSelect = document.getElementById('historyFieldSelect');

  if (!tbody || !paginationEl || !thead) return;

  const state = {
    page: 1,
    limit: 10,
    sortField: 'created_at',
    sortOrder: 'DESC',
    searchValue: '',
    searchField: ''
  };

  const fmt = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d) ? ts : d.toLocaleString('vi-VN');
  };

  const parseDateInput = str => {
    if (!str) return null;
    str = str.trim();

    if (str.includes('-')) {
      const [startRaw, endRaw] = str.split('-').map(s => s.trim());
      const startObj = parseDateInput(startRaw);
      const endObj = parseDateInput(endRaw);
      return { start: startObj.start, end: endObj.end };
    }

    const parts = str.split(' ');
    let d, t;
    if (parts.length === 2) [t, d] = parts;
    else if (parts.length === 1) {
      if (parts[0].includes(':')) t = parts[0];
      else d = parts[0];
    }

    let day = 1, month = 0, year = new Date().getFullYear();
    if (d) {
      const [dd, mm, yyyy] = d.split('/').map(Number);
      day = dd; month = mm - 1; year = yyyy < 100 ? 2000 + yyyy : yyyy;
    }

    let hh = 0, mi = 0, ss = 0;
    if (t) [hh, mi, ss] = t.split(':').map(Number);

    const startDate = new Date(year, month, day, hh, mi, ss);
    const endDate = (t && !d) ? new Date(startDate.getTime() + 59 * 1000 + 999) : startDate;
    return { start: startDate.toISOString(), end: endDate.toISOString() };
  };

  async function load() {
    const params = { page: state.page, limit: state.limit, sortField: state.sortField, sortOrder: state.sortOrder };
    let res;

    if (state.searchValue && state.searchField) {
      if (state.searchField === 'created_at' && typeof state.searchValue === 'object') {
        const { start, end } = state.searchValue;
        const query = new URLSearchParams({ searchField: 'created_at', startDate: start || '', endDate: end || '', ...params }).toString();
        res = await API.get(`/devices/search/time?${query}`);
      } else {
        res = await API.devices.search(state.searchValue, state.searchField, params);
      }
    } else {
      res = await API.devices.getData(params);
    }

    if (res && res.success) render(res.data, res.pagination || { page: 1, totalPages: 1 });
    else render([], { page: 1, totalPages: 1 });

    updateSortIcons();
  }

  function render(rows, pagination) {
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.device_id}</td>
        <td>${r.action}</td>
        <td>${fmt(r.created_at)}</td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination(paginationEl, pagination.page, pagination.totalPages, p => { state.page = p; load(); });
  }

  function updateSortIcons() {
    thead.querySelectorAll('th[data-sort]').forEach(th => {
      let icon = th.querySelector('.sort-icon');
      if (!icon) {
        icon = document.createElement('span');
        icon.classList.add('sort-icon');
        th.appendChild(icon);
      }
      if (th.dataset.sort === state.sortField) {
        icon.textContent = state.sortOrder === 'ASC' ? '▲' : '▼';
      } else icon.textContent = '⇅';
    });
  }

  // Gắn sự kiện click sort
  thead.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortField === field) state.sortOrder = state.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      else { state.sortField = field; state.sortOrder = 'ASC'; }
      state.page = 1;
      load();
    });
  });

  fieldSelect.addEventListener('change', () => {
    switch (fieldSelect.value) {
      case 'created_at': searchInput.placeholder = 'Nhập giờ: hh:mm:ss hoặc ngày giờ: hh:mm:ss dd/mm/yyyy hoặc khoảng: start - end'; break;
      case 'device_id': searchInput.placeholder = 'Nhập ID thiết bị'; break;
      case 'action': searchInput.placeholder = 'Nhập hành động cần tìm'; break;
      default: searchInput.placeholder = 'Giá trị cần tìm';
    }
  });

  searchBtn.addEventListener('click', () => {
    state.searchField = fieldSelect.value;
    const val = searchInput.value.trim();
    state.searchValue = state.searchField === 'created_at' && val ? parseDateInput(val) : val;
    state.page = 1;
    load();
  });

  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchBtn.click(); });

  function renderPagination(container, currentPage, totalPages, onPageClick) {
    container.innerHTML = '';
    const createBtn = (text, page) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.disabled = page === currentPage || page === null;
      if (page) btn.addEventListener('click', () => onPageClick(page));
      return btn;
    };

    const pages = [];
    if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else {
      pages.push(1);
      if (currentPage > 4) pages.push(null);
      for (let i = currentPage - 2; i <= currentPage + 2; i++) if (i > 1 && i < totalPages) pages.push(i);
      if (currentPage < totalPages - 3) pages.push(null);
      pages.push(totalPages);
    }
    pages.forEach(p => container.appendChild(createBtn(p === null ? '...' : p, p)));
  }

  load();
})();
