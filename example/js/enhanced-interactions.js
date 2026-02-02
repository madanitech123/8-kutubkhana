// Enhanced Interactions for LMS - Beautiful Animations and Effects

// Smooth scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Loading state management
function showLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    const spinner = btn.querySelector('.loading-spinner');
    const text = btn.querySelector('#btn-text');
    
    btn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (text) text.textContent = 'Loading...';
}

function hideLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    const spinner = btn.querySelector('.loading-spinner');
    const text = btn.querySelector('#btn-text');
    
    btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (text) text.textContent = 'Submit';
}

// Add stagger animation to lists
function addStaggerAnimation(container) {
    const items = container.querySelectorAll('li, .stat-card, .data-table tbody tr');
    items.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('slide-in-left');
    });
}

// Enhanced hover effects for stat cards
function enhanceStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)';
        });
    });
}

// Enhanced button interactions
function enhanceButtons() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Animate elements on scroll
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, {
        threshold: 0.1
    });

    const elements = document.querySelectorAll('.stat-card, .table-container, .form-container');
    elements.forEach(el => observer.observe(el));
}

// Enhanced table row animations
function enhanceTableRows() {
    const tableRows = document.querySelectorAll('.data-table tbody tr');
    tableRows.forEach((row, index) => {
        row.style.animationDelay = `${index * 0.05}s`;
        row.classList.add('slide-in-left');
    });
}

// Add ripple effect to buttons
function addRippleEffect() {
    const buttons = document.querySelectorAll('.btn, .stat-card, .control-icon');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add CSS for ripple effect
function addRippleCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .btn, .stat-card, .control-icon {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
}

// Animation Style Controller
function setAnimationStyle(style = 'synchronized') {
    const statGrid = document.querySelector('.stats-grid');
    if (!statGrid) return;
    
    // Remove all animation classes
    statGrid.classList.remove('synchronized', 'staggered', 'wave');
    
    // Add the selected style
    statGrid.classList.add(style);
    
    console.log(`🎬 Animation style changed to: ${style}`);
}

// Initialize all enhancements
function initializeEnhancements() {
    // Add ripple CSS
    addRippleCSS();
    
    // Enhance existing elements
    enhanceStatCards();
    enhanceButtons();
    enhanceTableRows();
    
    // Add animations
    animateOnScroll();
    addRippleEffect();
    
    // Enhance all pages
    enhanceAllPages();
    
    // Set default animation style (synchronized for balanced appearance)
    setAnimationStyle('synchronized');
    
    console.log('🎨 Enhanced styling initialized successfully!');
    console.log('✨ All pages now have consistent animations and styling');
    console.log('💡 To change animation style, use: setAnimationStyle("synchronized|staggered|wave")');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEnhancements);

// Re-initialize when navigating between pages (for SPA behavior)
function reinitializeEnhancements() {
    setTimeout(() => {
        enhanceStatCards();
        enhanceButtons();
        enhanceTableRows();
        addRippleEffect();
        enhanceAllPages();
    }, 100);
}

// Enhance all pages with consistent animations
function enhanceAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        // Add fade-in-up animation to all pages
        if (!page.classList.contains('fade-in-up')) {
            page.classList.add('fade-in-up');
        }
        
        // Enhance containers within pages
        const containers = page.querySelectorAll('.table-container, .form-container, .log-container, .manage-container');
        containers.forEach(container => {
            container.classList.add('fade-in-up');
        });
    });
    
    // Enhance all buttons throughout the app
    const allButtons = document.querySelectorAll('.btn');
    allButtons.forEach(btn => {
        if (!btn.classList.contains('enhanced')) {
            btn.classList.add('enhanced');
            // Add click ripple effect
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        }
    });
    
    // Enhance table rows with smooth animations
    const tableRows = document.querySelectorAll('.data-table tbody tr');
    tableRows.forEach((row, index) => {
        row.style.animationDelay = `${index * 0.02}s`;
        if (!row.classList.contains('slide-in-left')) {
            row.classList.add('slide-in-left');
        }
    });
}

// Export functions for use in main app
window.enhancedInteractions = {
    scrollToTop,
    showLoading,
    hideLoading,
    addStaggerAnimation,
    enhanceStatCards,
    enhanceButtons,
    animateOnScroll,
    enhanceTableRows,
    addRippleEffect,
    initializeEnhancements,
    reinitializeEnhancements,
    setAnimationStyle,
    enhanceAllPages
};

// Make key functions globally available
window.setAnimationStyle = setAnimationStyle;
window.enhanceAllPages = enhanceAllPages;
