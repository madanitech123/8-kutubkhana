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
    let currentUserProfile = null;

    const PAGE_SIZE = 1000;

    async function ensureProfile() {
        if (!authUser) return;
        const uid = authUser.id;
        const email = authUser.email || '';
        const { data: existing } = await sb.from('profiles').select('*').eq('user_id', uid).maybeSingle();
        if (existing) {
            currentUserProfile = { user_id: existing.user_id, email: existing.email || '', role: existing.role || 'viewer', display_name: existing.display_name || '' };
            return;
        }
        const { data: inserted, error } = await sb.from('profiles').insert({ user_id: uid, email, role: 'viewer' }).select().single();
        if (error) {
            if (error.code === '23505') {
                const { data: row } = await sb.from('profiles').select('*').eq('user_id', uid).single();
                if (row) currentUserProfile = { user_id: row.user_id, email: row.email || '', role: row.role || 'viewer', display_name: row.display_name || '' };
            }
            return;
        }
        currentUserProfile = inserted ? { user_id: inserted.user_id, email: inserted.email || '', role: inserted.role || 'viewer', display_name: inserted.display_name || '' } : null;
    }

    async function fetchAllFromTable(table, orderBy, ascending = false) {
        const all = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await sb.from(table).select('*').order(orderBy, { ascending }).range(from, to);
            if (error) throw error;
            const rows = data || [];
            all.push(...rows);
            hasMore = rows.length === PAGE_SIZE;
            from += PAGE_SIZE;
        }
        return all;
    }

    async function fetchAll() {
        const [booksRows, membersRows, loansRows, diaryRows, catRes, pubRes] = await Promise.all([
            fetchAllFromTable('books', 'created_at', false),
            fetchAllFromTable('members', 'created_at', false),
            fetchAllFromTable('loans', 'created_at', false),
            fetchAllFromTable('diary_entries', 'created_at', false),
            sb.from('categories').select('name').order('name'),
            sb.from('publishers').select('name').order('name')
        ]);
        cache.books = booksRows.map(mapBook);
        cache.members = membersRows.map(mapMember);
        cache.loans = loansRows.map(mapLoan);
        cache.diary = diaryRows.map(mapDiary);
        if (catRes.data) cache.categories = (catRes.data || []).map(r => r.name);
        if (pubRes.data) cache.publishers = (pubRes.data || []).map(r => r.name);
    }

    window.SupabaseDataManager = {
        KEYS: {},

        init() {
            if (!readyPromise) {
                readyPromise = (async () => {
                    const { data: { session } } = await sb.auth.getSession();
                    authUser = session?.user ?? null;
                    sb.auth.onAuthStateChange(async (_event, session) => {
                        authUser = session?.user ?? null;
                        currentUserProfile = null;
                        if (authUser) await ensureProfile();
                    });
                    await ensureProfile();
                    await fetchAll();
                })();
            }
            return readyPromise;
        },

        getCurrentUserRole() {
            return currentUserProfile?.role || 'viewer';
        },

        getProfile() {
            return currentUserProfile ? { ...currentUserProfile } : null;
        },

        listProfiles() {
            return sb.from('profiles').select('user_id, email, role, display_name, created_at').order('email').then(({ data, error }) => {
                if (error) return Promise.reject(error);
                return (data || []).map(r => ({ userId: r.user_id, email: r.email || '', role: r.role || 'viewer', displayName: r.display_name || '', createdAt: r.created_at }));
            });
        },

        updateUserRole(userId, role) {
            if (!['admin', 'librarian', 'viewer'].includes(role)) return Promise.reject(new Error('Invalid role'));
            return sb.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('user_id', userId).select().single()
                .then(({ data, error }) => {
                    if (error) return Promise.reject(error);
                    if (data && data.user_id === authUser?.id) currentUserProfile = currentUserProfile ? { ...currentUserProfile, role: data.role } : { user_id: data.user_id, email: data.email || '', role: data.role || 'viewer', display_name: data.display_name || '' };
                    return data;
                });
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
            if (!category || cache.categories.includes(category)) return Promise.resolve(false);
            return sb.from('categories').insert({ name: category }).then(({ error }) => {
                if (!error) {
                    cache.categories.push(category);
                    return true;
                }
                const conflict = error.code === '23505' || error.status === 409 || (error.message && error.message.includes('duplicate'));
                if (conflict) {
                    if (!cache.categories.includes(category)) cache.categories.push(category);
                    return true;
                }
                return false;
            }).catch(err => {
                if (err?.code === '23505' || err?.status === 409) {
                    if (!cache.categories.includes(category)) cache.categories.push(category);
                    return true;
                }
                throw err;
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
            if (!publisher || cache.publishers.includes(publisher)) return Promise.resolve(false);
            return sb.from('publishers').insert({ name: publisher }).then(({ error }) => {
                if (!error) {
                    cache.publishers.push(publisher);
                    cache.publishers.sort();
                    return true;
                }
                const conflict = error.code === '23505' || error.status === 409 || (error.message && error.message.includes('duplicate'));
                if (conflict) {
                    if (!cache.publishers.includes(publisher)) cache.publishers.push(publisher);
                    cache.publishers.sort();
                    return true;
                }
                return false;
            }).catch(err => {
                if (err?.code === '23505' || err?.status === 409) {
                    if (!cache.publishers.includes(publisher)) cache.publishers.push(publisher);
                    cache.publishers.sort();
                    return true;
                }
                return false;
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

        /** Populate publishers list from existing books (for books that have publisher set but not in publishers table). */
        syncPublishersFromBooks() {
            const existing = cache.publishers.slice();
            const fromBooks = new Set();
            cache.books.forEach(b => {
                const p = (b.publisher || '').trim();
                if (p) fromBooks.add(p);
            });
            const toAdd = Array.from(fromBooks).filter(p => !existing.includes(p));
            if (!toAdd.length) return Promise.resolve({ added: 0 });
            return Promise.allSettled(toAdd.map(n => this.addPublisher(n))).then(results => {
                const added = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
                return { added };
            });
        },

        getStats() {
            const books = cache.books;
            const members = cache.members;
            const loans = cache.loans;
            const categories = cache.categories;
            const publishers = cache.publishers;
            const authors = new Set(books.map(b => b.author).filter(Boolean));
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

        updateOwnPassword(newPassword) {
            return sb.auth.updateUser({ password: newPassword }).then(({ data, error }) => {
                if (error) return Promise.reject(error);
                return data;
            });
        },

        sendPasswordResetEmail(email) {
            return sb.auth.resetPasswordForEmail((email || '').trim(), {
                redirectTo: typeof window !== 'undefined' && window.location ? window.location.origin + (window.location.pathname || '/') : undefined
            }).then(({ data, error }) => {
                if (error) return Promise.reject(error);
                return data;
            });
        },

        exportBooksToCSV() {
            const books = cache.books;
            if (!books.length) return null;
            const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الصندوق', 'الطاق', 'ملاحظات'];
            const rows = books.map(book => [
                book.name || '', book.author || '', book.category || '', book.editor || '', book.parts || '',
                book.publisher || '', book.year || '', book.copies || '', book.status || '', book.cabinet || '',
                book.shelf || '', book.notes || ''
            ]);
            return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        },

        getCSVTemplate() {
            const headers = ['اسم الكتاب', 'المؤلف', 'القسم', 'المحقق', 'الأجزاء', 'دار النشر', 'السنة', 'النسخ', 'الحالة', 'الصندوق', 'الطاق', 'ملاحظات'];
            const exampleRow = ['مثال: صحيح البخاري', 'الإمام البخاري', 'حديث', 'ابن حجر العسقلاني', '9', 'دار السلام', '1422', '1', 'متاح', 'A1', '1', 'نسخة محققة'];
            return [headers, exampleRow].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        },

        importBooksFromCSV(csvData, onProgress) {
            const parseCSVToRows = (text) => {
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
                        } else cell += c;
                    } else {
                        if (c === '"') inQuotes = true;
                        else if (c === ',') { row.push(cell.trim()); cell = ''; }
                        else if (c === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
                        else cell += c;
                    }
                }
                if (cell !== '' || row.length > 0) { row.push(cell.trim()); rows.push(row); }
                return rows;
            };
            const yearLooksValid = (v) => {
                const s = (v || '').trim();
                if (!s) return true;
                const digits = s.replace(/[\s\u0660-\u0669\u06F0-\u06F9]/g, '').replace(/\d/g, '');
                const onlyDigitsOrEmpty = (s.replace(/\s/g, '').replace(/[\u0660-\u0669\u06F0-\u06F9\d]/g, '').length === 0);
                return onlyDigitsOrEmpty && s.length <= 8;
            };
            const rows = parseCSVToRows(csvData);
            if (rows.length < 2) return Promise.resolve({ success: false, message: 'الملف فارغ أو غير صالح' });
            const headerRow = rows[0].map(h => (h || '').trim());
            const numCols = Math.max(headerRow.length, 12);
            const col = (arr, name) => {
                const i = headerRow.findIndex(h => (h || '').trim() === name);
                return i >= 0 ? (arr[i] || '').trim() : '';
            };
            const tasks = [];
            const existing = cache.books.slice();
            let skipped = 0;
            const uniqueCategories = new Set();
            const uniquePublishers = new Set();
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
                uniqueCategories.add(category);
                const publisherVal = (col(cleanValues, 'دار النشر') || '').trim();
                if (publisherVal) uniquePublishers.add(publisherVal);
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
                    publisher: publisherVal,
                    year,
                    copies: parseInt(col(cleanValues, 'النسخ')) || 1,
                    status: col(cleanValues, 'الحالة') || 'متاح',
                    notes: col(cleanValues, 'ملاحظات') || ''
                };
                const existingBook = existing.find(b =>
                    (b.name || '').trim().toLowerCase() === name.toLowerCase() &&
                    (b.author || '').trim().toLowerCase() === author.toLowerCase()
                );
                if (existingBook) {
                    tasks.push({ type: 'update', id: existingBook.id, book });
                } else {
                    tasks.push({ type: 'add', book });
                }
            }
            const total = tasks.length;
            if (typeof onProgress === 'function') onProgress(0, total);
            const addCategoriesParallel = (names) => {
                const toAdd = Array.from(names).filter(n => n && !cache.categories.includes(n));
                if (!toAdd.length) return Promise.resolve();
                return Promise.allSettled(toAdd.map(n => this.addCategory(n)));
            };
            const addPublishersParallel = (names) => {
                const toAdd = Array.from(names).filter(n => n && !cache.publishers.includes(n));
                if (!toAdd.length) return Promise.resolve();
                return Promise.allSettled(toAdd.map(n => this.addPublisher(n)));
            };
            const bookToRow = (book) => ({
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
            });
            const BULK_INSERT_SIZE = 40;
            const UPDATE_BATCH = 15;
            let actualAddCount = 0;
            let actualUpdateCount = 0;
            let failCount = 0;
            let doneCount = 0;
            const reportProgress = () => {
                if (typeof onProgress === 'function') onProgress(doneCount, total);
            };
            return addCategoriesParallel(uniqueCategories)
                .then(() => addPublishersParallel(uniquePublishers))
                .then(() => {
                    const addTasks = tasks.filter(t => t.type === 'add');
                    const updateTasks = tasks.filter(t => t.type === 'update');
                    let chain = Promise.resolve();
                    for (let i = 0; i < addTasks.length; i += BULK_INSERT_SIZE) {
                        const batch = addTasks.slice(i, i + BULK_INSERT_SIZE);
                        const rows = batch.map(t => bookToRow(t.book));
                        chain = chain.then(() =>
                            sb.from('books').insert(rows).select('id, created_at, updated_at')
                                .then(({ data, error }) => {
                                    if (error) return Promise.reject(error);
                                    const inserted = (data || []).map((d, idx) => mapBook({ ...rows[idx], id: d.id, created_at: d.created_at, updated_at: d.updated_at }));
                                    inserted.reverse();
                                    inserted.forEach(b => cache.books.unshift(b));
                                    existing.push(...inserted);
                                    actualAddCount += inserted.length;
                                    doneCount += batch.length;
                                    reportProgress();
                                })
                        );
                    }
                    for (let i = 0; i < updateTasks.length; i += UPDATE_BATCH) {
                        const batch = updateTasks.slice(i, i + UPDATE_BATCH);
                        chain = chain.then(() =>
                            Promise.allSettled(batch.map(t => this.updateBook(t.id, t.book)))
                                .then(results => {
                                    results.forEach(r => { if (r.status === 'fulfilled') actualUpdateCount++; else failCount++; });
                                    doneCount += batch.length;
                                    reportProgress();
                                })
                        );
                    }
                    return chain.then(() => ({
                        success: true,
                        count: actualAddCount,
                        books: [],
                        updatedCount: actualUpdateCount,
                        skipped,
                        failCount
                    }));
                })
                .catch(err => ({ success: false, message: err?.message || 'خطأ في الاستيراد' }));
        },

        clearAllData() {
            const emptyUuid = '00000000-0000-0000-0000-000000000000';
            return sb.from('loans').delete().neq('id', emptyUuid)
                .then(() => sb.from('books').delete().neq('id', emptyUuid))
                .then(() => sb.from('members').delete().neq('id', emptyUuid))
                .then(() => sb.from('diary_entries').delete().neq('id', emptyUuid))
                .then(() => sb.from('categories').delete().gte('id', 0))
                .then(() => sb.from('publishers').delete().gte('id', 0))
                .then(() => {
                    cache.books = [];
                    cache.members = [];
                    cache.loans = [];
                    cache.diary = [];
                    cache.categories = [];
                    cache.publishers = [];
                    return Promise.resolve();
                })
                .catch(err => Promise.reject(err));
        }
    };
})();
