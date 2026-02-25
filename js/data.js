/**
 * مكتبة المصباح - Data Management Module
 * Handles localStorage persistence; switches to Supabase when config is present.
 */

const LocalStorageDataManager = {
    // Storage keys
    KEYS: {
        BOOKS: 'library_books',
        MEMBERS: 'library_members',
        LOANS: 'library_loans',
        DIARY: 'library_diary',
        CATEGORIES: 'library_categories',
        PUBLISHERS: 'library_publishers',
        USER: 'library_user',
        SETTINGS: 'library_settings'
    },

    // Initialize data (no hardcoded defaults; categories/publishers come from Supabase or are empty)
    init() {
        // Initialize empty arrays if not exists
        if (!localStorage.getItem(this.KEYS.BOOKS)) {
            localStorage.setItem(this.KEYS.BOOKS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.MEMBERS)) {
            localStorage.setItem(this.KEYS.MEMBERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.LOANS)) {
            localStorage.setItem(this.KEYS.LOANS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.DIARY)) {
            localStorage.setItem(this.KEYS.DIARY, JSON.stringify([]));
        }
    },

    ensureReady() {
        return Promise.resolve();
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // ========== BOOKS ==========
    getBooks() {
        const data = localStorage.getItem(this.KEYS.BOOKS);
        return data ? JSON.parse(data) : [];
    },

    setBooks(books) {
        localStorage.setItem(this.KEYS.BOOKS, JSON.stringify(books));
    },

    addBook(book) {
        const books = this.getBooks();
        book.id = this.generateId();
        book.createdAt = new Date().toISOString();
        books.push(book);
        this.setBooks(books);
        return book;
    },

    updateBook(id, updatedData) {
        const books = this.getBooks();
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books[index] = { ...books[index], ...updatedData, updatedAt: new Date().toISOString() };
            this.setBooks(books);
            return books[index];
        }
        return null;
    },

    deleteBook(id) {
        const books = this.getBooks();
        const filtered = books.filter(b => b.id !== id);
        this.setBooks(filtered);
        return filtered.length < books.length;
    },

    deleteBooks(ids) {
        const books = this.getBooks();
        const filtered = books.filter(b => !ids.includes(b.id));
        this.setBooks(filtered);
        return books.length - filtered.length;
    },

    getBookById(id) {
        return this.getBooks().find(b => b.id === id);
    },

    // ========== MEMBERS ==========
    getMembers() {
        const data = localStorage.getItem(this.KEYS.MEMBERS);
        return data ? JSON.parse(data) : [];
    },

    setMembers(members) {
        localStorage.setItem(this.KEYS.MEMBERS, JSON.stringify(members));
    },

    addMember(member) {
        const members = this.getMembers();
        member.id = this.generateId();
        member.createdAt = new Date().toISOString();
        members.push(member);
        this.setMembers(members);
        return member;
    },

    updateMember(id, updatedData) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            members[index] = { ...members[index], ...updatedData };
            this.setMembers(members);
            return members[index];
        }
        return null;
    },

    deleteMember(id) {
        const members = this.getMembers();
        const filtered = members.filter(m => m.id !== id);
        this.setMembers(filtered);
        return filtered.length < members.length;
    },

    deleteMembers(ids) {
        const members = this.getMembers();
        const filtered = members.filter(m => !ids.includes(m.id));
        this.setMembers(filtered);
        return members.length - filtered.length;
    },

    getMemberById(id) {
        return this.getMembers().find(m => m.id === id);
    },

    // ========== LOANS ==========
    getLoans() {
        const data = localStorage.getItem(this.KEYS.LOANS);
        return data ? JSON.parse(data) : [];
    },

    setLoans(loans) {
        localStorage.setItem(this.KEYS.LOANS, JSON.stringify(loans));
    },

    addLoan(loan) {
        const loans = this.getLoans();
        loan.id = this.generateId();
        loan.createdAt = new Date().toISOString();
        loans.push(loan);
        this.setLoans(loans);
        
        // Update book status
        this.updateBook(loan.bookId, { status: 'معار' });
        
        return loan;
    },

    returnLoan(id) {
        const loans = this.getLoans();
        const index = loans.findIndex(l => l.id === id);
        if (index !== -1) {
            loans[index].status = 'مُرجع';
            loans[index].returnDate = new Date().toISOString().split('T')[0];
            this.setLoans(loans);
            
            // Update book status
            this.updateBook(loans[index].bookId, { status: 'متاح' });
            
            return loans[index];
        }
        return null;
    },

    deleteLoan(id) {
        const loans = this.getLoans();
        const filtered = loans.filter(l => l.id !== id);
        this.setLoans(filtered);
        return filtered.length < loans.length;
    },

    getLoansByBookId(bookId) {
        return this.getLoans().filter(l => l.bookId === bookId);
    },

    getLoansByMemberId(memberId) {
        return this.getLoans().filter(l => l.memberId === memberId);
    },

    getActiveLoans() {
        return this.getLoans().filter(l => l.status === 'معار');
    },

    // ========== DIARY ==========
    getDiary() {
        const data = localStorage.getItem(this.KEYS.DIARY);
        return data ? JSON.parse(data) : [];
    },

    setDiary(diary) {
        localStorage.setItem(this.KEYS.DIARY, JSON.stringify(diary));
    },

    addDiaryEntry(entry) {
        const diary = this.getDiary();
        entry.id = this.generateId();
        entry.createdAt = new Date().toISOString();
        entry.date = new Date().toISOString().split('T')[0];
        diary.unshift(entry); // Add to beginning
        this.setDiary(diary);
        return entry;
    },

    updateDiaryEntry(id, updatedData) {
        const diary = this.getDiary();
        const index = diary.findIndex(d => d.id === id);
        if (index !== -1) {
            diary[index] = { ...diary[index], ...updatedData };
            this.setDiary(diary);
            return diary[index];
        }
        return null;
    },

    deleteDiaryEntry(id) {
        const diary = this.getDiary();
        const filtered = diary.filter(d => d.id !== id);
        this.setDiary(filtered);
        return filtered.length < diary.length;
    },

    getDiaryGroupedByDate() {
        const diary = this.getDiary();
        const grouped = {};
        
        diary.forEach(entry => {
            const date = entry.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });
        
        return grouped;
    },

    // ========== CATEGORIES ==========
    getCategories() {
        const data = localStorage.getItem(this.KEYS.CATEGORIES);
        return data ? JSON.parse(data) : [];
    },

    setCategories(categories) {
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
    },

    addCategory(category) {
        const categories = this.getCategories();
        if (!categories.includes(category)) {
            categories.push(category);
            this.setCategories(categories);
            return true;
        }
        return false;
    },

    updateCategory(oldName, newName) {
        const categories = this.getCategories();
        const index = categories.indexOf(oldName);
        if (index !== -1) {
            categories[index] = newName;
            this.setCategories(categories);
            
            // Update books with this category
            const books = this.getBooks();
            books.forEach(book => {
                if (book.category === oldName) {
                    book.category = newName;
                }
            });
            this.setBooks(books);
            
            return true;
        }
        return false;
    },

    deleteCategory(category) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c !== category);
        if (filtered.length < categories.length) {
            this.setCategories(filtered);
            return true;
        }
        return false;
    },

    // ========== PUBLISHERS ==========
    getPublishers() {
        const data = localStorage.getItem(this.KEYS.PUBLISHERS);
        return data ? JSON.parse(data) : [];
    },

    setPublishers(publishers) {
        localStorage.setItem(this.KEYS.PUBLISHERS, JSON.stringify(publishers));
    },

    addPublisher(publisher) {
        const publishers = this.getPublishers();
        if (!publishers.includes(publisher)) {
            publishers.push(publisher);
            this.setPublishers(publishers);
            return true;
        }
        return false;
    },

    updatePublisher(oldName, newName) {
        const publishers = this.getPublishers();
        const index = publishers.indexOf(oldName);
        if (index !== -1) {
            publishers[index] = newName;
            this.setPublishers(publishers);
            
            // Update books with this publisher
            const books = this.getBooks();
            books.forEach(book => {
                if (book.publisher === oldName) {
                    book.publisher = newName;
                }
            });
            this.setBooks(books);
            
            return true;
        }
        return false;
    },

    deletePublisher(publisher) {
        const publishers = this.getPublishers();
        const filtered = publishers.filter(p => p !== publisher);
        if (filtered.length < publishers.length) {
            this.setPublishers(filtered);
            return true;
        }
        return false;
    },

    // ========== STATISTICS ==========
    getStats() {
        const books = this.getBooks();
        const members = this.getMembers();
        const loans = this.getLoans();
        const categories = this.getCategories();
        const publishers = this.getPublishers();

        // Get unique authors
        const authors = new Set(books.map(b => b.author).filter(Boolean));

        // Count available and issued books
        const availableBooks = books.filter(b => b.status !== 'معار').length;
        const issuedBooks = books.filter(b => b.status === 'معار').length;

        return {
            totalBooks: books.length,
            totalAuthors: authors.size,
            totalCategories: categories.length,
            totalPublishers: publishers.length,
            availableBooks,
            issuedBooks,
            totalMembers: members.length,
            totalLoans: loans.length,
            activeLoans: loans.filter(l => l.status === 'معار').length
        };
    },

    // ========== USER AUTH ==========
    getUser() {
        const data = localStorage.getItem(this.KEYS.USER);
        return data ? JSON.parse(data) : null;
    },

    setUser(user) {
        localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
    },

    clearUser() {
        localStorage.removeItem(this.KEYS.USER);
    },

    // Demo login when not using Supabase (for local testing only)
    login(email, password) {
        const e = (email || '').trim().toLowerCase();
        const ok = (e === 'admin' || e === 'admin@example.com') && password === 'admin';
        if (ok) {
            const user = { email: e, loggedInAt: new Date().toISOString() };
            this.setUser(user);
            return user;
        }
        return null;
    },

    isLoggedIn() {
        return this.getUser() !== null;
    },

    logout() {
        this.clearUser();
    },

    // ========== IMPORT/EXPORT ==========
    exportBooksToCSV() {
        const books = this.getBooks();
        if (!books.length) return null;

        // Same order as book list table: name, author, category, editor, parts, publisher, year, copies, status, cabinet, shelf, notes
        const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الصندوق', 'الطاق', 'ملاحظات'];
        const rows = books.map(book => [
            book.name || '',
            book.author || '',
            book.category || '',
            book.editor || '',
            book.parts || '',
            book.publisher || '',
            book.year || '',
            book.copies || '',
            book.status || '',
            book.cabinet || '',
            book.shelf || '',
            book.notes || ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return csvContent;
    },

    getCSVTemplate() {
        const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الصندوق', 'الطاق', 'ملاحظات'];
        const exampleRow = ['مثال: صحيح البخاري', 'الإمام البخاري', 'حديث', 'ابن حجر العسقلاني', '9', 'دار السلام', '1422', '1', 'متاح', 'A1', '1', 'نسخة محققة'];
        
        return [headers, exampleRow]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    },

    /**
     * Parse CSV text into rows of cells. Handles quoted fields (commas and newlines inside "...").
     * Returns [ [...cells], [...cells], ... ].
     */
    _parseCSVToRows(text) {
        let t = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
        const rows = [];
        let row = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < t.length; i++) {
            const c = t[i];
            if (inQuotes) {
                if (c === '"') {
                    if (t[i + 1] === '"') { cell += '"'; i++; }
                    else inQuotes = false;
                } else {
                    cell += c;
                }
            } else {
                if (c === '"') inQuotes = true;
                else if (c === ',') { row.push(cell.trim()); cell = ''; }
                else if (c === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
                else cell += c;
            }
        }
        if (cell !== '' || row.length > 0) { row.push(cell.trim()); rows.push(row); }
        return rows;
    },

    importBooksFromCSV(csvData, onProgress) {
        const rows = this._parseCSVToRows(csvData);
        if (rows.length < 2) return { success: false, message: 'الملف فارغ أو غير صالح' };

        const total = rows.length - 1;
        if (typeof onProgress === 'function') onProgress(0, total);

        const headerRow = rows[0].map(h => (h || '').trim());
        const numCols = Math.max(headerRow.length, 12);
        const col = (arr, name) => {
            const i = headerRow.findIndex(h => (h || '').trim() === name);
            return i >= 0 ? (arr[i] || '').trim() : '';
        };
        const yearLooksValid = (v) => {
            const s = (v || '').trim();
            if (!s) return true;
            const onlyDigitsOrEmpty = (s.replace(/\s/g, '').replace(/[\u0660-\u0669\u06F0-\u06F9\d]/g, '').length === 0);
            return onlyDigitsOrEmpty && s.length <= 8;
        };

        const imported = [];
        const updated = [];
        let skipped = 0;

        for (let i = 1; i < rows.length; i++) {
            const raw = rows[i];
            const cleanValues = raw.length > numCols ? raw.slice(0, numCols) : [...raw, ...Array(numCols - raw.length).fill('')];
            const name = col(cleanValues, 'اسم الكتاب');
            const author = col(cleanValues, 'المؤلف');
            const category = col(cleanValues, 'القسم');
            const cabinet = col(cleanValues, 'الصندوق');
            if (!name || !author || !category || !cabinet) {
                skipped++;
                continue;
            }
            if (category && !this.getCategories().includes(category)) {
                this.addCategory(category);
            }
            const yearRaw = (col(cleanValues, 'السنة') || '').trim();
            const year = yearLooksValid(yearRaw) ? yearRaw : '';
            const book = {
                name,
                author,
                editor: col(cleanValues, 'المحقق') || '',
                category: category || 'عام',
                cabinet,
                shelf: col(cleanValues, 'الطاق') || '',
                parts: parseInt(col(cleanValues, 'الأجزاء')) || 1,
                publisher: col(cleanValues, 'دار النشر') || '',
                year,
                copies: parseInt(col(cleanValues, 'النسخ')) || 1,
                status: col(cleanValues, 'الحالة') || 'متاح',
                notes: col(cleanValues, 'ملاحظات') || ''
            };
            const existing = this.getBooks().find(b =>
                (b.name || '').trim().toLowerCase() === name.toLowerCase() &&
                (b.author || '').trim().toLowerCase() === author.toLowerCase()
            );
            if (existing) {
                const updatedBook = this.updateBook(existing.id, book);
                if (updatedBook) updated.push(updatedBook);
            } else {
                imported.push(this.addBook(book));
            }
            if (typeof onProgress === 'function' && i % 25 === 0) onProgress(i, total);
        }
        if (typeof onProgress === 'function') onProgress(total, total);

        return { success: true, count: imported.length, books: imported, updatedCount: updated.length, updated, skipped };
    },

    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.setBooks([]);
        this.setMembers([]);
        this.setLoans([]);
        this.setDiary([]);
        this.setCategories([]);
        this.setPublishers([]);
    }
};

