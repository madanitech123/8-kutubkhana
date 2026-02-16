/**
 * مكتبة المصباح - Supabase data layer
 * Same API as DataManager but backed by Supabase; uses in-memory cache and async init.
 */
(function () {
    if (typeof window === 'undefined' || !window.supabaseClient) return;

    const sb = window.supabaseClient;

    function mapBook(row) {
        if (!row) return null;
        return {
            id: row.id,
            name: row.name || '',
            author: row.author || '',
            category: row.category || '',
            editor: row.editor || '',
            parts: row.parts != null ? row.parts : 1,
            publisher: row.publisher || '',
            year: row.year || '',
            copies: row.copies != null ? row.copies : 1,
            status: row.status || 'متاح',
            cabinet: row.cabinet || '',
            shelf: row.shelf || '',
            notes: row.notes || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    function mapMember(row) {
        if (!row) return null;
        return {
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            address: row.address || '',
            createdAt: row.created_at
        };
    }

    function mapLoan(row) {
        if (!row) return null;
        return {
            id: row.id,
            bookId: row.book_id,
            memberId: row.member_id,
            loanDate: row.loan_date,
            returnDate: row.return_date,
            status: row.status || 'معار',
            createdAt: row.created_at
        };
    }

    function mapDiary(row) {
        if (!row) return null;
        return {
            id: row.id,
            date: row.date,
            category: row.category || 'أخرى',
            content: row.details || '',
            details: row.details || '',
            images: row.images || '',
            createdAt: row.created_at
        };
    }

    const cache = {
        books: [],
        members: [],
        loans: [],
        diary: [],
        categories: [],
        publishers: []
    };

    let readyPromise = null;
    let authUser = null;

    async function fetchAll() {
        const [booksRes, membersRes, loansRes, diaryRes, catRes, pubRes] = await Promise.all([
            sb.from('books').select('*').order('created_at', { ascending: false }),
            sb.from('members').select('*').order('created_at', { ascending: false }),
            sb.from('loans').select('*').order('created_at', { ascending: false }),
            sb.from('diary_entries').select('*').order('created_at', { ascending: false }),
            sb.from('categories').select('name').order('name'),
            sb.from('publishers').select('name').order('name')
        ]);
        if (booksRes.data) cache.books = (booksRes.data || []).map(mapBook);
        if (membersRes.data) cache.members = (membersRes.data || []).map(mapMember);
        if (loansRes.data) cache.loans = (loansRes.data || []).map(mapLoan);
        if (diaryRes.data) cache.diary = (diaryRes.data || []).map(mapDiary);
        if (catRes.data) cache.categories = (catRes.data || []).map(r => r.name);
        if (pubRes.data) cache.publishers = (pubRes.data || []).map(r => r.name);
        if (cache.categories.length === 0) cache.categories = ['تفسير', 'حديث', 'فقه', 'عقيدة', 'سيرة', 'تاريخ', 'لغة عربية', 'أدب', 'تزكية', 'عام'];
        if (cache.publishers.length === 0) cache.publishers = ['دار السلام', 'دار الكتب العلمية', 'مؤسسة الرسالة', 'دار ابن كثير', 'دار المعرفة', 'دار التراث العربي', 'أخرى'];
    }

    window.SupabaseDataManager = {
        KEYS: {},
        DEFAULT_CATEGORIES: ['تفسير', 'حديث', 'فقه', 'عقيدة', 'سيرة', 'تاريخ', 'لغة عربية', 'أدب', 'تزكية', 'عام'],
        DEFAULT_PUBLISHERS: ['دار السلام', 'دار الكتب العلمية', 'مؤسسة الرسالة', 'دار ابن كثير', 'دار المعرفة', 'دار التراث العربي', 'أخرى'],

        init() {
            if (!readyPromise) {
                readyPromise = (async () => {
                    const { data: { session } } = await sb.auth.getSession();
                    authUser = session?.user ?? null;
                    sb.auth.onAuthStateChange((_event, session) => {
                        authUser = session?.user ?? null;
                    });
                    await fetchAll();
                })();
            }
            return readyPromise;
        },

        ensureReady() {
            return this.init();
        },

        generateId() {
            return 'temp-' + Date.now();
        },

        getBooks() { return cache.books.slice(); },
        setBooks(books) { cache.books = books.slice(); },

        addBook(book) {
            const row = {
                name: book.name || '',
                author: book.author || '',
                category: book.category || '',
                editor: book.editor || '',
                parts: book.parts != null ? book.parts : 1,
                publisher: book.publisher || '',
                year: book.year || '',
                copies: book.copies != null ? book.copies : 1,
                status: book.status || 'متاح',
                cabinet: book.cabinet || '',
                shelf: book.shelf || '',
                notes: book.notes || ''
            };
            return sb.from('books').insert(row).select('id, created_at, updated_at').single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const out = mapBook({ ...row, id: data.id, created_at: data.created_at, updated_at: data.updated_at });
                    cache.books.unshift(out);
                    return out;
                });
        },

        updateBook(id, updatedData) {
            const map = {
                name: 'name', author: 'author', category: 'category', editor: 'editor',
                parts: 'parts', publisher: 'publisher', year: 'year', copies: 'copies',
                status: 'status', cabinet: 'cabinet', shelf: 'shelf', notes: 'notes'
            };
            const obj = { updated_at: new Date().toISOString() };
            Object.keys(map).forEach(k => { if (updatedData[k] !== undefined) obj[map[k]] = updatedData[k]; });
            return sb.from('books').update(obj).eq('id', id).select().single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const idx = cache.books.findIndex(b => b.id === id);
                    if (idx !== -1) cache.books[idx] = mapBook(data);
                    return mapBook(data);
                });
        },

        deleteBook(id) {
            return sb.from('books').delete().eq('id', id).then(({ error }) => {
                if (error) return Promise.reject(error);
                const len = cache.books.length;
                cache.books = cache.books.filter(b => b.id !== id);
                return len !== cache.books.length;
            });
        },

        deleteBooks(ids) {
            if (!ids.length) return Promise.resolve(0);
            return sb.from('books').delete().in('id', ids).then(({ error }) => {
                if (error) return Promise.reject(error);
                const len = cache.books.length;
                cache.books = cache.books.filter(b => !ids.includes(b.id));
                return len - cache.books.length;
            });
        },

        getBookById(id) { return cache.books.find(b => b.id === id) || null; },

        getMembers() { return cache.members.slice(); },
        setMembers(members) { cache.members = members.slice(); },

        addMember(member) {
            const row = { name: member.name || '', phone: member.phone || '', address: member.address || '' };
            return sb.from('members').insert(row).select('id, created_at').single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const out = mapMember({ ...row, id: data.id, created_at: data.created_at });
                    cache.members.unshift(out);
                    return out;
                });
        },

        updateMember(id, updatedData) {
            const obj = { name: updatedData.name, phone: updatedData.phone, address: updatedData.address };
            Object.keys(obj).forEach(k => obj[k] === undefined && delete obj[k]);
            return sb.from('members').update(obj).eq('id', id).select().single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const idx = cache.members.findIndex(m => m.id === id);
                    if (idx !== -1) cache.members[idx] = mapMember(data);
                    return mapMember(data);
                });
        },

        deleteMember(id) {
            return sb.from('members').delete().eq('id', id).then(({ error }) => {
                if (error) return Promise.reject(error);
                const len = cache.members.length;
                cache.members = cache.members.filter(m => m.id !== id);
                return len !== cache.members.length;
            });
        },

        deleteMembers(ids) {
            if (!ids.length) return Promise.resolve(0);
            return sb.from('members').delete().in('id', ids).then(({ error }) => {
                if (error) return Promise.reject(error);
                const len = cache.members.length;
                cache.members = cache.members.filter(m => !ids.includes(m.id));
                return len - cache.members.length;
            });
        },

        getMemberById(id) { return cache.members.find(m => m.id === id) || null; },

        getLoans() { return cache.loans.slice(); },
        setLoans(loans) { cache.loans = loans.slice(); },

        addLoan(loan) {
            const row = {
                book_id: loan.bookId,
                member_id: loan.memberId,
                loan_date: loan.loanDate || null,
                return_date: null,
                status: 'معار'
            };
            return sb.from('loans').insert(row).select('id, created_at').single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const out = mapLoan({ ...row, id: data.id, created_at: data.created_at });
                    cache.loans.unshift(out);
                    return this.updateBook(loan.bookId, { status: 'معار' }).then(() => out);
                });
        },

        returnLoan(id) {
            const loan = cache.loans.find(l => l.id === id);
            if (!loan) return Promise.resolve(null);
            const returnDate = new Date().toISOString().split('T')[0];
            return sb.from('loans').update({ return_date: returnDate, status: 'مُرجع' }).eq('id', id).select().single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const idx = cache.loans.findIndex(l => l.id === id);
                    if (idx !== -1) cache.loans[idx] = mapLoan(data);
                    return this.updateBook(loan.bookId, { status: 'متاح' }).then(() => mapLoan(data));
                });
        },

        deleteLoan(id) {
            return sb.from('loans').delete().eq('id', id).then(({ error }) => {
                if (error) return Promise.reject(error);
                const len = cache.loans.length;
                cache.loans = cache.loans.filter(l => l.id !== id);
                return len !== cache.loans.length;
            });
        },

        getLoansByBookId(bookId) { return cache.loans.filter(l => l.bookId === bookId); },
        getLoansByMemberId(memberId) { return cache.loans.filter(l => l.memberId === memberId); },
        getActiveLoans() { return cache.loans.filter(l => l.status === 'معار'); },

        getDiary() { return cache.diary.slice(); },
        setDiary(diary) { cache.diary = diary.slice(); },

        addDiaryEntry(entry) {
            const date = entry.date || new Date().toISOString().split('T')[0];
            const row = {
                date,
                category: entry.category || 'أخرى',
                details: (entry.details != null ? entry.details : entry.content) || '',
                images: entry.images || ''
            };
            return sb.from('diary_entries').insert(row).select('id, created_at').single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const out = mapDiary({ ...row, id: data.id, created_at: data.created_at });
                    cache.diary.unshift(out);
                    return out;
                });
        },

        updateDiaryEntry(id, updatedData) {
            const details = updatedData.details != null ? updatedData.details : updatedData.content;
            const obj = { date: updatedData.date, category: updatedData.category, details: details, images: updatedData.images };
            Object.keys(obj).forEach(k => obj[k] === undefined && delete obj[k]);
            return sb.from('diary_entries').update(obj).eq('id', id).select().single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    const idx = cache.diary.findIndex(d => d.id === id);
                    if (idx !== -1) cache.diary[idx] = mapDiary(data);
                    return mapDiary(data);
                });
        },

        deleteDiaryEntry(id) {
            return sb.from('diary_entries').delete().eq('id', id).then(({ error }) => {
                if (error) return Promise.reject(error);
                const len = cache.diary.length;
                cache.diary = cache.diary.filter(d => d.id !== id);
                return len !== cache.diary.length;
            });
        },

        getDiaryGroupedByDate() {
            const grouped = {};
            cache.diary.forEach(entry => {
                const d = entry.date;
                if (!grouped[d]) grouped[d] = [];
                grouped[d].push(entry);
            });
            return grouped;
        },

        getCategories() { return cache.categories.slice(); },
        setCategories(categories) { cache.categories = categories.slice(); },

        addCategory(category) {
            if (cache.categories.includes(category)) return Promise.resolve(false);
            return sb.from('categories').insert({ name: category }).then(({ error }) => {
                if (!error) cache.categories.push(category);
                return !error;
            });
        },

        updateCategory(oldName, newName) {
            return sb.from('categories').update({ name: newName }).eq('name', oldName).then(({ error }) => {
                if (!error) {
                    const i = cache.categories.indexOf(oldName);
                    if (i !== -1) cache.categories[i] = newName;
                }
                return !error;
            });
        },

        deleteCategory(category) {
            return sb.from('categories').delete().eq('name', category).then(({ error }) => {
                if (!error) cache.categories = cache.categories.filter(c => c !== category);
                return !error;
            });
        },

        getPublishers() { return cache.publishers.slice(); },
        setPublishers(publishers) { cache.publishers = publishers.slice(); },

        addPublisher(publisher) {
            if (cache.publishers.includes(publisher)) return Promise.resolve(false);
            return sb.from('publishers').insert({ name: publisher }).then(({ error }) => {
                if (!error) cache.publishers.push(publisher);
                return !error;
            });
        },

        updatePublisher(oldName, newName) {
            return sb.from('publishers').update({ name: newName }).eq('name', oldName).then(({ error }) => {
                if (!error) {
                    const i = cache.publishers.indexOf(oldName);
                    if (i !== -1) cache.publishers[i] = newName;
                }
                return !error;
            });
        },

        deletePublisher(publisher) {
            return sb.from('publishers').delete().eq('name', publisher).then(({ error }) => {
                if (!error) cache.publishers = cache.publishers.filter(p => p !== publisher);
                return !error;
            });
        },

        getStats() {
            const books = cache.books;
            const members = cache.members;
            const loans = cache.loans;
            const categories = cache.categories;
            const authors = new Set(books.map(b => b.author).filter(Boolean));
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

        getUser() { return authUser; },
        setUser() {},
        clearUser() {},
        login(email, password) {
            return sb.auth.signInWithPassword({ email: (email || '').trim(), password: password || '' })
                .then(({ data, error }) => {
                    if (error) return null;
                    authUser = data.user;
                    return data.user;
                });
        },
        isLoggedIn() { return !!authUser; },
        logout() {
            return sb.auth.signOut().then(() => { authUser = null; });
        },

        exportBooksToCSV() {
            const books = cache.books;
            if (!books.length) return null;
            const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الخزانة', 'الرف', 'ملاحظات'];
            const rows = books.map(book => [
                book.name || '', book.author || '', book.category || '', book.editor || '', book.parts || '',
                book.publisher || '', book.year || '', book.copies || '', book.status || '', book.cabinet || '',
                book.shelf || '', book.notes || ''
            ]);
            return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        },

        getCSVTemplate() {
            const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الخزانة', 'الرف', 'ملاحظات'];
            const exampleRow = ['مثال: صحيح البخاري', 'الإمام البخاري', 'حديث', 'ابن حجر العسقلاني', '9', 'دار السلام', '1422', '1', 'متاح', 'A1', '1', 'نسخة محققة'];
            return [headers, exampleRow].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        },

        importBooksFromCSV(csvData) {
            const lines = csvData.split('\n').filter(line => line.trim());
            if (lines.length < 2) return Promise.resolve({ success: false, message: 'الملف فارغ أو غير صالح' });
            const promises = [];
            let skipped = 0;
            let skippedDuplicates = 0;
            const existing = cache.books.slice();
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].match(/("([^"]|"")*"|[^,]*)/g) || [];
                const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
                const name = (cleanValues[0] || '').trim();
                const author = (cleanValues[1] || '').trim();
                const cabinet = (cleanValues[9] || '').trim();
                const shelf = (cleanValues[10] || '').trim();
                if (!name || !author || !cabinet || !shelf) {
                    skipped++;
                    continue;
                }
                const isDup = existing.some(b =>
                    (b.name || '').trim().toLowerCase() === name.toLowerCase() &&
                    (b.author || '').trim().toLowerCase() === author.toLowerCase()
                );
                if (isDup) {
                    skippedDuplicates++;
                    continue;
                }
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
                promises.push(this.addBook(book).then(added => { existing.push(added); return added; }));
            }
            return Promise.all(promises).then(books => ({ success: true, count: books.length, books, skipped, skippedDuplicates }));
        },

        clearAllData() {
            cache.books = [];
            cache.members = [];
            cache.loans = [];
            cache.diary = [];
            return Promise.resolve();
        }
    };
})();
