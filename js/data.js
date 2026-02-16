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

    // Default categories
    DEFAULT_CATEGORIES: [
        'تفسير',
        'حديث',
        'فقه',
        'عقيدة',
        'سيرة',
        'تاريخ',
        'لغة عربية',
        'أدب',
        'تزكية',
        'عام'
    ],

    // Default publishers
    DEFAULT_PUBLISHERS: [
        'دار السلام',
        'دار الكتب العلمية',
        'مؤسسة الرسالة',
        'دار ابن كثير',
        'دار المعرفة',
        'دار التراث العربي',
        'أخرى'
    ],

    // Initialize data
    init() {
        // Initialize categories if not exists
        if (!this.getCategories().length) {
            this.setCategories(this.DEFAULT_CATEGORIES);
        }
        // Initialize publishers if not exists
        if (!this.getPublishers().length) {
            this.setPublishers(this.DEFAULT_PUBLISHERS);
        }
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
        
        // Get unique authors
        const authors = new Set(books.map(b => b.author).filter(Boolean));
        
        // Count available and issued books
        const availableBooks = books.filter(b => b.status !== 'معار').length;
        const issuedBooks = books.filter(b => b.status === 'معار').length;
        
        return {
            totalBooks: books.length,
            totalAuthors: authors.size,
            totalCategories: categories.length,
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

        const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الخزانة', 'الرف', 'ملاحظات'];
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
        const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الخزانة', 'الرف', 'ملاحظات'];
        const exampleRow = ['مثال: صحيح البخاري', 'الإمام البخاري', 'حديث', 'ابن حجر العسقلاني', '9', 'دار السلام', '1422', '1', 'متاح', 'A1', '1', 'نسخة محققة'];
        
        return [headers, exampleRow]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    },

    importBooksFromCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) return { success: false, message: 'الملف فارغ أو غير صالح' };

        const imported = [];
        let skipped = 0;
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].match(/("([^"]|"")*"|[^,]*)/g) || [];
            const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

            // Required: book name, author, cabinet (storage), shelf only
            const name = (cleanValues[0] || '').trim();
            const author = (cleanValues[1] || '').trim();
            const cabinet = (cleanValues[9] || '').trim();
            const shelf = (cleanValues[10] || '').trim();
            if (name && author && cabinet && shelf) {
                const book = {
                    name,
                    author,
                    category: cleanValues[2] || 'عام',
                    editor: cleanValues[3] || '',
                    parts: parseInt(cleanValues[4]) || 1,
                    publisher: cleanValues[5] || '',
                    year: cleanValues[6] || '',
                    copies: parseInt(cleanValues[7]) || 1,
                    status: cleanValues[8] || 'متاح',
                    cabinet,
                    shelf,
                    notes: cleanValues[11] || ''
                };
                imported.push(this.addBook(book));
            } else {
                skipped++;
            }
        }

        return { success: true, count: imported.length, books: imported, skipped };
    },

    // Clear all data (for testing)
    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }
};

// Use Supabase when configured, otherwise localStorage
if (typeof window !== 'undefined' && window.SupabaseDataManager && window.supabaseClient) {
    window.DataManager = window.SupabaseDataManager;
    window.DataManager.init();
} else {
    window.DataManager = LocalStorageDataManager;
    LocalStorageDataManager.init();
}
