(() => {
  const tbody = document.getElementById('sensorTbody');
  if (!tbody) return;

  const thead = document.querySelector('#sensorTable thead');
  const searchInput = document.getElementById('sensorSearchInput');
  const searchBtn = document.getElementById('sensorSearchBtn');
  const fieldSelect = document.getElementById('sensorFieldSelect');
  const paginationEl = document.getElementById('sensorPagination');

  const state = {
    page: 1,
    limit: 10,
    sortField: 'created_at',
    sortOrder: 'DESC',
    searchValue: '',
    searchField: ''
  };

  // Format thời gian hiển thị
  const fmt = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d) ? ts : d.toLocaleString('vi-VN');
  };

  // Parse input ngày/giờ thành ISO string object {start, end}
  const parseDateInput = (str) => {
    if (!str) return null;
    str = str.trim();

    // Khoảng: hh:mm:ss dd/mm/yyyy - hh:mm:ss dd/mm/yyyy
    if (str.includes('-')) {
      const [startRaw, endRaw] = str.split('-').map(s => s.trim());
      const startObj = parseDateInput(startRaw);
      const endObj = parseDateInput(endRaw);
      return {
        start: startObj.start,
        end: endObj.end
      };
    }

    const parts = str.split(' ');
    let d, t;
    if (parts.length === 2) {
      [t, d] = parts; // hh:mm:ss dd/mm/yyyy
    } else if (parts.length === 1) {
      if (parts[0].includes(':')) t = parts[0]; // chỉ giờ
      else d = parts[0]; // chỉ ngày
    }

    let day = 1, month = 0, year = new Date().getFullYear();
    if (d) {
      const [dd, mm, yyyy] = d.split('/').map(Number);
      day = dd;
      month = mm - 1;
      year = yyyy < 100 ? 2000 + yyyy : yyyy;
    }

    let hh = 0, mi = 0, ss = 0;
    if (t) {
      [hh, mi, ss] = t.split(':').map(Number);
      hh = hh || 0; mi = mi || 0; ss = ss || 0;
    }

    const startDate = new Date(year, month, day, hh, mi, ss);
    let endDate;

    if (t && !d) {
      // Chỉ giờ: khoảng 1 phút
      endDate = new Date(startDate.getTime() + 59 * 1000 + 999);
    } else {
      endDate = startDate;
    }

    return { start: startDate.toISOString(), end: endDate.toISOString() };
  };

  // Hàm load dữ liệu
  async function load() {
    const params = {
      page: state.page,
      limit: state.limit,
      sortField: state.sortField,
      sortOrder: state.sortOrder
    };

    let res;

    if (state.searchValue && state.searchField) {
      if (state.searchField === 'created_at' && typeof state.searchValue === 'object') {
        if (state.searchValue.created_at) {
          if (state.searchValue.created_at.includes('-')) {
            const q = {
              searchField: 'created_at',
              time: state.searchValue.created_at,
              ...params
            };
          } else {
            const q = {
              searchField: 'created_at',
              date: state.searchValue.created_at,
              ...params
            }
          }
          const queryString = new URLSearchParams(q).toString();
          console.log('Query String:', queryString);
          res = await API.get(`/sensors/search/time?${queryString}`);
          if (res && res.success) {
            render(res.data, res.pagination || { page: 1, totalPages: 1 });
          } else {
            render([], { page: 1, totalPages: 1 });
          }
          updateSortIcons();
          return;
        }
        // Tìm theo khoảng thời gian
        const { start, end } = state.searchValue;
        const q = {
          searchField: 'created_at',
          startDate: start || '',
          endDate: end || '',
          ...params
        };
        const queryString = new URLSearchParams(q).toString();
        console.log('Query String:', queryString);
        res = await API.get(`/sensors/search/time?${queryString}`);
      } else {
        // Tìm theo giá trị
        res = await API.sensors.search(state.searchValue, state.searchField, params);
      }
    } else {
      // Mặc định
      res = await API.sensors.getData(params);
    }

    if (res && res.success) {
      render(res.data, res.pagination || { page: 1, totalPages: 1 });
    } else {
      render([], { page: 1, totalPages: 1 });
    }

    updateSortIcons();
  }

  // Render bảng
  function render(rows, pagination) {
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.temperature ?? ''}</td>
        <td>${r.humidity ?? ''}</td>
        <td>${r.light_intensity ?? ''}</td>
        <td>${fmt(r.created_at)}</td>
      `;
      tbody.appendChild(tr);
    });

    // Pagination
    renderPagination(paginationEl, pagination.page, pagination.totalPages, (p) => {
      state.page = p;
      load();
    });
  }

  // Cập nhật biểu tượng sắp xếp
  function updateSortIcons() {
    const headers = thead.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
      const field = th.dataset.sort;
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;

      if (field === state.sortField) {
        icon.textContent = state.sortOrder === 'ASC' ? '▲' : '▼';
        th.classList.add('sorted');
      } else {
        icon.textContent = '⇅';
        th.classList.remove('sorted');
      }
    });
  }

  // Sự kiện click sắp xếp
  thead.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortField === field) {
        state.sortOrder = state.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      } else {
        state.sortField = field;
        state.sortOrder = 'ASC';
      }
      state.page = 1;
      load();
    });
  });

  // Thay đổi placeholder
  fieldSelect.addEventListener('change', () => {
    switch (fieldSelect.value) {
      case 'created_at':
        searchInput.placeholder = 'Nhập giờ: hh:mm:ss hoặc ngày giờ: hh:mm:ss dd/mm/yyyy hoặc khoảng: start - end';
        break;
      case 'temperature':
        searchInput.placeholder = 'Nhập giá trị nhiệt độ cần tìm';
        break;
      case 'humidity':
        searchInput.placeholder = 'Nhập giá trị độ ẩm cần tìm';
        break;
      case 'light_intensity':
        searchInput.placeholder = 'Nhập giá trị ánh sáng cần tìm';
        break;
      default:
        searchInput.placeholder = 'Giá trị cần tìm';
    }
  });

  // Nút tìm kiếm
  searchBtn.addEventListener('click', () => {
    state.searchField = fieldSelect.value;
    const value = searchInput.value.trim();
    if (state.searchField === 'created_at' && value) {
      if (value.includes('-')) {
        const [startRaw, endRaw] = value.split('-').map(s => s.trim());
        const startObj = parseDateInput(startRaw);
        const endObj = parseDateInput(endRaw);
        state.searchValue = {
          start: startObj.start,
          end: endObj.end
        };
      } else if (value.includes(' ')) {
        const dtObj = parseDateInput(value);
        state.searchValue = {
          start: dtObj.start,
          end: dtObj.end
        };
      } else {
        // Only time or date
        state.searchValue = {
          created_at: value
        }
      }
    }
    state.page = 1;
    load();
  });

  // Enter để tìm
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });

  load();

  // Pagination đẹp, hạn chế số nút
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

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push(null);
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        if (i > 1 && i < totalPages) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push(null);
      pages.push(totalPages);
    }

    pages.forEach(p => container.appendChild(createBtn(p === null ? '...' : p, p)));
  }
})();
