/**
 * مكتبة المصباح - Main Application
 * Handles all UI interactions and page management
 */

const App = {
    // Current state
    state: {
        currentPage: 'dashboard',
        booksPage: 1,
        booksPerPage: 100,
        selectedBooks: new Set(),
        selectedMembers: new Set(),
        filters: {},
        expandedLogEntries: new Set(),
        reportsFilter: 'all',
        reportsPage: 1,
        reportsPerPage: 100,
        authorsPage: 1,
        authorsPerPage: 100,
        userRole: 'viewer'
    },

    isAdmin() {
        return (this.state.userRole || DataManager.getCurrentUserRole?.() || 'viewer') === 'admin';
    },

    canEdit() {
        const r = this.state.userRole || DataManager.getCurrentUserRole?.() || 'viewer';
        return r === 'admin' || r === 'librarian';
    },

    // Field labels for reports (key -> Arabic label)
    REPORT_FIELDS: {
        name: 'اسم الكتاب',
        author: 'المؤلف',
        category: 'القسم',
        cabinet: 'الصندوق',
        editor: 'المحقق',
        publisher: 'دار النشر',
        year: 'السنة',
        shelf: 'الطاق',
        notes: 'ملاحظات',
        parts: 'الأجزاء',
        copies: 'النسخ',
        status: 'الحالة'
    },

    // Initialize the application
    init() {
        this.checkAuth();
        this.bindEvents();
        this.setupBackToTop();
    },

    // ========== AUTHENTICATION ==========
    async checkAuth() {
        await DataManager.ensureReady();
        if (DataManager.isLoggedIn()) {
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.querySelector('.app-container').style.display = 'none';
        const msgEl = document.getElementById('supabase-required-msg');
        if (msgEl) msgEl.style.display = window.SUPABASE_REQUIRED ? 'block' : 'none';
    },

    showApp() {
        document.getElementById('login-page').classList.remove('active');
        document.querySelector('.app-container').style.display = 'flex';
        DataManager.ensureReady().then(() => {
            this.state.userRole = DataManager.getCurrentUserRole ? DataManager.getCurrentUserRole() : 'viewer';
            this.updateNavForRole();
            this.navigateTo('dashboard');
        });
    },

    updateNavForRole() {
        const canEdit = this.canEdit();
        document.querySelectorAll('.nav-item[data-page="settings"], .mobile-nav-card[data-page="settings"]').forEach(el => {
            el.style.display = ''; // Settings visible to all (change password); admin-only sections hidden inside
        });
        document.querySelectorAll('.nav-item[data-page="add-book"], .mobile-nav-card[data-page="add-book"]').forEach(el => {
            el.style.display = canEdit ? '' : 'none';
        });
        document.querySelectorAll('[data-require-role="edit"]').forEach(el => {
            el.style.display = canEdit ? '' : 'none';
        });
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const result = await Promise.resolve(DataManager.login(email, password));
            if (result) {
                this.showApp();
            } else {
                alert('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
            }
        } catch (err) {
            alert(err && err.message ? err.message : 'حدث خطأ. تأكد من إعداد Supabase في js/config.js.');
        }
    },

    async handleLogout() {
        await Promise.resolve(DataManager.logout());
        this.showLogin();
    },

    // ========== NAVIGATION ==========
    navigateTo(page) {
        this.state.currentPage = page;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        document.querySelectorAll('.mobile-nav-card').forEach(card => {
            card.classList.toggle('active', card.dataset.page === page);
        });

        // Show/hide pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `${page}-page`);
        });

        // Close mobile menu
        document.querySelector('.mobile-nav-menu')?.classList.remove('active');

        // Render page content
        this.renderPage(page);
    },

    renderPage(page) {
        switch (page) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'books':
                document.getElementById('global-search-input').value = this.state.globalSearch || '';
                Object.keys(this.state.filters || {}).forEach(column => {
                    const el = document.querySelector(`.filter-input[data-column="${column}"], .filter-select[data-column="${column}"]`);
                    if (el) el.value = this.state.filters[column] || '';
                });
                this.renderBooks();
                break;
            case 'add-book':
                this.renderAddBookForm();
                break;
            case 'loans':
                this.renderLoans();
                break;
            case 'diary':
                this.renderDiary();
                break;
            case 'members':
                this.renderMembers();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'authors':
                this.renderAuthors();
                break;
            case 'publishers':
                this.renderPublishers();
                break;
            case 'reports':
                this.renderReports();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    },

    renderSettings() {
        const isAdmin = this.isAdmin();
        const adminEl = document.getElementById('settings-admin-only');
        const noAccessEl = document.getElementById('settings-no-access');
        if (adminEl) adminEl.style.display = isAdmin ? 'block' : 'none';
        if (noAccessEl) noAccessEl.style.display = isAdmin ? 'none' : 'block';
        if (isAdmin) this.renderSettingsUsers();
    },

    async renderSettingsUsers() {
        const tbody = document.getElementById('users-tbody');
        const hint = document.getElementById('users-table-hint');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (hint) hint.textContent = 'جارٍ التحميل...';
        try {
            const list = await Promise.resolve(DataManager.listProfiles());
            if (hint) hint.textContent = '';
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">لا يوجد مستخدمون مسجلون.</td></tr>';
                return;
            }
            const roleLabels = { admin: 'مدير', librarian: 'أمين المكتبة', viewer: 'مشاهد' };
            tbody.innerHTML = list.map((u, i) => `
                <tr data-user-id="${u.userId}">
                    <td class="col-num">${i + 1}</td>
                    <td>${(u.email || '').replace(/</g, '&lt;')}</td>
                    <td><span class="role-badge role-${u.role}">${roleLabels[u.role] || u.role}</span></td>
                    <td>
                        <select class="user-role-select" data-user-id="${u.userId}" data-current="${u.role}">
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>مدير</option>
                            <option value="librarian" ${u.role === 'librarian' ? 'selected' : ''}>أمين المكتبة</option>
                            <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>مشاهد</option>
                        </select>
                        <button type="button" class="btn btn-sm btn-primary save-role-btn" data-user-id="${u.userId}" style="margin-right: 6px;">حفظ</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('.save-role-btn').forEach(btn => {
                btn.addEventListener('click', () => this.saveUserRole(btn.dataset.userId));
            });
            tbody.querySelectorAll('.user-role-select').forEach(sel => {
                sel.addEventListener('change', () => {
                    const row = sel.closest('tr');
                    const saveBtn = row.querySelector('.save-role-btn');
                    if (saveBtn) saveBtn.style.visibility = sel.value !== sel.dataset.current ? 'visible' : 'hidden';
                });
            });
            tbody.querySelectorAll('.save-role-btn').forEach(btn => {
                btn.style.visibility = btn.previousElementSibling?.value === btn.previousElementSibling?.dataset.current ? 'hidden' : 'visible';
            });
        } catch (e) {
            if (hint) hint.textContent = 'فشل تحميل القائمة: ' + (e?.message || e);
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">خطأ في التحميل.</td></tr>';
        }
    },

    async saveUserRole(userId) {
        const row = document.querySelector(`#users-tbody tr[data-user-id="${userId}"]`);
        const select = row?.querySelector('.user-role-select');
        const btn = row?.querySelector('.save-role-btn');
        if (!select || !userId) return;
        const role = select.value;
        try {
            await Promise.resolve(DataManager.updateUserRole(userId, role));
            select.dataset.current = role;
            if (btn) btn.style.visibility = 'hidden';
            this.state.userRole = DataManager.getCurrentUserRole ? DataManager.getCurrentUserRole() : this.state.userRole;
            this.updateNavForRole();
        } catch (e) {
            alert('فشل تحديث الدور: ' + (e?.message || e));
        }
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const newP = document.getElementById('new-password').value;
        const confirmP = document.getElementById('confirm-password').value;
        if (!newP || newP.length < 6) {
            alert('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
            return;
        }
        if (newP !== confirmP) {
            alert('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
            return;
        }
        try {
            await Promise.resolve(DataManager.updateOwnPassword(newP));
            document.getElementById('change-password-form').reset();
            alert('تم تغيير كلمة المرور بنجاح.');
        } catch (err) {
            alert('فشل تغيير كلمة المرور: ' + (err?.message || err));
        }
    },

    toggleForgotPasswordForm() {
        const form = document.getElementById('forgot-password-form');
        const wrap = document.querySelector('.login-forgot-wrap');
        if (form.style.display === 'none') {
            form.style.display = 'block';
            if (wrap) wrap.style.display = 'none';
            document.getElementById('forgot-email').value = document.getElementById('login-email').value.trim();
        } else {
            form.style.display = 'none';
            if (wrap) wrap.style.display = 'block';
        }
    },

    async handleSendPasswordReset() {
        const email = document.getElementById('forgot-email').value.trim();
        if (!email) {
            alert('أدخل البريد الإلكتروني.');
            return;
        }
        try {
            await Promise.resolve(DataManager.sendPasswordResetEmail(email));
            alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك. راجع صندوق الوارد واتبع الرابط.');
            this.toggleForgotPasswordForm();
        } catch (err) {
            alert('فشل الإرسال: ' + (err?.message || err));
        }
    },

    // ========== DASHBOARD ==========
    renderDashboard() {
        const stats = DataManager.getStats();

        document.getElementById('total-books').textContent = stats.totalBooks;
        document.getElementById('total-authors').textContent = stats.totalAuthors;
        document.getElementById('total-categories').textContent = stats.totalCategories;
        document.getElementById('total-publishers').textContent = stats.totalPublishers != null ? stats.totalPublishers : 0;
        document.getElementById('books-available').textContent = stats.availableBooks;
        document.getElementById('books-issued').textContent = stats.issuedBooks;
        document.getElementById('total-members').textContent = stats.totalMembers;
    },

    // ========== BOOKS ==========
    renderBooks() {
        const books = this.getFilteredBooks();
        const totalPages = Math.ceil(books.length / this.state.booksPerPage) || 1;

        // Ensure current page is valid
        if (this.state.booksPage > totalPages) {
            this.state.booksPage = totalPages;
        }

        const start = (this.state.booksPage - 1) * this.state.booksPerPage;
        const end = start + this.state.booksPerPage;
        const pageBooks = books.slice(start, end);

        const tbody = document.getElementById('books-tbody');
        const showEdit = this.canEdit();
        const emptyColspan = showEdit ? 14 : 12;
        if (pageBooks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${emptyColspan}" class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <p>لا توجد كتب للعرض</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = pageBooks.map((book, index) => {
                const rowNum = start + index + 1;
                const checkboxTd = showEdit ? `<td><input type="checkbox" class="book-checkbox" value="${book.id}" ${this.state.selectedBooks.has(book.id) ? 'checked' : ''}></td>` : '';
                const actionsTd = showEdit ? `<td><div class="action-btns"><button class="btn btn-sm btn-edit" onclick="App.editBook('${book.id}')" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-delete" onclick="App.confirmDeleteBook('${book.id}')" title="حذف"><i class="fas fa-trash"></i></button></div></td>` : '';
                return `
                <tr data-id="${book.id}">
                    ${checkboxTd}
                    <td class="col-num">${rowNum}</td>
                    <td class="book-name-highlight">${(book.name || '-').replace(/</g, '&lt;')}</td>
                    <td>${(book.author || '-').replace(/</g, '&lt;')}</td>
                    <td>${(book.category || '-').replace(/</g, '&lt;')}</td>
                    <td>${(book.editor || '-').replace(/</g, '&lt;')}</td>
                    <td>${book.parts || 1}</td>
                    <td>${(book.publisher || '-').replace(/</g, '&lt;')}</td>
                    <td>${book.year || '-'}</td>
                    <td>${book.copies || 1}</td>
                    <td>
                        <span class="status-badge ${book.status === 'معار' ? 'issued' : 'available'}">
                            ${book.status || 'متاح'}
                        </span>
                    </td>
                    <td>${(book.cabinet || '-').replace(/</g, '&lt;')}</td>
                    <td>${(book.shelf || '-').replace(/</g, '&lt;')}</td>
                    ${actionsTd}
                </tr>
            `;
            }).join('');
        }

        // Update pagination
        document.getElementById('page-info').textContent = `صفحة ${this.state.booksPage} من ${totalPages}`;
        document.getElementById('prev-page').disabled = this.state.booksPage === 1;
        document.getElementById('next-page').disabled = this.state.booksPage === totalPages;
        const lastPageBtn = document.getElementById('last-page');
        if (lastPageBtn) lastPageBtn.disabled = this.state.booksPage === totalPages;

        // Update bulk delete button
        this.updateBulkDeleteButton();
    },

    getFilteredBooks() {
        let books = DataManager.getBooks();
        const filters = this.state.filters;
        const q = (this.state.globalSearch || '').trim().toLowerCase();

        if (q) {
            books = books.filter(book => {
                const name = (book.name || '').toLowerCase();
                const author = (book.author || '').toLowerCase();
                const category = (book.category || '').toLowerCase();
                const publisher = (book.publisher || '').toLowerCase();
                const cabinet = (book.cabinet || '').toLowerCase();
                const shelf = (book.shelf || '').toLowerCase();
                return name.includes(q) || author.includes(q) || category.includes(q) || publisher.includes(q) || cabinet.includes(q) || shelf.includes(q);
            });
        }

        Object.keys(filters).forEach(column => {
            const value = filters[column]?.toLowerCase();
            if (value) {
                books = books.filter(book => {
                    const bookValue = String(book[column] || '').toLowerCase();
                    return bookValue.includes(value);
                });
            }
        });

        return books;
    },

    updateBulkDeleteButton() {
        const bulkBtn = document.getElementById('bulk-delete-btn');
        const count = this.state.selectedBooks.size;
        
        if (count > 0) {
            bulkBtn.style.display = 'inline-flex';
            document.getElementById('selected-count').textContent = count;
        } else {
            bulkBtn.style.display = 'none';
        }
    },

    toggleBookSelection(bookId) {
        if (this.state.selectedBooks.has(bookId)) {
            this.state.selectedBooks.delete(bookId);
        } else {
            this.state.selectedBooks.add(bookId);
        }
        this.updateBulkDeleteButton();
    },

    toggleAllBooks(checked) {
        const checkboxes = document.querySelectorAll('.book-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            if (checked) {
                this.state.selectedBooks.add(cb.value);
            } else {
                this.state.selectedBooks.delete(cb.value);
            }
        });
        this.updateBulkDeleteButton();
    },

    confirmDeleteBook(bookId) {
        this.showConfirmModal('هل أنت متأكد من حذف هذا الكتاب؟', async () => {
            await Promise.resolve(DataManager.deleteBook(bookId));
            this.state.selectedBooks.delete(bookId);
            this.renderBooks();
            this.renderDashboard();
        });
    },

    confirmBulkDeleteBooks() {
        const count = this.state.selectedBooks.size;
        this.showConfirmModal(`هل أنت متأكد من حذف ${count} كتاب؟`, async () => {
            await Promise.resolve(DataManager.deleteBooks(Array.from(this.state.selectedBooks)));
            this.state.selectedBooks.clear();
            this.renderBooks();
            this.renderDashboard();
        });
    },

    editBook(bookId) {
        const book = DataManager.getBookById(bookId);
        if (!book) return;

        const categories = DataManager.getCategories();
        const publishers = DataManager.getPublishers();

        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'تعديل الكتاب';

        modalBody.innerHTML = `
            <form id="edit-book-form">
                <div class="form-group">
                    <label>اسم الكتاب <span class="required">*</span></label>
                    <input type="text" name="name" value="${book.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>المؤلف <span class="required">*</span></label>
                    <input type="text" name="author" value="${book.author || ''}" required>
                </div>
                <div class="form-group">
                    <label>الصندوق <span class="required">*</span></label>
                    <input type="text" name="cabinet" value="${book.cabinet || ''}" required>
                </div>
                <div class="form-group">
                    <label>الطاق</label>
                    <input type="text" name="shelf" value="${book.shelf || ''}">
                </div>
                <div class="form-group">
                    <label>القسم <span class="required">*</span></label>
                    <select name="category" required>
                        <option value="">اختر القسم</option>
                        ${categories.map(c => `<option value="${c}" ${c === book.category ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>المحقق</label>
                    <input type="text" name="editor" value="${book.editor || ''}">
                </div>
                <div class="form-group">
                    <label>عدد الأجزاء</label>
                    <input type="number" name="parts" value="${book.parts || 1}" min="1">
                </div>
                <div class="form-group">
                    <label>دار النشر</label>
                    <select name="publisher">
                        <option value="">اختر...</option>
                        ${publishers.map(p => `<option value="${p}" ${p === book.publisher ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>سنة النشر</label>
                    <input type="number" name="year" value="${book.year || ''}">
                </div>
                <div class="form-group">
                    <label>عدد النسخ</label>
                    <input type="number" name="copies" value="${book.copies || 1}" min="1">
                </div>
                <div class="form-group">
                    <label>الحالة</label>
                    <select name="status">
                        <option value="متاح" ${book.status === 'متاح' ? 'selected' : ''}>متاح</option>
                        <option value="معار" ${book.status === 'معار' ? 'selected' : ''}>معار</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ملاحظات</label>
                    <textarea name="notes" rows="2">${book.notes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
                </div>
            </form>
        `;

        document.getElementById('edit-book-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData);
            await Promise.resolve(DataManager.updateBook(bookId, updatedData));
            this.closeModal();
            this.renderBooks();
            this.renderDashboard();
            this.renderReports();
        };

        this.openModal();
    },

    // ========== ADD BOOK ==========
    renderAddBookForm() {
        // Populate categories dropdown
        const categorySelect = document.getElementById('book-category');
        const categories = DataManager.getCategories();
        categorySelect.innerHTML = '<option value="">اختر القسم</option>' +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');

        // Populate publishers dropdown
        const publisherSelect = document.getElementById('book-publisher');
        const publishers = DataManager.getPublishers();
        publisherSelect.innerHTML = '<option value="">اختر دار النشر</option>' +
            publishers.map(p => `<option value="${p}">${p}</option>`).join('');
    },

    async handleAddBook(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const book = {
            name: formData.get('bookName'),
            author: formData.get('author'),
            category: formData.get('category'),
            editor: formData.get('editor') || '',
            parts: parseInt(formData.get('parts')) || 1,
            publisher: formData.get('publisher') || '',
            year: formData.get('year') || '',
            copies: parseInt(formData.get('copies')) || 1,
            status: formData.get('status') || 'متاح',
            cabinet: formData.get('cabinet') || '',
            shelf: formData.get('shelf') || '',
            notes: formData.get('notes') || ''
        };

        const existing = DataManager.getBooks().find(b =>
            (b.name || '').trim().toLowerCase() === (book.name || '').trim().toLowerCase() &&
            (b.author || '').trim().toLowerCase() === (book.author || '').trim().toLowerCase()
        );
        if (existing && !confirm(`كتاب مشابه موجود: "${existing.name}" - ${existing.author}.\nهل تريد الإضافة رغم ذلك؟`)) {
            return;
        }

        await Promise.resolve(DataManager.addBook(book));
        form.reset();
        alert('تمت إضافة الكتاب بنجاح!');
        this.navigateTo('books');
    },

    // ========== CSV IMPORT/EXPORT ==========
    exportToCSV() {
        const csv = DataManager.exportBooksToCSV();
        if (!csv) {
            alert('لا توجد كتب للتصدير');
            return;
        }

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `books_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    downloadTemplate() {
        const template = DataManager.getCSVTemplate();
        const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'books_template.csv';
        link.click();
    },

    triggerCSVImport() {
        document.getElementById('csv-file-input').click();
    },

    handleCSVImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const overlay = document.getElementById('csv-import-overlay');
        const progressText = document.getElementById('csv-import-progress-text');
        const progressBar = document.getElementById('csv-import-progress-bar');
        const onProgress = (done, total) => {
            if (progressText) progressText.textContent = done + ' من ' + total;
            if (progressBar) progressBar.style.width = (total ? Math.min(100, (100 * done) / total) : 0) + '%';
        };

        const reader = new FileReader();
        reader.onload = async (event) => {
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            if (progressText) progressText.textContent = '0 من 0';
            if (progressBar) progressBar.style.width = '0%';
            try {
                const result = await Promise.resolve(DataManager.importBooksFromCSV(event.target.result, onProgress));
                if (result.success) {
                    const totalBooks = DataManager.getBooks().length;
                    let msg = '✅ تم استيراد CSV بنجاح!\n\n';
                    msg += `📥 نتائج الاستيراد:\n`;
                    msg += `• كتب جديدة: ${result.count}\n`;
                    msg += `• كتب محدّثة: ${result.updatedCount} (تغيّرت بياناتها)\n`;
                    msg += `• بدون تغيير: ${result.unchangedCount || 0} (نفس البيانات)\n`;
                    if (result.skipped > 0) msg += `• تم تخطيها: ${result.skipped} (حقول ناقصة)\n`;
                    if (result.failCount > 0) msg += `• فشل: ${result.failCount}\n`;
                    msg += `\n📚 إجمالي الكتب الآن: ${totalBooks}`;
                    if (result.updateDetails && result.updateDetails.length > 0) {
                        msg += `\n\n📝 تفاصيل التحديثات:`;
                        result.updateDetails.slice(0, 10).forEach((item, idx) => {
                            msg += `\n\n${idx + 1}. "${item.bookName}" - ${item.author}`;
                            item.changes.forEach(c => {
                                const oldVal = c.old || '(فارغ)';
                                const newVal = c.new || '(فارغ)';
                                msg += `\n   • ${c.field}: "${oldVal}" ← "${newVal}"`;
                            });
                        });
                        if (result.updateDetails.length > 10) {
                            msg += `\n\n... و ${result.updateDetails.length - 10} كتب أخرى`;
                        }
                    }
                    alert(msg);
                    this.navigateTo('books');
                } else {
                    alert(result.message);
                }
            } catch (err) {
                alert('حدث خطأ أثناء الاستيراد: ' + (err?.message || err));
            } finally {
                overlay.classList.remove('active');
                overlay.setAttribute('aria-hidden', 'true');
            }
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    },

    // ========== LOANS ==========
    renderLoans() {
        const loans = DataManager.getLoans();
        const tbody = document.getElementById('loans-tbody');

        if (loans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>لا توجد إعارات مسجلة</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = loans.map((loan, index) => {
                const book = DataManager.getBookById(loan.bookId);
                const member = DataManager.getMemberById(loan.memberId);

                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${book?.name || 'كتاب محذوف'}</td>
                        <td>${member?.name || 'عضو محذوف'}</td>
                        <td>${loan.loanDate || '-'}</td>
                        <td>${loan.returnDate || '-'}</td>
                        <td>
                            <span class="status-badge ${loan.status === 'معار' ? 'issued' : 'returned'}">
                                ${loan.status}
                            </span>
                        </td>
                        <td>
                            ${this.canEdit() ? `<div class="action-btns">${loan.status === 'معار' ? `<button class="btn btn-sm btn-return" onclick="App.returnLoan('${loan.id}')" title="إرجاع"><i class="fas fa-undo"></i></button>` : ''}<button class="btn btn-sm btn-delete" onclick="App.confirmDeleteLoan('${loan.id}')" title="حذف"><i class="fas fa-trash"></i></button></div>` : '-'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    },

    openLoanModal() {
        const books = DataManager.getBooks().filter(b => b.status !== 'معار');
        const members = DataManager.getMembers();

        if (books.length === 0) {
            alert('لا توجد كتب متاحة للإعارة');
            return;
        }
        if (members.length === 0) {
            alert('يرجى إضافة أعضاء أولاً');
            return;
        }

        const bookSelect = document.getElementById('loan-book');
        bookSelect.innerHTML = '<option value="">اختر الكتاب</option>' +
            books.map(b => `<option value="${b.id}">${b.name} - ${b.author}</option>`).join('');

        const memberSelect = document.getElementById('loan-member');
        memberSelect.innerHTML = '<option value="">اختر العضو</option>' +
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        document.getElementById('loan-date').value = new Date().toISOString().split('T')[0];

        document.getElementById('loan-modal-overlay').classList.add('active');
    },

    closeLoanModal() {
        document.getElementById('loan-modal-overlay').classList.remove('active');
    },

    async handleNewLoan(e) {
        e.preventDefault();
        const bookId = document.getElementById('loan-book').value;
        const memberId = document.getElementById('loan-member').value;
        const loanDate = document.getElementById('loan-date').value;

        const loan = {
            bookId,
            memberId,
            loanDate,
            status: 'معار'
        };

        await Promise.resolve(DataManager.addLoan(loan));
        this.closeLoanModal();
        this.renderLoans();
        this.renderDashboard();
        alert('تمت الإعارة بنجاح!');
    },

    async returnLoan(loanId) {
        await Promise.resolve(DataManager.returnLoan(loanId));
        this.renderLoans();
        this.renderDashboard();
    },

    confirmDeleteLoan(loanId) {
        this.showConfirmModal('هل أنت متأكد من حذف هذا السجل؟', async () => {
            await Promise.resolve(DataManager.deleteLoan(loanId));
            this.renderLoans();
        });
    },

    // ========== DIARY ==========
    renderDiary() {
        const grouped = DataManager.getDiaryGroupedByDate();
        const container = document.getElementById('log-entries');

        const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

        if (dates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>لا توجد يوميات مسجلة</p>
                </div>
            `;
            return;
        }

        let diaryIndex = 0;
        container.innerHTML = dates.map(date => {
            const entries = grouped[date];
            const isExpanded = this.state.expandedLogEntries.has(date);
            const formattedDate = new Date(date).toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <div class="log-entry ${isExpanded ? 'expanded' : ''}" data-date="${date}">
                    <div class="log-entry-header" onclick="App.toggleLogEntry('${date}')">
                        <div class="log-entry-date">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${formattedDate}</span>
                            <span>(${entries.length} إدخال)</span>
                        </div>
                        <button class="log-entry-toggle">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="log-entry-content">
                        ${entries.map(entry => {
                            diaryIndex++;
                            return `
                            <div class="log-item">
                                <span class="log-item-num">${diaryIndex}</span>
                                <div class="log-item-content">
                                    <span class="log-item-category ${this.getCategoryClass(entry.category)}">
                                        ${entry.category}
                                    </span>
                                    <p class="log-item-text">${entry.content}</p>
                                </div>
                                ${this.canEdit() ? `<div class="log-item-actions"><button class="btn btn-sm btn-edit" onclick="App.editDiaryEntry('${entry.id}')" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-delete" onclick="App.confirmDeleteDiaryEntry('${entry.id}')" title="حذف"><i class="fas fa-trash"></i></button></div>` : ''}
                            </div>
                        `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    getCategoryClass(category) {
        const classes = {
            'ضيف': 'guest',
            'صيانة': 'maintenance',
            'شراء': 'purchase',
            'أخرى': 'other'
        };
        return classes[category] || 'other';
    },

    toggleLogEntry(date) {
        if (this.state.expandedLogEntries.has(date)) {
            this.state.expandedLogEntries.delete(date);
        } else {
            this.state.expandedLogEntries.add(date);
        }
        this.renderDiary();
    },

    async handleAddDiaryEntry() {
        const category = document.getElementById('diary-category').value;
        const content = document.getElementById('new-log-entry').value.trim();

        if (!content) {
            alert('يرجى إدخال محتوى اليومية');
            return;
        }

        await Promise.resolve(DataManager.addDiaryEntry({ category, content }));
        document.getElementById('new-log-entry').value = '';
        this.renderDiary();
    },

    editDiaryEntry(entryId) {
        const diary = DataManager.getDiary();
        const entry = diary.find(e => e.id === entryId);
        if (!entry) return;

        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'تعديل اليومية';

        modalBody.innerHTML = `
            <form id="edit-diary-form">
                <div class="form-group">
                    <label>النوع</label>
                    <select name="category">
                        <option value="ضيف" ${entry.category === 'ضيف' ? 'selected' : ''}>ضيف</option>
                        <option value="صيانة" ${entry.category === 'صيانة' ? 'selected' : ''}>صيانة</option>
                        <option value="شراء" ${entry.category === 'شراء' ? 'selected' : ''}>شراء</option>
                        <option value="أخرى" ${entry.category === 'أخرى' ? 'selected' : ''}>أخرى</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>المحتوى</label>
                    <textarea name="content" rows="4" required>${entry.content}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        document.getElementById('edit-diary-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await Promise.resolve(DataManager.updateDiaryEntry(entryId, {
                category: formData.get('category'),
                content: formData.get('content')
            }));
            this.closeModal();
            this.renderDiary();
        };

        this.openModal();
    },

    confirmDeleteDiaryEntry(entryId) {
        this.showConfirmModal('هل أنت متأكد من حذف هذه اليومية؟', async () => {
            await Promise.resolve(DataManager.deleteDiaryEntry(entryId));
            this.renderDiary();
        });
    },

    // ========== MEMBERS ==========
    renderMembers() {
        const members = DataManager.getMembers();
        const container = document.getElementById('members-list');

        if (members.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>لا يوجد أعضاء مسجلين</p>
                </div>
            `;
            document.getElementById('members-bulk-actions').style.display = 'none';
        } else {
            const bulkEl = document.getElementById('members-bulk-actions');
            if (bulkEl) bulkEl.style.display = this.canEdit() ? 'flex' : 'none';
            const showEdit = this.canEdit();
            container.innerHTML = members.map((member, index) => `
                <div class="item-card" data-id="${member.id}">
                    <div class="item-info">
                        <span class="item-number">${index + 1}</span>
                        ${showEdit ? `<input type="checkbox" class="item-checkbox member-checkbox" value="${member.id}" ${this.state.selectedMembers.has(member.id) ? 'checked' : ''}>` : ''}
                        <div class="item-details">
                            <h4>${member.name}</h4>
                            <p>${member.phone || ''} ${member.address ? '• ' + member.address : ''}</p>
                        </div>
                    </div>
                    ${showEdit ? `<div class="item-actions"><button class="btn btn-sm btn-edit" onclick="App.editMember('${member.id}')" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-delete" onclick="App.confirmDeleteMember('${member.id}')" title="حذف"><i class="fas fa-trash"></i></button></div>` : ''}
                </div>
            `).join('');
        }

        this.updateMembersBulkDelete();
    },

    async handleAddMember() {
        const name = document.getElementById('new-member-name').value.trim();
        const phone = document.getElementById('new-member-phone').value.trim();
        const address = document.getElementById('new-member-address').value.trim();

        if (!name) {
            alert('يرجى إدخال اسم العضو');
            return;
        }

        await Promise.resolve(DataManager.addMember({ name, phone, address }));
        document.getElementById('new-member-name').value = '';
        document.getElementById('new-member-phone').value = '';
        document.getElementById('new-member-address').value = '';
        this.renderMembers();
        this.renderDashboard();
    },

    editMember(memberId) {
        const member = DataManager.getMemberById(memberId);
        if (!member) return;

        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'تعديل العضو';

        modalBody.innerHTML = `
            <form id="edit-member-form">
                <div class="form-group">
                    <label>الاسم <span class="required">*</span></label>
                    <input type="text" name="name" value="${member.name}" required>
                </div>
                <div class="form-group">
                    <label>رقم الهاتف</label>
                    <input type="text" name="phone" value="${member.phone || ''}">
                </div>
                <div class="form-group">
                    <label>العنوان</label>
                    <input type="text" name="address" value="${member.address || ''}">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        document.getElementById('edit-member-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await Promise.resolve(DataManager.updateMember(memberId, {
                name: formData.get('name'),
                phone: formData.get('phone'),
                address: formData.get('address')
            }));
            this.closeModal();
            this.renderMembers();
        };

        this.openModal();
    },

    confirmDeleteMember(memberId) {
        const activeLoans = DataManager.getActiveLoans().filter(l => l.memberId === memberId);
        if (activeLoans.length > 0) {
            alert('لا يمكن حذف هذا العضو. يوجد إعارات نشطة له. يرجى إرجاع الكتب أولاً.');
            return;
        }
        this.showConfirmModal('هل أنت متأكد من حذف هذا العضو؟', async () => {
            await Promise.resolve(DataManager.deleteMember(memberId));
            this.state.selectedMembers.delete(memberId);
            this.renderMembers();
            this.renderDashboard();
        });
    },

    toggleMemberSelection(memberId) {
        if (this.state.selectedMembers.has(memberId)) {
            this.state.selectedMembers.delete(memberId);
        } else {
            this.state.selectedMembers.add(memberId);
        }
        this.updateMembersBulkDelete();
    },

    toggleAllMembers(checked) {
        const checkboxes = document.querySelectorAll('.member-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            if (checked) {
                this.state.selectedMembers.add(cb.value);
            } else {
                this.state.selectedMembers.delete(cb.value);
            }
        });
        this.updateMembersBulkDelete();
    },

    updateMembersBulkDelete() {
        const count = this.state.selectedMembers.size;
        document.getElementById('selected-members-count').textContent = count;
        document.getElementById('bulk-delete-members-btn').style.display = count > 0 ? 'inline-flex' : 'none';
    },

    confirmBulkDeleteMembers() {
        const ids = Array.from(this.state.selectedMembers);
        const withActive = ids.filter(id => DataManager.getActiveLoans().some(l => l.memberId === id));
        const canDelete = ids.filter(id => !withActive.includes(id));
        if (withActive.length > 0) {
            alert(`لا يمكن حذف ${withActive.length} عضو/أعضاء لأن لديهم إعارات نشطة. يرجى إرجاع الكتب أولاً.\n\nسيتم حذف ${canDelete.length} عضو فقط.`);
            if (canDelete.length === 0) return;
            this.showConfirmModal(`حذف ${canDelete.length} عضو؟`, async () => {
                await Promise.resolve(DataManager.deleteMembers(canDelete));
                this.state.selectedMembers.clear();
                this.renderMembers();
                this.renderDashboard();
            });
            return;
        }
        this.showConfirmModal(`هل أنت متأكد من حذف ${ids.length} عضو؟`, async () => {
            await Promise.resolve(DataManager.deleteMembers(ids));
            this.state.selectedMembers.clear();
            this.renderMembers();
            this.renderDashboard();
        });
    },

    // ========== CATEGORIES ==========
    renderCategories() {
        const categories = DataManager.getCategories();
        const container = document.getElementById('categories-list');

        const showEdit = this.canEdit();
        container.innerHTML = categories.map((category, index) => `
            <div class="item-card">
                <div class="item-info">
                    <span class="item-number">${index + 1}</span>
                    <div class="item-details">
                        <h4>${category}</h4>
                    </div>
                </div>
                ${showEdit ? `<div class="item-actions"><button class="btn btn-sm btn-edit" onclick="App.editCategory('${category.replace(/'/g, "\\'")}')" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-delete" onclick="App.confirmDeleteCategory('${category.replace(/'/g, "\\'")}')" title="حذف"><i class="fas fa-trash"></i></button></div>` : ''}
            </div>
        `).join('');
    },

    async handleAddCategory() {
        const input = document.getElementById('new-category');
        const name = input.value.trim();

        if (!name) {
            alert('يرجى إدخال اسم القسم');
            return;
        }

        const ok = await Promise.resolve(DataManager.addCategory(name));
        if (ok) {
            input.value = '';
            this.renderCategories();
            this.renderDashboard();
        } else {
            alert('هذا القسم موجود مسبقاً');
        }
    },

    editCategory(oldName) {
        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'تعديل القسم';

        modalBody.innerHTML = `
            <form id="edit-category-form">
                <div class="form-group">
                    <label>اسم القسم <span class="required">*</span></label>
                    <input type="text" name="name" value="${oldName}" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        document.getElementById('edit-category-form').onsubmit = async (e) => {
            e.preventDefault();
            const newName = new FormData(e.target).get('name');
            const ok = await Promise.resolve(DataManager.updateCategory(oldName, newName));
            if (ok) {
                this.closeModal();
                this.renderCategories();
            } else {
                alert('فشل في تحديث القسم');
            }
        };

        this.openModal();
    },

    confirmDeleteCategory(category) {
        this.showConfirmModal(`هل أنت متأكد من حذف القسم "${category}"؟`, async () => {
            await Promise.resolve(DataManager.deleteCategory(category));
            this.renderCategories();
            this.renderDashboard();
        });
    },

    // ========== AUTHORS (WRITERS) ==========
    renderAuthors() {
        const books = DataManager.getBooks();
        const byAuthor = {};
        books.forEach(b => {
            const name = (b.author || '').trim();
            if (name) byAuthor[name] = (byAuthor[name] || 0) + 1;
        });
        const allAuthors = Object.keys(byAuthor).sort((a, b) => a.localeCompare(b, 'ar'));
        const totalPages = Math.max(1, Math.ceil(allAuthors.length / this.state.authorsPerPage));
        if (this.state.authorsPage > totalPages) this.state.authorsPage = totalPages;
        const start = (this.state.authorsPage - 1) * this.state.authorsPerPage;
        const end = start + this.state.authorsPerPage;
        const pageAuthors = allAuthors.slice(start, end);

        const container = document.getElementById('authors-list');
        const paginationEl = document.getElementById('authors-pagination');
        const pageInfoEl = document.getElementById('authors-page-info');
        const footerEl = document.getElementById('authors-footer');
        const prevBtn = document.getElementById('authors-prev-page');
        const nextBtn = document.getElementById('authors-next-page');
        const lastBtn = document.getElementById('authors-last-page');
        if (!container) return;

        if (allAuthors.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-edit"></i>
                    <p>لا يوجد مؤلفون مسجلون. ستظهر أسماء المؤلفين هنا عند إضافة كتب.</p>
                </div>
            `;
            if (paginationEl) paginationEl.style.display = 'none';
            if (footerEl) footerEl.textContent = '';
            return;
        }
        if (paginationEl) paginationEl.style.display = 'flex';
        container.innerHTML = pageAuthors.map((author, i) => {
            const count = byAuthor[author];
            const rowNum = start + i + 1;
            const dataAuthor = (author || '').replace(/"/g, '&quot;');
            return `
            <div class="item-card item-card-clickable" data-author="${dataAuthor}" role="button" tabindex="0" title="عرض كتب هذا المؤلف">
                <div class="item-info">
                    <span class="item-number">${rowNum}</span>
                    <div class="item-details">
                        <h4>${author.replace(/</g, '&lt;')}</h4>
                        <p class="item-meta">${count} كتاب</p>
                    </div>
                </div>
                <div class="item-actions">
                    <span class="btn btn-sm btn-secondary"><i class="fas fa-book-open"></i> عرض الكتب</span>
                </div>
            </div>
            `;
        }).join('');

        if (pageInfoEl) pageInfoEl.textContent = `صفحة ${this.state.authorsPage} من ${totalPages}`;
        if (footerEl) footerEl.textContent = `عرض ${start + 1} - ${start + pageAuthors.length} من ${allAuthors.length} مؤلف.`;
        if (prevBtn) prevBtn.disabled = this.state.authorsPage === 1;
        if (nextBtn) nextBtn.disabled = this.state.authorsPage === totalPages;
        if (lastBtn) lastBtn.disabled = this.state.authorsPage === totalPages;
    },

    goToBooksByAuthor(authorName) {
        this.state.filters = { author: authorName };
        this.navigateTo('books');
    },

    // ========== PUBLISHERS ==========
    renderPublishers() {
        const publishers = DataManager.getPublishers();
        const container = document.getElementById('publishers-list');

        const showEdit = this.canEdit();
        container.innerHTML = publishers.map((publisher, index) => `
            <div class="item-card">
                <div class="item-info">
                    <span class="item-number">${index + 1}</span>
                    <div class="item-details">
                        <h4>${publisher.replace(/</g, '&lt;')}</h4>
                    </div>
                </div>
                ${showEdit ? `<div class="item-actions"><button class="btn btn-sm btn-edit" onclick="App.editPublisher('${publisher.replace(/'/g, "\\'")}')" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-delete" onclick="App.confirmDeletePublisher('${publisher.replace(/'/g, "\\'")}')" title="حذف"><i class="fas fa-trash"></i></button></div>` : ''}
            </div>
        `).join('');
    },

    async handleAddPublisher() {
        const input = document.getElementById('new-publisher');
        const name = input.value.trim();

        if (!name) {
            alert('يرجى إدخال اسم دار النشر');
            return;
        }

        const ok = await Promise.resolve(DataManager.addPublisher(name));
        if (ok) {
            input.value = '';
            this.renderPublishers();
        } else {
            alert('دار النشر هذه موجودة مسبقاً');
        }
    },

    editPublisher(oldName) {
        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'تعديل دار النشر';

        modalBody.innerHTML = `
            <form id="edit-publisher-form">
                <div class="form-group">
                    <label>اسم دار النشر <span class="required">*</span></label>
                    <input type="text" name="name" value="${oldName}" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        document.getElementById('edit-publisher-form').onsubmit = async (e) => {
            e.preventDefault();
            const newName = new FormData(e.target).get('name');
            const ok = await Promise.resolve(DataManager.updatePublisher(oldName, newName));
            if (ok) {
                this.closeModal();
                this.renderPublishers();
            } else {
                alert('فشل في تحديث دار النشر');
            }
        };

        this.openModal();
    },

    confirmDeletePublisher(publisher) {
        this.showConfirmModal(`هل أنت متأكد من حذف دار النشر "${publisher}"؟`, async () => {
            await Promise.resolve(DataManager.deletePublisher(publisher));
            this.renderPublishers();
        });
    },

    async syncPublishersFromBooks() {
        const result = await Promise.resolve(DataManager.syncPublishersFromBooks());
        this.renderPublishers();
        if (result && result.added > 0) {
            alert(`تمت إضافة ${result.added} دار نشر من قائمة الكتب إلى القائمة.`);
        } else {
            alert('جميع دور النشر الموجودة في الكتب مسجلة مسبقاً في القائمة.');
        }
    },

    // ========== REPORTS ==========
    isBookFieldEmpty(book, key) {
        const v = book[key];
        if (v === undefined || v === null) return true;
        if (typeof v === 'number') return key === 'parts' || key === 'copies' ? (v < 1 || isNaN(v)) : false;
        return String(v).trim() === '';
    },

    getBooksWithMissingInfo() {
        const books = DataManager.getBooks();
        const fields = Object.keys(this.REPORT_FIELDS);
        const rows = [];
        books.forEach(book => {
            const missing = fields.filter(f => this.isBookFieldEmpty(book, f));
            if (missing.length > 0) rows.push({ book, missing });
        });
        return rows;
    },

    getReportSummary() {
        const books = DataManager.getBooks();
        const fields = Object.keys(this.REPORT_FIELDS);
        const missingPerField = {};
        fields.forEach(f => { missingPerField[f] = 0; });
        let complete = 0;
        books.forEach(book => {
            const missing = fields.filter(f => this.isBookFieldEmpty(book, f));
            if (missing.length === 0) complete++;
            missing.forEach(f => { missingPerField[f]++; });
        });
        return { total: books.length, complete, missingPerField };
    },

    renderReports() {
        const summary = this.getReportSummary();
        const currentFilter = this.state.reportsFilter || 'all';
        const summaryEl = document.getElementById('reports-summary');
        if (summaryEl) {
            const missingCount = summary.total - summary.complete;
            const parts = [
                `<div class="report-stat-card"><span class="report-stat-value">${summary.total}</span><span class="report-stat-label">إجمالي الكتب</span></div>`,
                `<div class="report-stat-card"><span class="report-stat-value">${summary.complete}</span><span class="report-stat-label">كتب مكتملة البيانات</span></div>`,
                `<div class="report-stat-card highlight clickable${currentFilter === 'all' ? ' active' : ''}" data-filter="all" role="button" tabindex="0" title="اضغط للتصفية"><span class="report-stat-value">${missingCount}</span><span class="report-stat-label">كتب ناقصة معلومات</span></div>`
            ];
            Object.keys(this.REPORT_FIELDS).forEach(key => {
                const n = summary.missingPerField[key] || 0;
                if (n > 0) {
                    const active = currentFilter === key ? ' active' : '';
                    parts.push(`<div class="report-stat-card small clickable${active}" data-filter="${key}" role="button" tabindex="0" title="اضغط للتصفية"><span class="report-stat-value">${n}</span><span class="report-stat-label">ناقص ${this.REPORT_FIELDS[key]}</span></div>`);
                }
            });
            summaryEl.innerHTML = parts.join('');
        }

        let rows = this.getBooksWithMissingInfo();
        const filter = this.state.reportsFilter || 'all';
        if (filter !== 'all') rows = rows.filter(r => r.missing.includes(filter));

        const totalPages = Math.max(1, Math.ceil(rows.length / this.state.reportsPerPage));
        if (this.state.reportsPage > totalPages) this.state.reportsPage = totalPages;
        const start = (this.state.reportsPage - 1) * this.state.reportsPerPage;
        const end = start + this.state.reportsPerPage;
        const pageRows = rows.slice(start, end);

        const tbody = document.getElementById('reports-tbody');
        const footerEl = document.getElementById('reports-footer');
        const pageInfoEl = document.getElementById('reports-page-info');
        const prevBtn = document.getElementById('reports-prev-page');
        const nextBtn = document.getElementById('reports-next-page');
        const lastBtn = document.getElementById('reports-last-page');
        if (!tbody) return;

        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-check-circle"></i><p>${filter === 'all' ? 'لا توجد كتب ناقصة معلومات.' : 'لا توجد كتب ناقصة الحقل المحدد.'}</p></td></tr>`;
            if (footerEl) footerEl.textContent = '';
            if (pageInfoEl) pageInfoEl.textContent = 'صفحة 1 من 1';
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            if (lastBtn) lastBtn.disabled = true;
        } else {
            const showEdit = this.canEdit();
            tbody.innerHTML = pageRows.map((r, i) => {
                const rowNum = start + i + 1;
                const missingLabels = r.missing.map(m => this.REPORT_FIELDS[m]).join('، ');
                const editTd = showEdit ? `<td><button type="button" class="btn btn-sm btn-edit" onclick="App.editBook('${r.book.id}')" title="تعديل"><i class="fas fa-edit"></i></button></td>` : '<td>-</td>';
                return `<tr>
                    <td class="col-num">${rowNum}</td>
                    <td class="book-name-highlight">${(r.book.name || '-').replace(/</g, '&lt;')}</td>
                    <td>${(r.book.author || '-').replace(/</g, '&lt;')}</td>
                    <td>${(r.book.category || '-').replace(/</g, '&lt;')}</td>
                    <td class="missing-fields-cell">${missingLabels.replace(/</g, '&lt;')}</td>
                    ${editTd}
                </tr>`;
            }).join('');
            if (footerEl) footerEl.textContent = `عرض ${start + 1} - ${start + pageRows.length} من ${rows.length} كتاب.`;
            if (pageInfoEl) pageInfoEl.textContent = `صفحة ${this.state.reportsPage} من ${totalPages}`;
            if (prevBtn) prevBtn.disabled = this.state.reportsPage === 1;
            if (nextBtn) nextBtn.disabled = this.state.reportsPage === totalPages;
            if (lastBtn) lastBtn.disabled = this.state.reportsPage === totalPages;
        }
    },

    exportReportCSV() {
        let rows = this.getBooksWithMissingInfo();
        const filter = this.state.reportsFilter || 'all';
        if (filter !== 'all') rows = rows.filter(r => r.missing.includes(filter));
        if (rows.length === 0) {
            alert('لا يوجد ما يتم تصديره.');
            return;
        }
        const headers = ['م', 'اسم الكتاب', 'المؤلف', 'القسم', 'الحقول الناقصة'];
        const csvRows = rows.map((r, i) => {
            const missingLabels = r.missing.map(m => this.REPORT_FIELDS[m]).join('؛ ');
            return [i + 1, r.book.name || '', r.book.author || '', r.book.category || '', missingLabels].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
        });
        const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `تقرير-الكتب-الناقصة-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    },

    // ========== SETTINGS - BACKUP ==========
    exportBackupExcel() {
        const books = document.getElementById('backup-books').checked;
        const members = document.getElementById('backup-members').checked;
        const loans = document.getElementById('backup-loans').checked;
        const diary = document.getElementById('backup-diary').checked;
        if (!books && !members && !loans && !diary) {
            alert('اختر عنصراً واحداً على الأقل للتصدير.');
            return;
        }
        if (typeof XLSX === 'undefined') {
            alert('مكتبة Excel غير متوفرة.');
            return;
        }
        const wb = XLSX.utils.book_new();
        if (books) {
            const bookList = DataManager.getBooks();
            const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الصندوق', 'الطاق', 'ملاحظات'];
            const rows = bookList.map(b => [b.name || '', b.author || '', b.category || '', b.editor || '', b.parts || '', b.publisher || '', b.year || '', b.copies || '', b.status || '', b.cabinet || '', b.shelf || '', b.notes || '']);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws, 'الكتب');
        }
        if (members) {
            const memberList = DataManager.getMembers();
            const headers = ['الاسم', 'رقم الهاتف', 'العنوان'];
            const rows = memberList.map(m => [m.name || '', m.phone || '', m.address || '']);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws, 'الأعضاء');
        }
        if (loans) {
            const loanList = DataManager.getLoans();
            const bookList = DataManager.getBooks();
            const memberList = DataManager.getMembers();
            const getBookName = id => (bookList.find(b => b.id === id) || {}).name || '-';
            const getMemberName = id => (memberList.find(m => m.id === id) || {}).name || '-';
            const headers = ['الكتاب', 'العضو', 'تاريخ الإعارة', 'تاريخ الإرجاع', 'الحالة'];
            const rows = loanList.map(l => [getBookName(l.bookId), getMemberName(l.memberId), l.loanDate || '', l.returnDate || '', l.status || '']);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws, 'الإعارات');
        }
        if (diary) {
            const diaryList = DataManager.getDiary();
            const headers = ['التاريخ', 'النوع', 'المحتوى'];
            const rows = diaryList.map(d => [d.date || '', d.category || '', (d.content || d.details || '')]);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws, 'اليوميات');
        }
        const name = `backup_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, name);
        alert('تم تصدير النسخة الاحتياطية بنجاح.');
    },

    // ========== MODALS ==========
    openModal() {
        document.getElementById('modal-overlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    showConfirmModal(message, onConfirm) {
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-modal-overlay').classList.add('active');

        document.getElementById('confirm-ok').onclick = () => {
            onConfirm();
            document.getElementById('confirm-modal-overlay').classList.remove('active');
        };

        document.getElementById('confirm-cancel').onclick = () => {
            document.getElementById('confirm-modal-overlay').classList.remove('active');
        };
    },

    // ========== BACK TO TOP ==========
    setupBackToTop() {
        const btn = document.getElementById('back-to-top');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    // ========== EVENT BINDING ==========
    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('forgot-password-btn').addEventListener('click', () => this.toggleForgotPasswordForm());
        document.getElementById('forgot-cancel-btn').addEventListener('click', () => this.toggleForgotPasswordForm());
        document.getElementById('send-reset-btn').addEventListener('click', () => this.handleSendPasswordReset());
        document.getElementById('change-password-form').addEventListener('submit', (e) => this.handleChangePassword(e));
        // Keep legacy id for logout if present

        // Logout buttons (desktop + mobile)
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        const mobileLogoutBtn = document.getElementById('logout-btn-mobile');
        if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', () => this.handleLogout());

        // Navigation items (desktop)
        document.querySelectorAll('.navbar-menu .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        // Navigation items (mobile)
        document.querySelectorAll('.mobile-nav-card').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        // Mobile menu toggle
        document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
            document.querySelector('.mobile-nav-menu').classList.toggle('active');
        });

        // Add book form
        document.getElementById('add-book-form').addEventListener('submit', (e) => this.handleAddBook(e));

        // CSV buttons
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('import-csv-btn').addEventListener('click', () => this.triggerCSVImport());
        document.getElementById('download-template-btn').addEventListener('click', () => this.downloadTemplate());
        document.getElementById('csv-file-input').addEventListener('change', (e) => this.handleCSVImport(e));

        // Books table events
        document.getElementById('select-all-books').addEventListener('change', (e) => {
            this.toggleAllBooks(e.target.checked);
        });

        document.getElementById('books-tbody').addEventListener('change', (e) => {
            if (e.target.classList.contains('book-checkbox')) {
                this.toggleBookSelection(e.target.value);
            }
        });

        document.getElementById('bulk-delete-btn').addEventListener('click', () => this.confirmBulkDeleteBooks());

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.state.booksPage > 1) {
                this.state.booksPage--;
                this.renderBooks();
            }
        });

        document.getElementById('next-page').addEventListener('click', () => {
            const books = this.getFilteredBooks();
            const totalPages = Math.ceil(books.length / this.state.booksPerPage);
            if (this.state.booksPage < totalPages) {
                this.state.booksPage++;
                this.renderBooks();
            }
        });

        document.getElementById('last-page').addEventListener('click', () => {
            const books = this.getFilteredBooks();
            const totalPages = Math.ceil(books.length / this.state.booksPerPage) || 1;
            if (this.state.booksPage !== totalPages) {
                this.state.booksPage = totalPages;
                this.renderBooks();
            }
        });

        // Filter inputs
        document.querySelectorAll('.filter-input, .filter-select').forEach(input => {
            input.addEventListener('input', (e) => {
                const column = e.target.dataset.column;
                this.state.filters[column] = e.target.value;
                this.state.booksPage = 1;
                this.renderBooks();
            });
        });

        // Loans
        document.getElementById('new-loan-btn').addEventListener('click', () => this.openLoanModal());
        document.getElementById('loan-modal-close').addEventListener('click', () => this.closeLoanModal());
        document.getElementById('loan-form').addEventListener('submit', (e) => this.handleNewLoan(e));

        // Diary
        document.getElementById('add-log-btn').addEventListener('click', () => this.handleAddDiaryEntry());

        // Members
        document.getElementById('add-member-btn').addEventListener('click', () => this.handleAddMember());
        document.getElementById('select-all-members').addEventListener('change', (e) => {
            this.toggleAllMembers(e.target.checked);
        });
        document.getElementById('members-list').addEventListener('change', (e) => {
            if (e.target.classList.contains('member-checkbox')) {
                this.toggleMemberSelection(e.target.value);
            }
        });
        document.getElementById('bulk-delete-members-btn').addEventListener('click', () => this.confirmBulkDeleteMembers());

        // Categories
        document.getElementById('add-category-btn').addEventListener('click', () => this.handleAddCategory());

        // Publishers
        document.getElementById('add-publisher-btn').addEventListener('click', () => this.handleAddPublisher());
        document.getElementById('sync-publishers-from-books-btn').addEventListener('click', () => this.syncPublishersFromBooks());

        // Authors list: click card to open books filtered by that author
        const authorsListEl = document.getElementById('authors-list');
        if (authorsListEl) {
            authorsListEl.addEventListener('click', (e) => {
                const card = e.target.closest('.item-card-clickable[data-author]');
                if (card && card.dataset.author) this.goToBooksByAuthor(card.dataset.author);
            });
            authorsListEl.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const card = e.target.closest('.item-card-clickable[data-author]');
                if (card && card.dataset.author) { e.preventDefault(); this.goToBooksByAuthor(card.dataset.author); }
            });
        }
        document.getElementById('authors-prev-page').addEventListener('click', () => {
            if (this.state.authorsPage > 1) {
                this.state.authorsPage--;
                this.renderAuthors();
            }
        });
        document.getElementById('authors-next-page').addEventListener('click', () => {
            this.state.authorsPage++;
            this.renderAuthors();
        });
        document.getElementById('authors-last-page').addEventListener('click', () => {
            this.state.authorsPage = 999999;
            this.renderAuthors();
        });

        // Reports: clickable filter cards (event delegation)
        const reportsSummaryEl = document.getElementById('reports-summary');
        if (reportsSummaryEl) {
            reportsSummaryEl.addEventListener('click', (e) => {
                const card = e.target.closest('.report-stat-card.clickable');
                if (!card || !card.dataset.filter) return;
                this.state.reportsFilter = card.dataset.filter;
                this.state.reportsPage = 1;
                this.renderReports();
            });
            reportsSummaryEl.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const card = e.target.closest('.report-stat-card.clickable');
                if (!card || !card.dataset.filter) return;
                e.preventDefault();
                this.state.reportsFilter = card.dataset.filter;
                this.state.reportsPage = 1;
                this.renderReports();
            });
        }
        const exportReportBtn = document.getElementById('export-report-btn');
        if (exportReportBtn) exportReportBtn.addEventListener('click', () => this.exportReportCSV());
        document.getElementById('reports-prev-page').addEventListener('click', () => {
            if (this.state.reportsPage > 1) {
                this.state.reportsPage--;
                this.renderReports();
            }
        });
        document.getElementById('reports-next-page').addEventListener('click', () => {
            let rows = this.getBooksWithMissingInfo();
            const filter = this.state.reportsFilter || 'all';
            if (filter !== 'all') rows = rows.filter(r => r.missing.includes(filter));
            const totalPages = Math.max(1, Math.ceil(rows.length / this.state.reportsPerPage));
            if (this.state.reportsPage < totalPages) {
                this.state.reportsPage++;
                this.renderReports();
            }
        });
        document.getElementById('reports-last-page').addEventListener('click', () => {
            let rows = this.getBooksWithMissingInfo();
            const filter = this.state.reportsFilter || 'all';
            if (filter !== 'all') rows = rows.filter(r => r.missing.includes(filter));
            const totalPages = Math.max(1, Math.ceil(rows.length / this.state.reportsPerPage));
            if (this.state.reportsPage !== totalPages) {
                this.state.reportsPage = totalPages;
                this.renderReports();
            }
        });

        // Settings - backup export
        document.getElementById('export-backup-btn').addEventListener('click', () => this.exportBackupExcel());

        // Settings - delete all data
        document.getElementById('delete-all-data-btn').addEventListener('click', () => {
            this.showConfirmModal(
                'هل أنت متأكد من حذف كل البيانات؟ سيتم حذف جميع الكتب والأعضاء والإعارات واليوميات ولا يمكن التراجع.',
                () => {
                    Promise.resolve(DataManager.clearAllData())
                        .then(() => {
                            this.navigateTo('dashboard');
                            this.renderDashboard();
                            this.renderBooks();
                            this.renderMembers();
                            this.renderLoans();
                            this.renderDiary();
                            this.renderCategories();
                            this.renderPublishers();
                            alert('تم حذف كل البيانات.');
                        })
                        .catch(err => alert('حدث خطأ: ' + (err?.message || err)));
                }
            );
        });

        // Global search: icon opens popover, submit runs search and closes popover
        const searchInput = document.getElementById('global-search-input');
        const searchPopover = document.getElementById('search-popover');
        const searchToggle = document.getElementById('global-search-toggle');

        const runSearch = () => {
            const q = searchInput.value.trim();
            this.state.globalSearch = q || '';
            searchPopover.classList.remove('active');
            this.navigateTo('books');
        };

        searchToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = searchPopover.classList.toggle('active');
            searchPopover.setAttribute('aria-hidden', !isOpen);
            if (isOpen) {
                const rect = searchToggle.getBoundingClientRect();
                searchPopover.style.top = (rect.bottom + 6) + 'px';
                searchPopover.style.left = rect.left + 'px';
                searchPopover.style.right = 'auto';
                setTimeout(() => searchInput.focus(), 50);
            }
        });

        document.getElementById('global-search-btn').addEventListener('click', runSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
        });

        document.addEventListener('click', (e) => {
            const insidePopover = searchPopover.contains(e.target);
            const onSearchButton = searchToggle === e.target || searchToggle.contains(e.target);
            if (searchPopover.classList.contains('active') && !insidePopover && !onSearchButton) {
                searchPopover.classList.remove('active');
                searchPopover.setAttribute('aria-hidden', 'true');
            }
        });

        // Modal close buttons
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-overlay')) {
                this.closeModal();
            }
        });

        // Confirm modal backdrop click
        document.getElementById('confirm-modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('confirm-modal-overlay')) {
                document.getElementById('confirm-modal-overlay').classList.remove('active');
            }
        });

        // Loan modal backdrop click
        document.getElementById('loan-modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('loan-modal-overlay')) {
                this.closeLoanModal();
            }
        });

        // Dashboard stat card click (books issued)
        document.getElementById('books-issued-card').addEventListener('click', () => {
            this.state.filters = { status: 'معار' };
            this.navigateTo('books');
            document.querySelector('.filter-select[data-column="status"]').value = 'معار';
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
