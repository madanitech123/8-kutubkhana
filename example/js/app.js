// Library Management System - Main Application
class LibraryManagementSystem {
    constructor() {
        this.books = [];
        this.members = [];
        this.categories = [];
        this.publishers = [];
        this.issueHistory = [];
        this.libraryLog = [];
        this.currentPage = 1;
        this.itemsPerPage = 100;
        this.currentFilters = {};
        
        // API Configuration - Use relative URL when served from same server
        this.apiBaseUrl = '/api';
        
        this.token = null;
        this.init();
    }

    init() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        this.token = localStorage.getItem('token');
        if (this.token) {
            // Validate token by making a test API call
            this.validateToken();
        }
    }

    async validateToken() {
        try {
            // Test token with a simple API call
            await this.apiCall('/health');
            // If successful, initialize app
            this.initializeApp();
        } catch (error) {
            // Token is invalid, clear it and show login
            console.log('Invalid token, showing login page');
            localStorage.removeItem('token');
            this.token = null;
            this.showLoginPage();
        }
    }

    showLoginPage() {
        document.getElementById('login').style.display = 'flex';
        document.querySelector('.app-container').style.display = 'none';
    }

    setupLogout() {
        // Remove any existing event listeners first
        const logoutBtn = document.getElementById('logout-btn');
        const logoutBtnDesktop = document.getElementById('logout-btn-desktop');

        if (logoutBtn) {
            // Clone the node to remove all existing event listeners
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogout();
            });
        }

        if (logoutBtnDesktop) {
            // Clone the node to remove all existing event listeners
            const newLogoutBtnDesktop = logoutBtnDesktop.cloneNode(true);
            logoutBtnDesktop.parentNode.replaceChild(newLogoutBtnDesktop, logoutBtnDesktop);

            newLogoutBtnDesktop.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogout();
            });
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            this.token = null;
            this.showLoginPage();
        }
    }

    initializeApp() {
        document.getElementById('login').style.display = 'none';
        document.querySelector('.app-container').style.display = 'flex';
        this.setupEventListeners();
        this.setupLogout();
        this.loadDataFromAPI();
        this.showPage('dashboard');
    }

    

    // API Data Loading
    async loadDataFromAPI() {
        try {
            // Load dashboard data first
            await this.loadDashboardData();
            
            // Load other data
            await Promise.all([
                this.loadBooks(),
                this.loadMembers(),
                this.loadCategories(),
                this.loadPublishers(),
                this.loadIssueHistory(),
                this.loadLibraryLog()
            ]);
            
            // Update UI after all data is loaded
            this.updateDashboard();
            this.populateDropdowns();
            
        } catch (error) {
            console.error('Error loading data from API:', error);
            this.showError('Failed to load data from server. Please check if the backend is running.');
        }
    }

    // API Helper Methods
    async apiCall(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['x-access-token'] = this.token;
        }
        const defaultOptions = {
            method: 'GET',
            headers: headers,
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            
            throw error;
        }
    }

    // Load Dashboard Data
    async loadDashboardData() {
        try {
            const data = await this.apiCall('/dashboard');
            // Store dashboard data for later use
            this.dashboardData = data;
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    // Load Books with Server-Side Pagination
    async loadBooks(page = 1) {
        try {
            const data = await this.apiCall(`/books?page=${page}&per_page=${this.itemsPerPage}`);
            this.books = data.books || [];
            this.totalBooks = data.total || 0;
            this.totalPages = data.pages || 1;
            this.currentPage = data.current_page || page;
            
            // Update pagination controls
            this.updatePagination(this.totalBooks);
        } catch (error) {
            console.error('Failed to load books:', error);
            this.books = [];
            this.totalBooks = 0;
            this.totalPages = 1;
        }
    }

    // Load Books with Filters
    async loadBooksWithFilters(page = 1) {
        try {
            // Build query string with filters
            let queryString = `page=${page}&per_page=${this.itemsPerPage}`;
            
            // Add filter parameters
            Object.keys(this.currentFilters).forEach(key => {
                if (this.currentFilters[key]) {
                    queryString += `&${key}=${encodeURIComponent(this.currentFilters[key])}`;
                }
            });
            
            const data = await this.apiCall(`/books?${queryString}`);
            this.books = data.books || [];
            this.totalBooks = data.total || 0;
            this.totalPages = data.pages || 1;
            this.currentPage = data.current_page || page;
            
            // Update pagination controls
            this.updatePagination(this.totalBooks);
        } catch (error) {
            console.error('Failed to load books with filters:', error);
            this.books = [];
            this.totalBooks = 0;
            this.totalPages = 1;
        }
    }

    // Load Members
    async loadMembers() {
        try {
            const data = await this.apiCall('/members');
            this.members = data; // Store full member objects, not just names
        } catch (error) {
            console.error('Failed to load members:', error);
            this.members = [];
        }
    }

    // Load Categories
    async loadCategories() {
        try {
            const data = await this.apiCall('/categories');
            this.categories = data; // Store full category objects, not just names
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = [];
        }
    }

    // Load Publishers
    async loadPublishers() {
        try {
            const data = await this.apiCall('/publishers');
            this.publishers = data; // Store full publisher objects, not just names
        } catch (error) {
            console.error('Failed to load publishers:', error);
            this.publishers = [];
        }
    }

    // Load Issue History
    async loadIssueHistory() {
        try {
            const data = await this.apiCall('/issue-history');
            this.issueHistory = data.history || [];
        } catch ( error) {
            console.error('Failed to load issue history:', error);
            this.issueHistory = [];
        }
    }

    // Load Library Log
    async loadLibraryLog() {
        try {
            const data = await this.apiCall('/library-log');
            this.libraryLog = data.logs || [];
        } catch (error) {
            console.error('Failed to load library log:', error);
            this.libraryLog = [];
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileNavMenu = document.querySelector('.mobile-nav-menu');
        const mobileOverlay = document.getElementById('mobile-overlay');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Handle navigation for both desktop and mobile nav items
        this.setupNavigationListeners();

        // Mobile Language dropdown functionality
        const languageToggle = document.getElementById('language-toggle');
        const languageDropdown = document.getElementById('language-dropdown');

        if (languageToggle && languageDropdown) {
            this.updateLanguageIcon();

            languageToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                languageDropdown.classList.add('show');
            });

            // Handle language option clicks
            languageDropdown.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const selectedLang = e.target.dataset.lang;
                    if (window.i18n) {
                        window.i18n.loadLanguage(selectedLang);
                    }
                    languageDropdown.classList.remove('show');
                    this.updateLanguageIcon();

                    // Sync desktop dropdown
                    const languageDropdownDesktop = document.getElementById('language-dropdown-desktop');
                    if (languageDropdownDesktop) {
                        this.setActiveLanguageOption(languageDropdownDesktop, selectedLang);
                    }
                });
            });
        }

        // Desktop Language dropdown functionality
        const languageToggleDesktop = document.getElementById('language-toggle-desktop');
        const languageDropdownDesktop = document.getElementById('language-dropdown-desktop');

        if (languageToggleDesktop && languageDropdownDesktop) {
            this.updateLanguageIcon();

            languageToggleDesktop.addEventListener('click', (e) => {
                e.stopPropagation();
                languageDropdownDesktop.classList.add('show');
            });

            // Handle language option clicks
            languageDropdownDesktop.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const selectedLang = e.target.dataset.lang;
                    if (window.i18n) {
                        window.i18n.loadLanguage(selectedLang);
                    }
                    languageDropdownDesktop.classList.remove('show');
                    this.updateLanguageIcon();

                    // Sync mobile dropdown
                    if (languageDropdown) {
                        this.setActiveLanguageOption(languageDropdown, selectedLang);
                    }
                });
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            if (languageDropdown) languageDropdown.classList.remove('show');
            if (languageDropdownDesktop) languageDropdownDesktop.classList.remove('show');
        });

        // Desktop Logout functionality
        const logoutBtnDesktop = document.getElementById('logout-btn-desktop');
        const logoutBtnMobile = document.getElementById('logout-btn');

        if (logoutBtnDesktop) {
            logoutBtnDesktop.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('token');
                    this.token = null;
                    this.showLoginPage();
                }
            });
        }

        if (logoutBtnMobile) {
            logoutBtnMobile.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('token');
                    this.token = null;
                    this.showLoginPage();
                }
            });
        }

        // Dashboard interactions
        document.getElementById('books-issued-card').addEventListener('click', () => {
            this.showPage('issue-history');
            this.updateActiveNav(document.querySelector('[data-page="issue-history"]'));
        });

        // Book list filters
        document.querySelectorAll('.filter-input, .filter-select').forEach(filter => {
            filter.addEventListener('input', () => this.applyFilters());
        });

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // Export CSV
        document.getElementById('export-excel').addEventListener('click', () => this.exportToCSV());

        // Add book form
        const addBookForm = document.getElementById('add-book-form');
        if (addBookForm) {
            addBookForm.addEventListener('submit', (e) => this.handleAddBook(e));
        } else {
            console.warn('add-book-form not found');
        }

        // Duplicate checking
        document.getElementById('bookName').addEventListener('input', () => this.checkDuplicates('bookName'));
        document.getElementById('author').addEventListener('input', () => this.checkDuplicates('author'));

        // Import CSV
        document.getElementById('import-excel').addEventListener('click', () => this.importFromCSV());

        // Download CSV Template
        document.getElementById('download-template').addEventListener('click', () => this.downloadCSVTemplate());

        // Bulk operations
        document.getElementById('select-all-books').addEventListener('change', (e) => this.toggleSelectAllBooks(e.target.checked));
        document.getElementById('bulk-delete-btn').addEventListener('click', () => this.bulkDeleteBooks());
        
        // Bulk operations for Members
        document.getElementById('select-all-members').addEventListener('change', (e) => this.toggleSelectAllMembers(e.target.checked));
        document.getElementById('bulk-delete-members-btn').addEventListener('click', () => this.bulkDeleteMembers());
        
        // Bulk operations for Categories
        document.getElementById('select-all-categories').addEventListener('change', (e) => this.toggleSelectAllCategories(e.target.checked));
        document.getElementById('bulk-delete-categories-btn').addEventListener('click', () => this.bulkDeleteCategories());
        
        // Bulk operations for Publishers
        document.getElementById('select-all-publishers').addEventListener('change', (e) => this.toggleSelectAllPublishers(e.target.checked));
        document.getElementById('bulk-delete-publishers-btn').addEventListener('click', () => this.bulkDeletePublishers());

        // Add log entry
        document.getElementById('add-log-btn').addEventListener('click', () => {
            const textarea = document.getElementById('new-log-entry');
            const content = textarea.value.trim();
            
            if (!content) {
                alert('Please enter a log entry before submitting.');
                return;
            }
            
            this.addLogEntry(content);
            textarea.value = ''; // Clear the textarea after adding
        });

        // Manage items
        document.getElementById('add-member-btn').addEventListener('click', () => this.addItem('member'));
        document.getElementById('add-category-btn').addEventListener('click', () => this.addItem('category'));
        document.getElementById('add-publisher-btn').addEventListener('click', () => this.addItem('publisher'));

        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });

        // Confirmation modal
        document.getElementById('confirm-cancel').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirm-ok').addEventListener('click', () => this.confirmAction());

        // Back to top
        document.getElementById('back-to-top').addEventListener('click', () => this.scrollToTop());
        window.addEventListener('scroll', () => this.toggleBackToTop());

        // Handle window resize for mobile menu
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu(); // Close mobile menu when resizing to desktop
            }
        });

        // Populate dropdowns
        this.populateDropdowns();
    }

    // Navigation
    async showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageName).classList.add('active');
        
        // Show loading indicator
        this.showLoading();
        
        try {
            if (pageName === 'books') {
                await this.loadBooks(1);
                this.renderBooksTable();
            } else if (pageName === 'issue-history') {
                await this.loadIssueHistory();
                this.renderIssueHistoryTable();
            } else if (pageName === 'library-log') {
                await this.loadLibraryLog();
                this.renderLibraryLog();
            } else if (pageName === 'members') {
                await this.loadMembers();
                this.renderMembersList();
            } else if (pageName === 'categories') {
                await this.loadCategories();
                this.renderCategoriesList();
            } else if (pageName === 'publishers') {
                await this.loadPublishers();
                this.renderPublishersList();
            }
        } catch (error) {
            console.error(`Failed to load ${pageName} data:`, error);
            this.showError(`Failed to load ${pageName} data. Please try again.`);
        } finally {
            this.hideLoading();
        }
    }

    // Loading Indicator
    showLoading(message = 'Loading...') {
        // Create loading indicator if it doesn't exist
        if (!document.getElementById('loading-indicator')) {
            const loading = document.createElement('div');
            loading.id = 'loading-indicator';
            loading.innerHTML = `<div class="loading-spinner"></div><p>${message}</p>`;
            loading.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.9);
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                text-align: center;
            `;
            document.body.appendChild(loading);
        } else {
            // Update existing loading message
            const loading = document.getElementById('loading-indicator');
            loading.querySelector('p').textContent = message;
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.remove();
        }
    }

    setupNavigationListeners() {
        // Handle both desktop and mobile navigation items
        const allNavItems = document.querySelectorAll('.nav-item');
        allNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.showPage(page);
                this.updateActiveNav(page);
                this.closeMobileMenu(); // Close mobile menu after navigation
            });
        });
    }

    updateActiveNav(activePage) {
        // Update active state for both desktop and mobile nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Mobile Menu Functions
    toggleMobileMenu() {
        const mobileNavMenu = document.querySelector('.mobile-nav-menu');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

        if (mobileNavMenu && mobileOverlay && mobileMenuToggle) {
            const isOpen = mobileNavMenu.classList.contains('active');

            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const mobileNavMenu = document.querySelector('.mobile-nav-menu');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

        if (mobileNavMenu && mobileOverlay && mobileMenuToggle) {
            mobileNavMenu.classList.add('active');
            mobileOverlay.classList.add('active');
            mobileMenuToggle.innerHTML = '<i class="fas fa-times"></i>'; // Change to X icon
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    closeMobileMenu() {
        const mobileNavMenu = document.querySelector('.mobile-nav-menu');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

        if (mobileNavMenu && mobileOverlay && mobileMenuToggle) {
            mobileNavMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
            mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>'; // Change back to hamburger icon
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    updateLanguageIcon() {
        const languageToggle = document.getElementById('language-toggle');
        const languageToggleDesktop = document.getElementById('language-toggle-desktop');
        const languageDropdown = document.getElementById('language-dropdown');
        const languageDropdownDesktop = document.getElementById('language-dropdown-desktop');

        const currentLang = (languageDropdown && languageDropdown.value) ||
                           (languageDropdownDesktop && languageDropdownDesktop.value) || 'en';

        // Update mobile icon
        if (languageToggle) {
            const icon = languageToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-language';
                languageToggle.title = currentLang === 'ar' ? 'العربية' : 'English';
            }
        }

        // Update desktop icon
        if (languageToggleDesktop) {
            const icon = languageToggleDesktop.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-language';
                languageToggleDesktop.title = currentLang === 'ar' ? 'العربية' : 'English';
            }
        }
    }


    // Dashboard
    updateDashboard() {
        if (this.dashboardData) {
            // Use API data if available
            document.getElementById('total-books').textContent = this.dashboardData.total_books || 0;
            document.getElementById('total-authors').textContent = this.dashboardData.total_authors || 0;
            document.getElementById('total-categories').textContent = this.dashboardData.total_categories || 0;
            document.getElementById('books-available').textContent = this.dashboardData.books_available || 0;
            document.getElementById('books-issued').textContent = this.dashboardData.books_issued || 0;
        } else {
            // Fallback to local data
            const totalBooks = this.books.length;
            const totalAuthors = new Set(this.books.map(book => book.author)).size;
            const totalCategories = this.categories.length;
            const booksAvailable = this.books.filter(book => book.status === 'Available').length;
            const booksIssued = this.books.filter(book => book.status === 'Issued').length;

            document.getElementById('total-books').textContent = totalBooks;
            document.getElementById('total-authors').textContent = totalAuthors;
            document.getElementById('total-categories').textContent = totalCategories;
            document.getElementById('books-available').textContent = booksAvailable;
            document.getElementById('books-issued').textContent = booksIssued;
        }
    }

    // Books Table
    renderBooksTable() {
        const tbody = document.getElementById('books-table-body');
        // No need to slice - server already sends the correct page
        const pageBooks = this.books;

        tbody.innerHTML = pageBooks.map((book, index) => `
            <tr>
                <td>
                    <input type="checkbox" class="book-select" data-book-id="${book.library_id || book.id}">
                </td>
                <td>${book.library_id || book.id}</td>
                <td>${book.bookName}</td>
                <td>${book.author}</td>
                <td>${book.category}</td>
                <td>${book.editor || '-'}</td>
                <td>${book.volumes || '-'}</td>
                <td>${book.publisher || '-'}</td>
                <td>${book.year || '-'}</td>
                <td>${book.copies || '-'}</td>
                <td>
                    <span class="status-icon ${book.status.toLowerCase()}">
                        ${book.status === 'Available' ? '+' : '-'}
                    </span>
                </td>
                <td>${book.completion_status || '-'}</td>
                <td>${book.note || '-'}</td>
                <td>
                    <div class="action-buttons">
                        ${book.status === 'Available' ?
                            `<button class="btn btn-primary btn-sm" onclick="lms.issueBook(${book.library_id || book.id})" title="Issue Book">
                                <i class="fas fa-share"></i>
                            </button>` :
                            `<button class="btn btn-secondary btn-sm" onclick="lms.returnBook(${book.library_id || book.id})" title="Return Book">
                                <i class="fas fa-undo"></i>
                            </button>`
                        }
                        <button class="btn btn-secondary btn-sm" onclick="lms.editBook(${book.library_id || book.id})" title="Edit Book">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="lms.deleteBook(${book.library_id || book.id})" title="Delete Book">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to new checkboxes
        this.setupBulkSelectionListeners();

        this.updatePagination(this.totalBooks);
    }

    // getFilteredBooks() - No longer needed with server-side filtering

    // Bulk Selection Functions
    setupMemberSelectionListeners() {
        document.querySelectorAll('.member-select').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateMemberSelectionCount());
        });
    }

    setupCategorySelectionListeners() {
        document.querySelectorAll('.category-select').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateCategorySelectionCount());
        });
    }

    setupPublisherSelectionListeners() {
        document.querySelectorAll('.publisher-select').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updatePublisherSelectionCount());
        });
    }

    toggleSelectAllMembers(checked) {
        document.querySelectorAll('.member-select').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateMemberSelectionCount();
    }

    toggleSelectAllCategories(checked) {
        document.querySelectorAll('.category-select').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateCategorySelectionCount();
    }

    toggleSelectAllPublishers(checked) {
        document.querySelectorAll('.publisher-select').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updatePublisherSelectionCount();
    }

    updateMemberSelectionCount() {
        const selected = document.querySelectorAll('.member-select:checked').length;
        document.getElementById('selected-members-count').textContent = selected;
    }

    updateCategorySelectionCount() {
        const selected = document.querySelectorAll('.category-select:checked').length;
        document.getElementById('selected-categories-count').textContent = selected;
    }

    updatePublisherSelectionCount() {
        const selected = document.querySelectorAll('.publisher-select:checked').length;
        document.getElementById('selected-publishers-count').textContent = selected;
    }

    // Bulk Delete Functions
    async bulkDeleteMembers() {
        const selectedCheckboxes = document.querySelectorAll('.member-select:checked');
        if (selectedCheckboxes.length === 0) {
            alert('Please select members to delete.');
            return;
        }

        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.memberId);
        const selectedNames = selectedIds.map(id => {
            const member = this.members.find(m => m.id == id);
            return member ? member.name : 'Unknown';
        });

        this.showConfirmModal(
            `Are you sure you want to delete ${selectedNames.length} member(s)?\n\n${selectedNames.join(', ')}`,
            async () => {
                try {
                    for (const id of selectedIds) {
                        await this.apiCall(`/members/${id}`, { method: 'DELETE' });
                    }
                    
                    await this.loadMembers();
                    this.renderMembersList();
                    this.showModal('Success', `<p>${selectedNames.length} member(s) deleted successfully!</p>`, () => this.closeModal());
                } catch (error) {
                    console.error('Failed to delete members:', error);
                    this.showError('Failed to delete some members. Please try again.');
                }
            }
        );
    }

    async bulkDeleteCategories() {
        const selectedCheckboxes = document.querySelectorAll('.category-select:checked');
        if (selectedCheckboxes.length === 0) {
            alert('Please select categories to delete.');
            return;
        }

        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.categoryId);
        const selectedNames = selectedIds.map(id => {
            const category = this.categories.find(c => c.id == id);
            return category ? category.name : 'Unknown';
        });

        this.showConfirmModal(
            `Are you sure you want to delete ${selectedNames.length} category(ies)?\n\n${selectedNames.join(', ')}\n\nNote: Books in these categories will be affected.`,
            async () => {
                try {
                    for (const id of selectedIds) {
                        await this.apiCall(`/categories/${id}`, { method: 'DELETE' });
                    }
                    
                    await this.loadCategories();
                    this.renderCategoriesList();
                    this.showModal('Success', `<p>${selectedNames.length} category(ies) deleted successfully!</p>`, () => this.closeModal());
                } catch (error) {
                    console.error('Failed to delete categories:', error);
                    this.showError('Failed to delete some categories. Please try again.');
                }
            }
        );
    }

    async bulkDeletePublishers() {
        const selectedCheckboxes = document.querySelectorAll('.publisher-select:checked');
        if (selectedCheckboxes.length === 0) {
            alert('Please select publishers to delete.');
            return;
        }

        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.publisherId);
        const selectedNames = selectedIds.map(id => {
            const publisher = this.publishers.find(p => p.id == id);
            return publisher ? publisher.name : 'Unknown';
        });

        this.showConfirmModal(
            `Are you sure you want to delete ${selectedNames.length} publisher(s)?\n\n${selectedNames.join(', ')}\n\nNote: Books from these publishers will be affected.`,
            async () => {
                try {
                    for (const id of selectedIds) {
                        await this.apiCall(`/publishers/${id}`, { method: 'DELETE' });
                    }
                    
                    await this.loadPublishers();
                    this.renderPublishersList();
                    this.showModal('Success', `<p>${selectedNames.length} publisher(s) deleted successfully!</p>`, () => this.closeModal());
                } catch (error) {
                    console.error('Failed to delete publishers:', error);
                    this.showError('Failed to delete some publishers. Please try again.');
                }
            }
        );
    }

    async applyFilters() {
        this.currentFilters = {};
        document.querySelectorAll('.filter-input, .filter-select').forEach(filter => {
            const column = filter.dataset.column;
            const value = filter.value.trim();
            if (value) {
                this.currentFilters[column] = value;
            }
        });
        
        this.currentPage = 1;
        await this.loadBooksWithFilters(1);
        this.renderBooksTable();
    }

    updatePagination(totalItems) {
        const totalPages = this.totalPages || Math.ceil(totalItems / this.itemsPerPage);
        document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages} (${totalItems} total books)`;
        
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === totalPages;
    }

    async previousPage() {
        if (this.currentPage > 1) {
            if (Object.keys(this.currentFilters).length > 0) {
                await this.loadBooksWithFilters(this.currentPage - 1);
            } else {
                await this.loadBooks(this.currentPage - 1);
            }
            this.renderBooksTable();
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            if (Object.keys(this.currentFilters).length > 0) {
                await this.loadBooksWithFilters(this.currentPage + 1);
            } else {
                await this.loadBooks(this.currentPage + 1);
            }
            this.renderBooksTable();
        }
    }

    // Book Actions
    async handleLogin(e) {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const response = await this.apiCall('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (response.token) {
                this.token = response.token;
                localStorage.setItem('token', this.token);
                this.initializeApp();
            } else {
                this.showError('Login failed. Please check your credentials.');
            }
        } catch (error) {
            this.showError('Login failed. Please check your credentials.');
        }
    }

    // Error Display Method
    showError(message) {
        this.showModal('Error', `<p style="color: red;">${message}</p>`, () => this.closeModal());
    }

    async issueBook(bookId) {
        console.log('issueBook called with bookId:', bookId);
        const book = this.books.find(b => (b.library_id || b.id) === bookId);
        console.log('Found book:', book);
        if (!book) {
            console.error('Book not found with ID:', bookId);
            return;
        }

        // Make sure members are loaded
        console.log('Current members:', this.members);
        if (this.members.length === 0) {
            console.log('Loading members...');
            await this.loadMembers();
            console.log('Members loaded:', this.members);
        }

        this.showModal('Issue Book', `
            <div class="form-group">
                <label for="issue-member">Select Member</label>
                <select id="issue-member" required>
                    <option value="">Select Member</option>
                    ${this.members.map(member => `<option value="${member.name}">${member.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="issue-date">Issue Date</label>
                <input type="date" id="issue-date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label for="return-date">Expected Return Date</label>
                <input type="date" id="return-date" required>
            </div>
        `, async () => {
            console.log('Confirm button clicked for issue book');
            const member = document.getElementById('issue-member').value;
            const issueDate = document.getElementById('issue-date').value;
            const returnDate = document.getElementById('return-date').value;
            
            console.log('Form values:', { member, issueDate, returnDate });
            
            // Validate all fields
            if (!member) {
                alert('Please select a member');
                return;
            }
            if (!issueDate) {
                alert('Please select an issue date');
                return;
            }
            if (!returnDate) {
                alert('Please select a return date');
                return;
            }
            
            if (member && issueDate && returnDate) {
                console.log('All fields validated, sending API request...');
                try {
                    // Send to API
                    const response =                 await this.apiCall(`/books/${book.library_id || book.id}/issue`, {
                        method: 'POST',
                        body: JSON.stringify({
                            memberName: member,
                            issueDate: issueDate,
                            returnDate: returnDate
                        })
                    });

                    // Reload data to get fresh state
                    await this.loadBooks();
                    this.renderBooksTable();
                    await this.loadIssueHistory();
                    this.renderIssueHistoryTable();
                    await this.loadDashboardData(); // <--- ADDED THIS LINE
                    this.updateDashboard();
                    
                    this.closeModal();
                    this.showModal('Success', `<p>Book "${book.bookName}" issued successfully to ${member}!</p>`, () => this.closeModal());
                    
                } catch (error) {
                    console.error('Failed to issue book:', error);
                    this.showError('Failed to issue book. Please try again.');
                }
            }
        });
    }

    returnBook(bookId) {
        const book = this.books.find(b => (b.library_id || b.id) === bookId);
        const issueRecord = this.issueHistory.find(ih => ih.bookName === book.bookName && ih.status === 'Pending');
        
        if (!book || !issueRecord) return;

        this.showModal('Return Book', `
            <div class="form-group">
                <label for="actual-return-date">Actual Return Date</label>
                <input type="date" id="actual-return-date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <p><strong>Book:</strong> ${book.bookName}</p>
            <p><strong>Issued to:</strong> ${issueRecord.memberName}</p>
            <p><strong>Issue Date:</strong> ${issueRecord.issueDate}</p>
            <p><strong>Expected Return:</strong> ${issueRecord.returnDate}</p>
        `, async () => {
            const actualReturnDate = document.getElementById('actual-return-date').value;
            
            if (actualReturnDate) {
                console.log(`Attempting to return book with ID: ${bookId}`);
                console.log(`Actual Return Date: ${actualReturnDate}`);
                try {
                    // Send to API
                    const response = await this.apiCall(`/books/${book.library_id || book.id}/return`, {
                        method: 'POST',
                        body: JSON.stringify({
                            actualReturnDate: actualReturnDate
                        })
                    });

                    // Reload data to get fresh state
                    await this.loadBooks();
                    this.renderBooksTable();
                    await this.loadIssueHistory();
                    this.renderIssueHistoryTable();
                    await this.loadDashboardData(); // <--- ADDED THIS LINE
                    this.updateDashboard();
                    
                    this.closeModal();
                    this.showModal('Success', `<p>Book "${book.bookName}" returned successfully!</p>`, () => this.closeModal());
                    
                } catch (error) {
                    console.error('Failed to return book:', error);
                    this.showError('Failed to return book. Please try again.');
                }
            }
        });
    }

    editBook(bookId) {
        const book = this.books.find(b => (b.library_id || b.id) === bookId);
        if (!book) return;

        this.showModal('Edit Book', `
            <div class="form-group">
                <label for="edit-bookName">Book Name</label>
                <input type="text" id="edit-bookName" value="${book.bookName}" required>
            </div>
            <div class="form-group">
                <label for="edit-author">Author</label>
                <input type="text" id="edit-author" value="${book.author}" required>
            </div>
            <div class="form-group">
                <label for="edit-volumes">Volumes</label>
                <input type="number" id="edit-volumes" value="${book.volumes || ''}" min="1">
            </div>
            <div class="form-group">
                <label for="edit-category">Category</label>
                <select id="edit-category" required>
                    ${this.categories.map(cat => `<option value="${cat}" ${cat === book.category ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="edit-publisher">Publisher</label>
                <select id="edit-publisher">
                    <option value="">Select Publisher</option>
                    ${this.publishers.map(pub => `<option value="${pub.id}" ${pub.id === book.publisher_id ? 'selected' : ''}>${pub.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="edit-year">Year</label>
                <input type="number" id="edit-year" value="${book.year || ''}" min="1800" max="2024">
            </div>
            <div class="form-group">
                <label for="edit-note">Special Note</label>
                <textarea id="edit-note" rows="3">${book.note || ''}</textarea>
            </div>
        `, async () => {
            const updatedBookData = {
                bookName: document.getElementById('edit-bookName').value,
                author: document.getElementById('edit-author').value,
                volumes: document.getElementById('edit-volumes').value || null,
                category: document.getElementById('edit-category').value,
                publisher_id: document.getElementById('edit-publisher').value || null,
                year: document.getElementById('edit-year').value || null,
                note: document.getElementById('edit-note').value || null
            };

            try {
                await this.apiCall(`/books/${book.library_id || book.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedBookData)
                });

                await this.loadBooks(this.currentPage);
                this.renderBooksTable();
                this.showModal('Success', `<p>Book "${updatedBookData.bookName}" updated successfully!</p>`, () => this.closeModal());
            } catch (error) {
                console.error('Failed to update book:', error);
                this.showError(error.message);
            }
        });
    }

    async deleteBook(bookId) {
        const book = this.books.find(b => (b.library_id || b.id) === bookId);
        if (!book) return;

        this.showConfirmModal(`Are you sure you want to delete "${book.bookName}"? This action cannot be undone.`, async () => {
            try {
                await this.apiCall(`/books/${bookId}`, {
                    method: 'DELETE'
                });

                await this.loadBooks(this.currentPage);
                this.renderBooksTable();
                this.showModal('Success', `<p>Book "${book.bookName}" deleted successfully!</p>`, () => this.closeModal());

            } catch (error) {
                console.error('Failed to delete book:', error);
                this.showError(error.message);
            }
        });
    }

    // Add Book
    async handleAddBook(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bookData = {
            bookName: formData.get('bookName'),
            author: formData.get('author'),
            category: formData.get('category'),
            editor: formData.get('editor') || null,
            volumes: formData.get('volumes') || 1,
            publisher_id: formData.get('publisher') || null,
            year: formData.get('year') || null,
            copies: formData.get('copies') || 1,
            status: formData.get('status') || 'Available',
            completion_status: formData.get('completion_status') || null,
            note: formData.get('note') || null
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        try {
            // Show loading state
            submitBtn.textContent = 'Adding...';
            submitBtn.disabled = true;

            // Send to API
            const response = await this.apiCall('/books', {
                method: 'POST',
                body: JSON.stringify(bookData)
            });

            // Add to local array
            this.books.push(response);
            
            // Reload data to get fresh state
            await this.loadBooks();
            this.renderBooksTable();
            
            // Reset form
            e.target.reset();
            
            // Show success message
            this.showModal('Success', '<p>Book added successfully!</p>', () => this.closeModal());
            
        } catch (error) {
            console.error('Failed to add book:', error);
            this.showError('Failed to add book. Please try again.');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    checkDuplicates(field) {
        const input = document.getElementById(field);
        const value = input.value.trim();
        const suggestionsDiv = document.getElementById(`${field.replace('bookName', 'book')}-suggestions`);
        
        if (value.length < 3) {
            suggestionsDiv.innerHTML = '';
            return;
        }

        const duplicates = this.books.filter(book => 
            book[field].toLowerCase().includes(value.toLowerCase())
        );

        if (duplicates.length > 0) {
            suggestionsDiv.innerHTML = `<strong>Similar ${field === 'bookName' ? 'books' : 'authors'} found:</strong><br>${duplicates.map(book => book[field]).join(', ')}`;
        } else {
            suggestionsDiv.innerHTML = '';
        }
    }

    // Issue History
    renderIssueHistoryTable() {
        const tbody = document.getElementById('issue-history-table-body');
        const filteredHistory = this.getFilteredIssueHistory();
        
        tbody.innerHTML = filteredHistory.map((record, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${record.bookName}</td>
                <td>${record.memberName}</td>
                <td>${record.issueDate}</td>
                <td>${record.returnDate || '-'}</td>
                <td>
                    <span class="status-badge ${record.status.toLowerCase()}">${record.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        ${record.status === 'Pending' ?
                            `<button class="btn btn-secondary btn-sm" onclick="lms.returnBookFromHistory(${record.id})" title="Return Book">
                                <i class="fas fa-undo"></i>
                            </button>` :
                            '<span class="text-muted">Returned</span>'
                        }
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getFilteredIssueHistory() {
        let filtered = [...this.issueHistory];
        
        const bookNameFilter = document.querySelector('[data-column="bookName"]').value;
        const memberNameFilter = document.querySelector('[data-column="memberName"]').value;
        const statusFilter = document.querySelector('[data-column="status"]').value;
        
        if (bookNameFilter) {
            filtered = filtered.filter(record => 
                record.bookName.toLowerCase().includes(bookNameFilter.toLowerCase())
            );
        }
        
        if (memberNameFilter) {
            filtered = filtered.filter(record => 
                record.memberName.toLowerCase().includes(memberNameFilter.toLowerCase())
            );
        }
        
        if (statusFilter) {
            filtered = filtered.filter(record => record.status === statusFilter);
        }
        
        return filtered;
    }

    returnBookFromHistory(recordId) {
        const record = this.issueHistory.find(r => r.id === recordId);
        
        if (!record) return;

        // Find the book by its ID, not name
        const book = this.books.find(b => b.id === record.book_id);
        if (!book) {
            this.showError('Book not found in local data!');
            return;
        }

        this.showModal('Return Book', `
            <div class="form-group">
                <label for="actual-return-date">Actual Return Date</label>
                <input type="date" id="actual-return-date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <p><strong>Book:</strong> ${record.bookName}</p>
            <p><strong>Issued to:</strong> ${record.memberName}</p>
            <p><strong>Issue Date:</strong> ${record.issueDate}</p>
            <p><strong>Expected Return:</strong> ${record.returnDate}</p>
        `, async () => {
            const actualReturnDate = document.getElementById('actual-return-date').value;
            
            if (actualReturnDate) {
                try {
                    // Make API call to return the book
                    await this.apiCall(`/books/${book.id}/return`, {
                        method: 'POST',
                        body: JSON.stringify({
                            actualReturnDate: actualReturnDate
                        })
                    });

                    // Reload relevant data and update UI
                    await this.loadBooks();
                    this.renderBooksTable();
                    await this.loadIssueHistory();
                    this.renderIssueHistoryTable();
                    await this.loadDashboardData(); // <--- ADDED THIS LINE
                    this.updateDashboard();
                    
                    this.closeModal();
                    this.showModal('Success', `<p>Book "${book.bookName}" returned successfully!</p>`, () => this.closeModal());
                    
                } catch (error) {
                    console.error('Failed to return book from history:', error);
                    this.showError(error.message);
                }
            }
        });
    }

    // Library Log
    renderLibraryLog() {
        const container = document.getElementById('log-entries');
        
        container.innerHTML = this.libraryLog.map(entry => `
            <div class="log-entry" onclick="lms.toggleLogEntry(${entry.id})">
                <div class="log-timestamp">${entry.timestamp}</div>
                <div class="log-content collapsed">${entry.content}</div>
            </div>
        `).join('');
    }

    toggleLogEntry(entryId) {
        const entry = document.querySelector(`[onclick*="${entryId}"]`);
        const content = entry.querySelector('.log-content');
        
        if (entry.classList.contains('expanded')) {
            entry.classList.remove('expanded');
            content.classList.add('collapsed');
        } else {
            entry.classList.add('expanded');
            content.classList.remove('collapsed');
        }
    }

    async addLogEntry(content) {
        try {
            // Send to API
            await this.apiCall('/library-log', {
                method: 'POST',
                body: JSON.stringify({
                    content: content,
                    log_type: 'General'
                })
            });
            
            await this.loadLibraryLog();
            this.renderLibraryLog();
            
        } catch (error) {
            console.error('Failed to add log entry:', error);
            // Fallback to local storage if API fails
            const newEntry = {
                id: Date.now(),
                timestamp: new Date().toLocaleString(),
                content: content
            };
            
            this.libraryLog.unshift(newEntry);
            this.renderLibraryLog();
        }
    }

    // Manage Items
    renderMembersList() {
        const container = document.getElementById('members-list');
        
        container.innerHTML = this.members.map(member => `
            <div class="item-row">
                <input type="checkbox" class="member-select" data-member-id="${member.id}" style="margin-right: 10px;">
                <span class="item-name">${member.name}</span>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="lms.editMember('${member.name}')" title="Edit Member">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="lms.deleteMember('${member.name}')" title="Delete Member">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Show bulk actions if there are members
        const bulkActions = document.getElementById('members-bulk-actions');
        if (this.members.length > 0) {
            bulkActions.style.display = 'block';
        } else {
            bulkActions.style.display = 'none';
        }
        
        // Add event listeners to new checkboxes
        this.setupMemberSelectionListeners();
    }

    async editMember(name) {
        this.showModal('Edit Member', `
            <div class="form-group">
                <label for="edit-member-name">Member Name</label>
                <input type="text" id="edit-member-name" value="${name}" required>
            </div>
        `, async () => {
            const newName = document.getElementById('edit-member-name').value.trim();
            if (newName && newName !== name) {
                if (this.members.includes(newName)) {
                    alert('A member with this name already exists!');
                    return;
                }
                
                try {
                    const memberData = await this.apiCall('/members');
                    const member = memberData.find(m => m.name === name);
                    
                    if (!member) {
                        this.showError('Member not found!');
                        return;
                    }
                    
                    const response = await this.apiCall(`/members/${member.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            name: newName
                        })
                    });
                    
                    await this.loadMembers();
                    this.renderMembersList();
                    
                    this.showModal('Success', `<p>Member "${name}" renamed to "${newName}" successfully!</p>`, () => this.closeModal());
                    
                } catch (error) {
                    console.error('Failed to update member:', error);
                    this.showError('Failed to update member. Please try again.');
                }
            }
        });
    }

    async deleteMember(name) {
        this.showConfirmModal(`Are you sure you want to delete member "${name}"?`, async () => {
            try {
                const memberData = await this.apiCall('/members');
                const member = memberData.find(m => m.name === name);
                
                if (!member) {
                    this.showError('Member not found!');
                    return;
                }
                
                await this.apiCall(`/members/${member.id}`, {
                    method: 'DELETE'
                });
                
                await this.loadMembers();
                this.renderMembersList();
                this.showModal('Success', `<p>Member "${name}" deleted successfully!</p>`, () => this.closeModal());
                
            } catch (error) {
                console.error('Failed to delete member:', error);
                this.showError(error.message);
            }
        });
    }

    renderCategoriesList() {
        const container = document.getElementById('categories-list');
        
        container.innerHTML = this.categories.map(category => `
            <div class="item-row">
                <input type="checkbox" class="category-select" data-category-id="${category.id}" style="margin-right: 10px;">
                <span class="item-name">${category.name}</span>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="lms.editCategory('${category.name}')" title="Edit Category">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="lms.deleteCategory('${category.name}')" title="Delete Category">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Show bulk actions if there are categories
        const bulkActions = document.getElementById('categories-bulk-actions');
        if (this.categories.length > 0) {
            bulkActions.style.display = 'block';
        } else {
            bulkActions.style.display = 'none';
        }
        
        // Add event listeners to new checkboxes
        this.setupCategorySelectionListeners();
    }

    async addCategory() {
        const input = document.getElementById('new-category');
        const name = input.value.trim();
        if (name && !this.categories.includes(name)) {
            try {
                const response = await this.apiCall('/categories', {
                    method: 'POST',
                    body: JSON.stringify({ name, description: '' })
                });
                await this.loadDataFromAPI();
                input.value = '';
                this.showModal('Success', `<p>Category "${name}" added successfully!</p>`, () => this.closeModal());
            } catch (error) {
                console.error('Failed to add category:', error);
                this.showError('Failed to add category. Please try again.');
            }
        }
    }

    async editCategory(name) {
        this.showModal('Edit Category', `
            <div class="form-group">
                <label for="edit-category-name">Category Name</label>
                <input type="text" id="edit-category-name" value="${name}" required>
            </div>
        `, async () => {
            const newName = document.getElementById('edit-category-name').value.trim();
            if (newName && newName !== name) {
                if (this.categories.includes(newName)) {
                    alert('A category with this name already exists!');
                    return;
                }
                
                try {
                    const categoryData = await this.apiCall('/categories');
                    const category = categoryData.find(c => c.name === name);
                    
                    if (!category) {
                        this.showError('Category not found!');
                        return;
                    }
                    
                    const response = await this.apiCall(`/categories/${category.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            name: newName
                        })
                    });
                    
                    await this.loadCategories();
                    this.renderCategoriesList();
                    
                    this.showModal('Success', `<p>Category "${name}" renamed to "${newName}" successfully!</p>`, () => this.closeModal());
                    
                } catch (error) {
                    console.error('Failed to update category:', error);
                    this.showError('Failed to update category. Please try again.');
                }
            }
        });
    }

    async deleteCategory(name) {
        this.showConfirmModal(`Are you sure you want to delete category "${name}"? Books in this category will be affected.`, async () => {
            try {
                const categoryData = await this.apiCall('/categories');
                const category = categoryData.find(c => c.name === name);
                
                if (!category) {
                    this.showError('Category not found!');
                    return;
                }
                
                await this.apiCall(`/categories/${category.id}`, {
                    method: 'DELETE'
                });
                
                await this.loadCategories();
                this.renderCategoriesList();
                this.showModal('Success', `<p>Category "${name}" deleted successfully!</p>`, () => this.closeModal());
                
            } catch (error) {
                console.error('Failed to delete category:', error);
                this.showError(error.message);
            }
        });
    }

    renderPublishersList() {
        const container = document.getElementById('publishers-list');
        
        container.innerHTML = this.publishers.map(publisher => `
            <div class="item-row">
                <input type="checkbox" class="publisher-select" data-publisher-id="${publisher.id}" style="margin-right: 10px;">
                <span class="item-name">${publisher.name}</span>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="lms.editPublisher('${publisher.name}')" title="Edit Publisher">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="lms.deletePublisher('${publisher.name}')" title="Delete Publisher">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Show bulk actions if there are publishers
        const bulkActions = document.getElementById('publishers-bulk-actions');
        if (this.publishers.length > 0) {
            bulkActions.style.display = 'block';
        } else {
            bulkActions.style.display = 'none';
        }
        
        // Add event listeners to new checkboxes
        this.setupPublisherSelectionListeners();
    }

    async addPublisher() {
        const input = document.getElementById('new-publisher');
        const name = input.value.trim();
        if (name && !this.publishers.find(p => p.name === name)) {
            try {
                const response = await this.apiCall('/publishers', {
                    method: 'POST',
                    body: JSON.stringify({ name, address: '', contact_info: '' })
                });
                await this.loadDataFromAPI();
                input.value = '';
                this.showModal('Success', `<p>Publisher "${name}" added successfully!</p>`, () => this.closeModal());
            } catch (error) {
                console.error('Failed to add publisher:', error);
                this.showError('Failed to add publisher. Please try again.');
            }
        }
    }

    async editPublisher(name) {
        this.showModal('Edit Publisher', `
            <div class="form-group">
                <label for="edit-publisher-name">Publisher Name</label>
                <input type="text" id="edit-publisher-name" value="${name}" required>
            </div>
        `, async () => {
            const newName = document.getElementById('edit-publisher-name').value.trim();
            if (newName && newName !== name) {
                if (this.publishers.find(p => p.name === newName)) {
                    alert('A publisher with this name already exists!');
                    return;
                }
                
                try {
                    const publisher = this.publishers.find(p => p.name === name);
                    
                    if (!publisher) {
                        this.showError('Publisher not found!');
                        return;
                    }
                    
                    const response = await this.apiCall(`/publishers/${publisher.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            name: newName
                        })
                    });
                    
                    await this.loadPublishers();
                    this.renderPublishersList();
                    
                    this.showModal('Success', `<p>Publisher "${name}" renamed to "${newName}" successfully!</p>`, () => this.closeModal());
                    
                } catch (error) {
                    console.error('Failed to update publisher:', error);
                    this.showError('Failed to update publisher. Please try again.');
                }
            }
        });
    }

    async deletePublisher(name) {
        this.showConfirmModal(`Are you sure you want to delete publisher "${name}"? Books from this publisher will be affected.`, async () => {
            try {
                const publisher = this.publishers.find(p => p.name === name);
                
                if (!publisher) {
                    this.showError('Publisher not found!');
                    return;
                }
                
                await this.apiCall(`/publishers/${publisher.id}`, {
                    method: 'DELETE'
                });
                
                await this.loadPublishers();
                this.renderPublishersList();
                this.showModal('Success', `<p>Publisher "${name}" deleted successfully!</p>`, () => this.closeModal());
                
            } catch (error) {
                console.error('Failed to delete publisher:', error);
                this.showError(error.message);
            }
        });
    }

        async addItem(itemType) {
        const input = document.getElementById(`new-${itemType}`);
        if (!input) {
            this.showError(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} input field not found`);
            return;
        }
        const name = input.value.trim();
        if (!name) {
            this.showError(`Please enter a ${itemType} name`);
            input.focus();
            return;
        }

        let payload = { name };
        if (itemType === 'member') {
            payload.email = `${name.toLowerCase().replace(/\s/g, '')}_${Date.now()}@example.com`;
            payload.phone = '';
            payload.address = '';
        } else if (itemType === 'category') {
            payload.description = '';
        } else if (itemType === 'publisher') {
            payload.address = '';
            payload.contact_info = '';
        }

        let apiEndpoint = `/${itemType}s`;
        if (itemType === 'category') {
            apiEndpoint = '/categories';
        } else if (itemType === 'publisher') {
            apiEndpoint = '/publishers';
        }

        try {
            const response = await this.apiCall(apiEndpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            // Reload the appropriate data and render the list
            if (itemType === 'category') {
                await this.loadCategories();
                this.renderCategoriesList();
            } else if (itemType === 'member') {
                await this.loadMembers();
                this.renderMembersList();
            } else if (itemType === 'publisher') {
                await this.loadPublishers();
                this.renderPublishersList();
            }
            input.value = '';
            this.showModal('Success', `<p>${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${name}" added successfully!</p>`, () => this.closeModal());
        } catch (error) {
            console.error(`Failed to add ${itemType}:`, error);
            this.showError(`Failed to add ${itemType}. Please try again.`);
        }
    }


    async deletePublisher(name) {
        this.showConfirmModal(`Are you sure you want to delete publisher "${name}"? Books from this publisher will be affected.`, async () => {
            try {
                const publisher = this.publishers.find(p => p.name === name);
                
                if (!publisher) {
                    this.showError('Publisher not found!');
                    return;
                }
                
                await this.apiCall(`/publishers/${publisher.id}`, {
                    method: 'DELETE'
                });
                
                await this.loadPublishers();
                this.renderPublishersList();
                this.showModal('Success', `<p>Publisher "${name}" deleted successfully!</p>`, () => this.closeModal());
                
            } catch (error) {
                console.error('Failed to delete publisher:', error);
                this.showError(error.message);
            }
        });
    }

    // Utility Functions
    populateDropdowns() {
        // Categories dropdown
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>' + 
                this.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
        }

        // Publishers dropdown
        const publisherSelect = document.getElementById('publisher');
        if (publisherSelect) {
            publisherSelect.innerHTML = '<option value="">Select Publisher</option>' + 
                this.publishers.map(pub => `<option value="${pub.id}">${pub.name}</option>`).join('');
        }
    }

    // Modal Management
    showModal(title, content, onConfirm) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        
        if (onConfirm) {
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.textContent = 'Confirm';
            confirmBtn.onclick = onConfirm;
            document.getElementById('modal-body').appendChild(confirmBtn);
        }
        
        document.getElementById('modal-overlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    showConfirmModal(message, onConfirm) {
        document.getElementById('confirm-message').textContent = message;
        this.pendingConfirmAction = onConfirm;
        document.getElementById('confirm-modal-overlay').classList.add('active');
    }

    closeConfirmModal() {
        document.getElementById('confirm-modal-overlay').classList.remove('active');
        this.pendingConfirmAction = null;
    }

    confirmAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
        }
        this.closeConfirmModal();
    }

    // Export/Import
    async exportToCSV() {
        try {
            // Show loading message
            this.showLoading('Exporting books to CSV...');

            // Download CSV file from server with UTF-8 support
            const response = await fetch(`${this.apiBaseUrl}/books/export-csv`, {
                headers: {
                    'x-access-token': this.token
                }
            });

            // Hide loading message
            this.hideLoading();

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'library_books_export.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Clean up
                setTimeout(() => window.URL.revokeObjectURL(url), 100);

                alert('Books exported successfully to CSV with UTF-8 encoding!\nSupports Arabic, Bengali, and other languages.');
            } else {
                alert('Error exporting books');
            }

        } catch (error) {
            // Hide loading message on error
            this.hideLoading();
            console.error('Export error:', error);
            alert('Error exporting books: ' + error.message);
        }
    }

    importFromCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.processCSVImport(file);
            }
        };
        input.click();
    }

    async processCSVImport(file) {
        try {
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.xlsx')) {
                alert('Please select a CSV (.csv) or Excel (.xlsx) file\nBoth formats support Arabic, Bengali, and other languages with UTF-8 encoding.');
                return;
            }

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);

            // Show loading message
            this.showLoading('Importing books from CSV file with UTF-8 encoding...');

            // Upload file to server
            const response = await fetch(`${this.apiBaseUrl}/books/import-csv`, {
                method: 'POST',
                headers: {
                    'x-access-token': this.token
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                // Success - hide loading message
                this.hideLoading();
                
                let message = result.message;
                if (result.updated_count > 0) {
                    message += `\n\n✅ Smart Update: ${result.updated_count} existing books were updated with new information instead of creating duplicates!`;
                }
                if (result.errors && result.errors.length > 0) {
                    message += '\n\nErrors encountered:\n' + result.errors.join('\n');
                }
                message += '\n\nNote: CSV format perfectly supports Arabic, Bengali, and other languages!';
                alert(message);

                // Reload data to reflect changes
                await this.loadBooks();
                this.updateDashboard();
                this.renderBooksTable();

            } else {
                // Error - hide loading message
                this.hideLoading();
                alert('Import failed: ' + result.error);
            }

        } catch (error) {
            // Hide loading message on error
            this.hideLoading();
            console.error('CSV import error:', error);
            alert('Error importing CSV file: ' + error.message);
        }
    }

    async downloadCSVTemplate() {
        try {
            // Download CSV template with multilingual support
            const response = await fetch(`${this.apiBaseUrl}/books/csv-template`, {
                headers: {
                    'x-access-token': this.token
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'book_import_template.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Clean up
                setTimeout(() => window.URL.revokeObjectURL(url), 100);

                // Show template info
                this.showCSVTemplateInfo();
            } else {
                alert('Error downloading CSV template');
            }

        } catch (error) {
            console.error('CSV template download error:', error);
            alert('Error downloading CSV template: ' + error.message);
        }
    }

    async showCSVTemplateInfo() {
        try {
            const response = await this.apiCall('/books/csv-template-info');

            if (response.message) {
                const templateInfo = `
CSV Template Downloaded! 🌍

Format: ${response.file_format}
Encoding: ${response.encoding}

Required Columns:
• ${response.required_columns.join('\n• ')}

Optional Columns:
• ${response.optional_columns.join('\n• ')}

Multilingual Support:
${response.multilingual_support.join('\n')}

Instructions:
${response.instructions.join('\n')}

The template contains examples in English, Bengali (বাংলা), and Arabic (العربية).
                `;
                alert(templateInfo);
            }
        } catch (error) {
            console.error('CSV template info error:', error);
        }
    }

    // Setup bulk selection listeners for dynamically created checkboxes
    setupBulkSelectionListeners() {
        const checkboxes = document.querySelectorAll('.book-select');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateBulkDeleteButton());
        });
    }

    // Bulk Operations
    toggleSelectAllBooks(checked) {
        const checkboxes = document.querySelectorAll('.book-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBulkDeleteButton();
    }

    updateBulkDeleteButton() {
        const selectedCheckboxes = document.querySelectorAll('.book-select:checked');
        const selectedCount = selectedCheckboxes.length;
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        const selectedCountSpan = document.getElementById('selected-count');

        selectedCountSpan.textContent = selectedCount;

        if (selectedCount > 0) {
            bulkDeleteBtn.style.display = 'inline-block';
        } else {
            bulkDeleteBtn.style.display = 'none';
        }

        // Update select all checkbox state
        const totalCheckboxes = document.querySelectorAll('.book-select');
        const selectAllCheckbox = document.getElementById('select-all-books');
        selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCheckboxes.length;
        selectAllCheckbox.checked = selectedCount > 0 && selectedCount === totalCheckboxes.length;
    }

    async bulkDeleteBooks() {
        const selectedCheckboxes = document.querySelectorAll('.book-select:checked');
        const selectedBookIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.bookId));

        if (selectedBookIds.length === 0) {
            alert('No books selected');
            return;
        }

        const bookNames = Array.from(selectedCheckboxes).map(cb => {
            const row = cb.closest('tr');
            return row.cells[2].textContent; // Book name column
        });

        const confirmMessage = `Are you sure you want to delete ${selectedBookIds.length} selected books?\n\nBooks to delete:\n${bookNames.slice(0, 5).join('\n')}${bookNames.length > 5 ? '\n...' : ''}`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await this.apiCall('/books/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ book_ids: selectedBookIds })
            });

            alert(response.message);

            // Reload all data to update the application
            await this.loadBooks();
            await this.loadDashboardData();
            this.updateDashboard();
            this.renderBooksTable();

            // Reset bulk selection
            document.getElementById('select-all-books').checked = false;
            this.updateBulkDeleteButton();

        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Error deleting books: ' + error.message);
        }
    }

    // Back to Top
    toggleBackToTop() {
        const backToTop = document.getElementById('back-to-top');
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Initialize the application after DOM is loaded
let lms; // Declare globally
document.addEventListener('DOMContentLoaded', () => {
    lms = new LibraryManagementSystem();
    window.lms = lms; // Make it globally accessible
});

// Global safety check for lms object
window.lms = window.lms || {
    addMember: () => console.warn('Library Management System not yet loaded'),
    addCategory: () => console.warn('Library Management System not yet loaded'),
    addPublisher: () => console.warn('Library Management System not yet loaded'),
    editMember: () => console.warn('Library Management System not yet loaded'),
    editCategory: () => console.warn('Library Management System not yet loaded'),
    editPublisher: () => console.warn('Library Management System not yet loaded'),
    deleteMember: () => console.warn('Library Management System not yet loaded'),
    deleteCategory: () => console.warn('Library Management System not yet loaded'),
    deletePublisher: () => console.warn('Library Management System not yet loaded'),
    issueBook: () => console.warn('Library Management System not yet loaded'),
    returnBook: () => console.warn('Library Management System not yet loaded'),
    editBook: () => console.warn('Library Management System not yet loaded'),
    deleteBook: () => console.warn('Library Management System not yet loaded'),
    toggleLogEntry: () => console.warn('Library Management System not yet loaded')
};

// Add some CSS for status badges, action buttons, and loading spinner
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .status-badge.available {
        background-color: #d4edda;
        color: #155724;
    }
    
    .status-badge.issued {
        background-color: #fff3cd;
        color: #856404;
    }
    
    .status-badge.pending {
        background-color: #fff3cd;
        color: #856404;
    }
    
    .status-badge.returned {
        background-color: #d1ecf1;
        color: #0c5460;
    }
    
    .action-buttons {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
    }
    
    .text-muted {
        color: #6c757d;
        font-style: italic;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .api-status {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10001;
        display: none;
    }
    
    .api-status.connected {
        background-color: #28a745;
    }
    
    .api-status.disconnected {
        background-color: #dc3545;
    }
`;
document.head.appendChild(style);