/**
 * Stub when Supabase is not configured: no localStorage, no hardcoded data.
 * App shows login; login rejects with a message to configure Supabase.
 */
const SupabaseOnlyStub = {
    init() {},
    ensureReady() { return Promise.resolve(); },
    getBooks() { return []; },
    setBooks() {},
    getMembers() { return []; },
    setMembers() {},
    getLoans() { return []; },
    getDiary() { return []; },
    getDiaryGroupedByDate() { return {}; },
    getCategories() { return []; },
    setCategories() {},
    getPublishers() { return []; },
    setPublishers() {},
    getBookById() { return null; },
    getMemberById() { return null; },
    getActiveLoans() { return []; },
    getStats() {
        return { totalBooks: 0, totalAuthors: 0, totalCategories: 0, totalPublishers: 0, availableBooks: 0, issuedBooks: 0, totalMembers: 0, totalLoans: 0, activeLoans: 0 };
    },
    addBook() { return Promise.resolve(null); },
    updateBook() { return Promise.resolve(null); },
    deleteBook() { return Promise.resolve(false); },
    deleteBooks() { return Promise.resolve(0); },
    addMember() { return Promise.resolve(null); },
    updateMember() { return Promise.resolve(null); },
    deleteMember() { return Promise.resolve(false); },
    deleteMembers() { return Promise.resolve(0); },
    addLoan() { return Promise.resolve(null); },
    returnLoan() { return Promise.resolve(null); },
    deleteLoan() { return Promise.resolve(); },
    addDiaryEntry() { return Promise.resolve(null); },
    updateDiaryEntry() { return Promise.resolve(null); },
    deleteDiaryEntry() { return Promise.resolve(false); },
    addCategory() { return Promise.resolve(false); },
    updateCategory() { return Promise.resolve(false); },
    deleteCategory() { return Promise.resolve(); },
    addPublisher() { return Promise.resolve(false); },
    updatePublisher() { return Promise.resolve(false); },
    deletePublisher() { return Promise.resolve(); },
    login() {
        return Promise.reject(new Error('يرجى إعداد Supabase: انسخ js/config.example.js إلى js/config.js وأدخل مفاتيح المشروع.'));
    },
    logout() { return Promise.resolve(); },
    isLoggedIn() { return false; },
    exportBooksToCSV() { return null; },
    getCSVTemplate() {
        const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الصندوق', 'الطاق', 'ملاحظات'];
        return headers.map(cell => `"${cell}"`).join(',') + '\n';
    },
    importBooksFromCSV() { return Promise.resolve({ success: false, message: 'يرجى إعداد Supabase أولاً.', count: 0, books: [], updatedCount: 0, updated: [], skipped: 0 }); },
    clearAllData() { return Promise.resolve(); },
    syncPublishersFromBooks() { return Promise.resolve({ added: 0 }); },
    getCurrentUserRole() { return 'viewer'; },
    getProfile() { return null; },
    listProfiles() { return Promise.resolve([]); },
    updateUserRole() { return Promise.reject(new Error('Supabase required')); },
    updateOwnPassword() { return Promise.reject(new Error('Supabase required')); },
    sendPasswordResetEmail() { return Promise.reject(new Error('Supabase required')); }
};

// Use Supabase when configured; otherwise stub (no localStorage, no hardcoded data)
if (typeof window !== 'undefined' && window.SupabaseDataManager && window.supabaseClient) {
    window.DataManager = window.SupabaseDataManager;
    window.SUPABASE_REQUIRED = false;
    window.DataManager.init();
} else {
    window.DataManager = SupabaseOnlyStub;
    window.SUPABASE_REQUIRED = true; // Show setup message on login page
    SupabaseOnlyStub.init();
}
