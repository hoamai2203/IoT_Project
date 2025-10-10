(() => {
    const tbody = document.getElementById('sensorTbody');
    if (!tbody) return;

    const paginationEl = document.getElementById('sensorPagination');
    const thead = document.querySelector('#sensorTable thead');
    const searchInput = document.getElementById('sensorSearchInput');
    const searchBtn = document.getElementById('sensorSearchBtn');
    const fieldSelect = document.getElementById('sensorFieldSelect');

    const state = { 
        page: 1, 
        limit: 10, 
        sortField: 'created_at', 
        sortOrder: 'DESC', 
        searchValue: '', 
        searchField: '' 
    };

    const fmt = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d)) return '';
        return d.toLocaleString('vi-VN');
    };

    async function load() {
        const params = { 
            page: state.page, 
            limit: state.limit, 
            sortField: state.sortField, 
            sortOrder: state.sortOrder 
        };

        // Nếu có tìm kiếm
        if (state.searchValue && state.searchField) {
            const res = await API.sensors.search(state.searchValue, state.searchField, params);
            if (res && res.success) {
                render(res.data, res.pagination);
            } else {
                render([], { page: 1, totalPages: 1 });
            }
            return;
        }

        // Nếu không có tìm kiếm
        const res = await API.sensors.getData(params);
        if (res && res.success) {
            render(res.data, res.pagination);
        } else {
            render([], { page: 1, totalPages: 1 });
        }

        // Hiển thị icon sắp xếp
        const sortElements = document.querySelectorAll('.sort-field');
        sortElements.forEach(el => {
            const field = el.getAttribute('id');
            if (field === state.sortField) {
                el.innerHTML += genSortElement(state.sortOrder);
            } else {
                el.innerHTML += genSortElement('default');
            }
        });
    }

    function render(rows, pagination) {
        ListPage.renderRows(tbody, rows, r => `
            <tr>
                <td class="sort-field" id="id">${r.id}</td>
                <td class="sort-field" id="temperature">${r.temperature ?? ''}</td>
                <td class="sort-field" id="humidity">${r.humidity ?? ''}</td>
                <td class="sort-field" id="light_intensity">${r.light_intensity ?? ''}</td>
                <td class="sort-field" id="created_at">${fmt(r.created_at)}</td>
            </tr>
        `);

        ListPage.renderPagination(
            paginationEl, 
            pagination.page, 
            pagination.totalPages, 
            (p) => { 
                state.page = p; 
                load(); 
            }
        );
    }

    // Gắn sự kiện sắp xếp
    ListPage.attachSortHandlers(
        thead, 
        { field: state.sortField, order: state.sortOrder }, 
        (f, o) => {
            state.sortField = f;
            state.sortOrder = o;
            state.page = 1;
            load();
        }
    );

    // Gắn sự kiện tìm kiếm
    searchBtn.addEventListener('click', () => {
        state.searchValue = (searchInput.value || '').trim();
        state.searchField = fieldSelect.value || '';
        state.page = 1;
        load();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            state.searchValue = (searchInput.value || '').trim();
            state.searchField = fieldSelect.value || '';
            state.page = 1;
            load();
        }
    });

    // Gọi lần đầu
    load();
})();
