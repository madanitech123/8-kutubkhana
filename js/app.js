/**
 * مكتبة المصباح - Main Application
 * Handles all UI interactions and page management
 */

const App = {
    // Current state
    state: {
        currentPage: 'dashboard',
        booksPage: 1,
        booksPerPage: 10,
        selectedBooks: new Set(),
        selectedMembers: new Set(),
        filters: {},
        expandedLogEntries: new Set()
    },

    // Initialize the application
    init() {
        this.checkAuth();
        this.bindEvents();
        this.setupBackToTop();
    },

    // ========== AUTHENTICATION ==========
    checkAuth() {
        if (DataManager.isLoggedIn()) {
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.querySelector('.app-container').style.display = 'none';
    },

    showApp() {
        document.getElementById('login-page').classList.remove('active');
        document.querySelector('.app-container').style.display = 'flex';
        this.navigateTo('dashboard');
    },

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const user = DataManager.login(username, password);
        if (user) {
            this.showApp();
        } else {
            alert('اسم المستخدم أو كلمة المرور غير صحيحة\n\nللتجربة استخدم:\nاسم المستخدم: admin\nكلمة المرور: admin');
        }
    },

    handleLogout() {
        DataManager.logout();
        this.showLogin();
    },

    // ========== NAVIGATION ==========
    navigateTo(page) {
        this.state.currentPage = page;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
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
            case 'publishers':
                this.renderPublishers();
                break;
        }
    },

    // ========== DASHBOARD ==========
    renderDashboard() {
        const stats = DataManager.getStats();

        document.getElementById('total-books').textContent = stats.totalBooks;
        document.getElementById('total-authors').textContent = stats.totalAuthors;
        document.getElementById('total-categories').textContent = stats.totalCategories;
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
        
        if (pageBooks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <p>لا توجد كتب للعرض</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = pageBooks.map((book, index) => `
                <tr data-id="${book.id}">
                    <td>
                        <input type="checkbox" class="book-checkbox" value="${book.id}" 
                            ${this.state.selectedBooks.has(book.id) ? 'checked' : ''}>
                    </td>
                    <td class="book-name-highlight">${book.name || '-'}</td>
                    <td>${book.author || '-'}</td>
                    <td>${book.category || '-'}</td>
                    <td>${book.editor || '-'}</td>
                    <td>${book.parts || 1}</td>
                    <td>${book.publisher || '-'}</td>
                    <td>${book.year || '-'}</td>
                    <td>${book.copies || 1}</td>
                    <td>
                        <span class="status-badge ${book.status === 'معار' ? 'issued' : 'available'}">
                            ${book.status || 'متاح'}
                        </span>
                    </td>
                    <td>${book.cabinet || '-'}</td>
                    <td>${book.shelf || '-'}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-sm btn-edit" onclick="App.editBook('${book.id}')" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-delete" onclick="App.confirmDeleteBook('${book.id}')" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Update pagination
        document.getElementById('page-info').textContent = `صفحة ${this.state.booksPage} من ${totalPages}`;
        document.getElementById('prev-page').disabled = this.state.booksPage === 1;
        document.getElementById('next-page').disabled = this.state.booksPage === totalPages;

        // Update bulk delete button
        this.updateBulkDeleteButton();
    },

    getFilteredBooks() {
        let books = DataManager.getBooks();
        const filters = this.state.filters;

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
        this.showConfirmModal('هل أنت متأكد من حذف هذا الكتاب؟', () => {
            DataManager.deleteBook(bookId);
            this.state.selectedBooks.delete(bookId);
            this.renderBooks();
            this.renderDashboard();
        });
    },

    confirmBulkDeleteBooks() {
        const count = this.state.selectedBooks.size;
        this.showConfirmModal(`هل أنت متأكد من حذف ${count} كتاب؟`, () => {
            DataManager.deleteBooks(Array.from(this.state.selectedBooks));
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
                    <label>التصنيف</label>
                    <select name="category">
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
                    <label>رقم الخزانة</label>
                    <input type="text" name="cabinet" value="${book.cabinet || ''}">
                </div>
                <div class="form-group">
                    <label>رقم الرف</label>
                    <input type="text" name="shelf" value="${book.shelf || ''}">
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

        document.getElementById('edit-book-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData);
            DataManager.updateBook(bookId, updatedData);
            this.closeModal();
            this.renderBooks();
            this.renderDashboard();
        };

        this.openModal();
    },

    // ========== ADD BOOK ==========
    renderAddBookForm() {
        // Populate categories dropdown
        const categorySelect = document.getElementById('book-category');
        const categories = DataManager.getCategories();
        categorySelect.innerHTML = '<option value="">اختر التصنيف</option>' +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');

        // Populate publishers dropdown
        const publisherSelect = document.getElementById('book-publisher');
        const publishers = DataManager.getPublishers();
        publisherSelect.innerHTML = '<option value="">اختر دار النشر</option>' +
            publishers.map(p => `<option value="${p}">${p}</option>`).join('');
    },

    handleAddBook(e) {
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

        DataManager.addBook(book);
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

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = DataManager.importBooksFromCSV(event.target.result);
            if (result.success) {
                alert(`تم استيراد ${result.count} كتاب بنجاح!`);
                this.navigateTo('books');
            } else {
                alert(result.message);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset file input
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
                            <div class="action-btns">
                                ${loan.status === 'معار' ? `
                                    <button class="btn btn-sm btn-return" onclick="App.returnLoan('${loan.id}')" title="إرجاع">
                                        <i class="fas fa-undo"></i>
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-delete" onclick="App.confirmDeleteLoan('${loan.id}')" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
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

    handleNewLoan(e) {
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

        DataManager.addLoan(loan);
        this.closeLoanModal();
        this.renderLoans();
        this.renderDashboard();
        alert('تمت الإعارة بنجاح!');
    },

    returnLoan(loanId) {
        DataManager.returnLoan(loanId);
        this.renderLoans();
        this.renderDashboard();
    },

    confirmDeleteLoan(loanId) {
        this.showConfirmModal('هل أنت متأكد من حذف هذا السجل؟', () => {
            DataManager.deleteLoan(loanId);
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
                        ${entries.map(entry => `
                            <div class="log-item">
                                <div class="log-item-content">
                                    <span class="log-item-category ${this.getCategoryClass(entry.category)}">
                                        ${entry.category}
                                    </span>
                                    <p class="log-item-text">${entry.content}</p>
                                </div>
                                <div class="log-item-actions">
                                    <button class="btn btn-sm btn-edit" onclick="App.editDiaryEntry('${entry.id}')" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-delete" onclick="App.confirmDeleteDiaryEntry('${entry.id}')" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
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

    handleAddDiaryEntry() {
        const category = document.getElementById('diary-category').value;
        const content = document.getElementById('new-log-entry').value.trim();

        if (!content) {
            alert('يرجى إدخال محتوى اليومية');
            return;
        }

        DataManager.addDiaryEntry({ category, content });
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

        document.getElementById('edit-diary-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            DataManager.updateDiaryEntry(entryId, {
                category: formData.get('category'),
                content: formData.get('content')
            });
            this.closeModal();
            this.renderDiary();
        };

        this.openModal();
    },

    confirmDeleteDiaryEntry(entryId) {
        this.showConfirmModal('هل أنت متأكد من حذف هذه اليومية؟', () => {
            DataManager.deleteDiaryEntry(entryId);
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
            document.getElementById('members-bulk-actions').style.display = 'flex';
            container.innerHTML = members.map(member => `
                <div class="item-card" data-id="${member.id}">
                    <div class="item-info">
                        <input type="checkbox" class="item-checkbox member-checkbox" value="${member.id}"
                            ${this.state.selectedMembers.has(member.id) ? 'checked' : ''}>
                        <div class="item-details">
                            <h4>${member.name}</h4>
                            <p>${member.phone || ''} ${member.address ? '• ' + member.address : ''}</p>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-edit" onclick="App.editMember('${member.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="App.confirmDeleteMember('${member.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        this.updateMembersBulkDelete();
    },

    handleAddMember() {
        const name = document.getElementById('new-member-name').value.trim();
        const phone = document.getElementById('new-member-phone').value.trim();
        const address = document.getElementById('new-member-address').value.trim();

        if (!name) {
            alert('يرجى إدخال اسم العضو');
            return;
        }

        DataManager.addMember({ name, phone, address });
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

        document.getElementById('edit-member-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            DataManager.updateMember(memberId, {
                name: formData.get('name'),
                phone: formData.get('phone'),
                address: formData.get('address')
            });
            this.closeModal();
            this.renderMembers();
        };

        this.openModal();
    },

    confirmDeleteMember(memberId) {
        this.showConfirmModal('هل أنت متأكد من حذف هذا العضو؟', () => {
            DataManager.deleteMember(memberId);
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
        const count = this.state.selectedMembers.size;
        this.showConfirmModal(`هل أنت متأكد من حذف ${count} عضو؟`, () => {
            DataManager.deleteMembers(Array.from(this.state.selectedMembers));
            this.state.selectedMembers.clear();
            this.renderMembers();
            this.renderDashboard();
        });
    },

    // ========== CATEGORIES ==========
    renderCategories() {
        const categories = DataManager.getCategories();
        const container = document.getElementById('categories-list');

        container.innerHTML = categories.map(category => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-details">
                        <h4>${category}</h4>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-edit" onclick="App.editCategory('${category}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="App.confirmDeleteCategory('${category}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    handleAddCategory() {
        const input = document.getElementById('new-category');
        const name = input.value.trim();

        if (!name) {
            alert('يرجى إدخال اسم التصنيف');
            return;
        }

        if (DataManager.addCategory(name)) {
            input.value = '';
            this.renderCategories();
            this.renderDashboard();
        } else {
            alert('هذا التصنيف موجود مسبقاً');
        }
    },

    editCategory(oldName) {
        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'تعديل التصنيف';

        modalBody.innerHTML = `
            <form id="edit-category-form">
                <div class="form-group">
                    <label>اسم التصنيف <span class="required">*</span></label>
                    <input type="text" name="name" value="${oldName}" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        document.getElementById('edit-category-form').onsubmit = (e) => {
            e.preventDefault();
            const newName = new FormData(e.target).get('name');
            if (DataManager.updateCategory(oldName, newName)) {
                this.closeModal();
                this.renderCategories();
            } else {
                alert('فشل في تحديث التصنيف');
            }
        };

        this.openModal();
    },

    confirmDeleteCategory(category) {
        this.showConfirmModal(`هل أنت متأكد من حذف التصنيف "${category}"؟`, () => {
            DataManager.deleteCategory(category);
            this.renderCategories();
            this.renderDashboard();
        });
    },

    // ========== PUBLISHERS ==========
    renderPublishers() {
        const publishers = DataManager.getPublishers();
        const container = document.getElementById('publishers-list');

        container.innerHTML = publishers.map(publisher => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-details">
                        <h4>${publisher}</h4>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-edit" onclick="App.editPublisher('${publisher}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="App.confirmDeletePublisher('${publisher}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    handleAddPublisher() {
        const input = document.getElementById('new-publisher');
        const name = input.value.trim();

        if (!name) {
            alert('يرجى إدخال اسم دار النشر');
            return;
        }

        if (DataManager.addPublisher(name)) {
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

        document.getElementById('edit-publisher-form').onsubmit = (e) => {
            e.preventDefault();
            const newName = new FormData(e.target).get('name');
            if (DataManager.updatePublisher(oldName, newName)) {
                this.closeModal();
                this.renderPublishers();
            } else {
                alert('فشل في تحديث دار النشر');
            }
        };

        this.openModal();
    },

    confirmDeletePublisher(publisher) {
        this.showConfirmModal(`هل أنت متأكد من حذف دار النشر "${publisher}"؟`, () => {
            DataManager.deletePublisher(publisher);
            this.renderPublishers();
        });
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

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Navigation items (desktop)
        document.querySelectorAll('.navbar-menu .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        // Navigation items (mobile)
        document.querySelectorAll('.mobile-nav-list .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
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
