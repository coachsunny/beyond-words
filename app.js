/**
 * 言未盡處 (Beyond Words) - Reader Application Script
 * Pure Vanilla JavaScript for high performance, smooth routing, and offline support.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentBookId: 'those-unspoken-words',
    currentChapterNumber: 1,
    currentTheme: 'paper', // 'paper' | 'night' | 'light'
    currentFontSize: 'medium', // 'small' | 'medium' | 'large' | 'xlarge'
    books: []
  };

  const fontSizes = ['small', 'medium', 'large', 'xlarge'];

  // DOM Elements
  const el = {
    body: document.body,
    header: document.getElementById('site-header'),
    readerControls: document.getElementById('reader-controls'),
    progressBar: document.getElementById('scroll-progress-bar'),
    progressContainer: document.getElementById('scroll-progress-container'),
    
    // Views
    viewBookshelf: document.getElementById('view-bookshelf'),
    viewBookDetail: document.getElementById('view-book-detail'),
    viewReader: document.getElementById('view-reader'),

    // Theme & Font
    btnTheme: document.getElementById('btn-theme'),
    themeIcon: document.getElementById('current-theme-icon'),
    themeLabel: document.getElementById('current-theme-label'),
    btnFontDec: document.getElementById('btn-font-dec'),
    btnFontInc: document.getElementById('btn-font-inc'),

    // Containers
    booksGrid: document.getElementById('books-grid'),
    bookDetailContent: document.getElementById('book-detail-content'),
    readerBody: document.getElementById('reader-body'),
    readerChapterTitle: document.getElementById('reader-chapter-title'),
    readerMetaSections: document.getElementById('reader-meta-sections'),
    readerMetaWords: document.getElementById('reader-meta-words'),
    readerBreadcrumbCh: document.getElementById('reader-breadcrumb-ch'),
    readerBookLink: document.getElementById('reader-book-link'),

    // Nav Buttons
    btnPrevChapter: document.getElementById('btn-prev-chapter'),
    btnNextChapter: document.getElementById('btn-next-chapter'),
    prevChTitle: document.getElementById('prev-ch-title'),
    nextChTitle: document.getElementById('next-ch-title'),
    btnBackToBook: document.getElementById('btn-back-to-book'),

    // TOC Dialog
    tocDialog: document.getElementById('toc-dialog'),
    btnToc: document.getElementById('btn-toc'),
    btnCloseToc: document.getElementById('btn-close-toc'),
    tocBookSummary: document.getElementById('toc-book-summary'),
    tocChapterList: document.getElementById('toc-chapter-list')
  };

  // Initialize
  function init() {
    loadSavedPreferences();
    loadBooksData();
    setupEventListeners();
    handleRoute();
  }

  function loadSavedPreferences() {
    try {
      const savedTheme = localStorage.getItem('beyond-words-theme');
      if (savedTheme && ['paper', 'night', 'light'].includes(savedTheme)) {
        setTheme(savedTheme, false);
      } else {
        setTheme('paper', false);
      }

      const savedFontSize = localStorage.getItem('beyond-words-fontsize');
      if (savedFontSize && fontSizes.includes(savedFontSize)) {
        setFontSize(savedFontSize, false);
      } else {
        setFontSize('medium', false);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  }

  function loadBooksData() {
    if (window.BEYOND_WORDS_DATA && window.BEYOND_WORDS_DATA.books) {
      state.books = window.BEYOND_WORDS_DATA.books;
    } else {
      console.error('Novel data not loaded.');
      state.books = [];
    }
    renderBookshelf();
  }

  function setupEventListeners() {
    // Window hash change routing
    window.addEventListener('hashchange', handleRoute);

    // Scroll progress listener
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Theme toggle
    el.btnTheme.addEventListener('click', toggleTheme);

    // Font size controls
    el.btnFontDec.addEventListener('click', () => stepFontSize(-1));
    el.btnFontInc.addEventListener('click', () => stepFontSize(1));

    // TOC dialog controls
    el.btnToc.addEventListener('click', openTocDialog);
    el.btnCloseToc.addEventListener('click', closeTocDialog);

    // Light dismiss on dialog backdrop click
    el.tocDialog.addEventListener('click', (e) => {
      const rect = el.tocDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeTocDialog();
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      // Don't intercept if dialog is open or user is typing in an input
      if (el.tocDialog.open) return;
      if (el.viewReader.style.display !== 'none') {
        if (e.key === 'ArrowLeft') {
          navigateToAdjacentChapter(-1);
        } else if (e.key === 'ArrowRight') {
          navigateToAdjacentChapter(1);
        }
      }
    });
  }

  // Routing Handler
  function handleRoute() {
    const hash = window.location.hash || '#bookshelf';
    
    // Close TOC dialog on route change
    if (el.tocDialog.open) {
      el.tocDialog.close();
    }

    if (hash === '#bookshelf' || hash === '') {
      showBookshelf();
    } else if (hash.startsWith('#book/')) {
      const bookId = hash.replace('#book/', '');
      showBookDetail(bookId);
    } else if (hash.startsWith('#read/')) {
      const parts = hash.replace('#read/', '').split('/');
      const bookId = parts[0];
      const chNum = parseInt(parts[1]?.replace('ch-', ''), 10) || 1;
      showReader(bookId, chNum);
    } else {
      showBookshelf();
    }
  }

  // View Switchers
  function switchView(activeView) {
    el.viewBookshelf.style.display = 'none';
    el.viewBookshelf.classList.remove('active');
    
    el.viewBookDetail.style.display = 'none';
    el.viewBookDetail.classList.remove('active');
    
    el.viewReader.style.display = 'none';
    el.viewReader.classList.remove('active');

    activeView.style.display = 'block';
    setTimeout(() => activeView.classList.add('active'), 10);

    // Toggle reader-only controls
    const isReader = (activeView === el.viewReader);
    el.readerControls.style.display = isReader ? 'flex' : 'none';
    el.progressContainer.style.display = isReader ? 'block' : 'none';

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function showBookshelf() {
    switchView(el.viewBookshelf);
    document.title = '言未盡處 | Sunny Lee 的心靈小說書房';
  }

  function showBookDetail(bookId) {
    const book = state.books.find(b => b.id === bookId) || state.books[0];
    if (!book) return;
    
    state.currentBookId = book.id;
    renderBookDetailPage(book);
    switchView(el.viewBookDetail);
    document.title = `${book.title} | 目錄導讀 - 言未盡處`;
  }

  function showReader(bookId, chNum) {
    const book = state.books.find(b => b.id === bookId) || state.books[0];
    if (!book) return;

    state.currentBookId = book.id;
    state.currentChapterNumber = chNum;
    
    // Save last read progress
    try {
      localStorage.setItem(`last-read-${book.id}`, chNum);
    } catch (e) {}

    renderChapter(book, chNum);
    switchView(el.viewReader);
  }

  // Render Bookshelf Cards
  function renderBookshelf() {
    el.booksGrid.innerHTML = '';
    state.books.forEach(book => {
      const hasChapters = (book.chapters && book.chapters.length > 0);
      let lastReadCh = 1;
      try {
        lastReadCh = parseInt(localStorage.getItem(`last-read-${book.id}`), 10) || 1;
      } catch (e) {}

      const card = document.createElement('article');
      card.className = 'book-card';
      card.innerHTML = `
        <div class="book-card-cover-wrap">
          <img src="${book.cover}" alt="${book.title} 封面" class="book-card-cover" loading="lazy">
          <span class="book-badge ${hasChapters ? 'active-badge' : ''}">${book.status}</span>
        </div>
        <div class="book-card-body">
          <span class="book-genre">${book.genre || '心靈小說'}</span>
          <h3 class="book-card-title">${book.title}</h3>
          <p class="book-card-subtitle">${book.subtitle || ''}</p>
          ${book.quote ? `<blockquote class="book-card-quote">${book.quote}</blockquote>` : ''}
          <p class="book-card-desc">${book.description}</p>
          <div class="book-card-meta">
            <span>✍️ ${book.author}</span>
            <span>·</span>
            <span>📖 ${hasChapters ? `共 ${book.chapters.length} 回` : '規劃中'}</span>
            <span>·</span>
            <span>📝 ${book.word_count}</span>
          </div>
          <div class="book-card-actions">
            ${hasChapters ? `
              <a href="#read/${book.id}/ch-${lastReadCh}" class="btn-primary">
                <span>${lastReadCh > 1 ? `繼續閱讀 (第 ${lastReadCh} 回)` : '開始沉浸閱讀'}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </a>
              <a href="#book/${book.id}" class="btn-secondary">完整目錄</a>
            ` : `
              <button type="button" class="btn-secondary" style="width: 100%; opacity: 0.75; cursor: default;">
                作品籌備中，敬請期待
              </button>
            `}
          </div>
        </div>
      `;
      el.booksGrid.appendChild(card);
    });
  }

  // Render Book Detail Page
  function renderBookDetailPage(book) {
    const chapters = book.chapters || [];
    let lastReadCh = 1;
    try {
      lastReadCh = parseInt(localStorage.getItem(`last-read-${book.id}`), 10) || 1;
    } catch (e) {}

    el.bookDetailContent.innerHTML = `
      <div class="book-detail-header">
        <img src="${book.cover}" alt="${book.title} 封面" class="book-detail-cover">
        <div class="book-detail-info">
          <span class="book-genre">${book.genre}</span>
          <h2 class="book-detail-title">${book.title}</h2>
          <p class="book-detail-subtitle">${book.subtitle}</p>
          ${book.quote ? `<blockquote class="book-card-quote" style="margin-bottom: 1rem;">${book.quote}</blockquote>` : ''}
          <p class="hero-desc" style="font-size: 0.95rem; margin-bottom: 1.5rem;">${book.description}</p>
          
          <div class="book-card-actions" style="max-width: 320px;">
            <a href="#read/${book.id}/ch-${lastReadCh}" class="btn-primary">
              <span>${lastReadCh > 1 ? `繼續閱讀 (第 ${lastReadCh} 回)` : '從第一回開始讀'}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </a>
          </div>
        </div>
      </div>

      <div class="toc-container">
        <h3 class="section-title">
          <span>📑 完整章節目錄</span>
          <small class="section-subtitle">全書收錄 ${chapters.length} 回，點擊立即閱讀</small>
        </h3>

        <div class="toc-grid">
          ${chapters.map(ch => {
            const firstPara = (ch.sections[0] && ch.sections[0].paragraphs[0]) ? ch.sections[0].paragraphs[0].slice(0, 52) + '...' : '';
            return `
              <a href="#read/${book.id}/ch-${ch.chapter_number}" class="toc-card-link">
                <div class="toc-item-header">
                  <span class="toc-item-title">${ch.title}</span>
                  <span class="toc-item-count">${ch.sections.length} 節</span>
                </div>
                <p class="toc-item-snippet">${firstPara}</p>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Render Reader Chapter View
  function renderChapter(book, chNum) {
    const chapters = book.chapters || [];
    const chapter = chapters.find(c => c.chapter_number === chNum) || chapters[0];
    if (!chapter) return;

    // Header Meta
    el.readerBreadcrumbCh.textContent = `第 ${chapter.chapter_number} 回`;
    el.readerBookLink.textContent = book.title;
    el.readerBookLink.href = `#book/${book.id}`;
    el.readerChapterTitle.textContent = chapter.title;
    el.readerMetaSections.textContent = `共 ${chapter.sections.length} 節`;
    
    // Estimate word count
    let totalChars = 0;
    chapter.sections.forEach(sec => {
      sec.paragraphs.forEach(p => totalChars += p.length);
      if (sec.reflection) {
        sec.reflection.paragraphs.forEach(p => totalChars += p.length);
      }
    });
    el.readerMetaWords.textContent = `約 ${Math.round(totalChars / 100) * 100} 字`;

    document.title = `${chapter.title} | ${book.title} - 言未盡處`;

    // Render Body Sections
    el.readerBody.innerHTML = '';
    chapter.sections.forEach(sec => {
      const secWrap = document.createElement('section');
      secWrap.className = 'reader-section-wrap';

      // Section Title
      const secTitle = document.createElement('h2');
      secTitle.className = 'reader-section-title';
      secTitle.textContent = sec.title;
      secWrap.appendChild(secTitle);

      // Story Paragraphs
      sec.paragraphs.forEach(text => {
        if (!text.trim()) return;
        const p = document.createElement('p');
        p.className = 'reader-paragraph';
        p.textContent = text;
        secWrap.appendChild(p);
      });

      // Reflection Note Card (if present)
      if (sec.reflection && sec.reflection.paragraphs.length > 0) {
        const card = document.createElement('div');
        card.className = 'reflection-card';

        const cardTitle = document.createElement('h3');
        cardTitle.className = 'reflection-title';
        cardTitle.textContent = sec.reflection.title || '【易新省思札記】';
        card.appendChild(cardTitle);

        sec.reflection.paragraphs.forEach(rp => {
          if (!rp.trim()) return;
          const rEl = document.createElement('p');
          rEl.className = 'reflection-paragraph';
          rEl.textContent = rp;
          card.appendChild(rEl);
        });

        secWrap.appendChild(card);
      }

      el.readerBody.appendChild(secWrap);
    });

    // Navigation Buttons Setup
    const prevCh = chapters.find(c => c.chapter_number === chNum - 1);
    const nextCh = chapters.find(c => c.chapter_number === chNum + 1);

    if (prevCh) {
      el.btnPrevChapter.style.visibility = 'visible';
      el.prevChTitle.textContent = prevCh.title;
      el.btnPrevChapter.onclick = () => {
        window.location.hash = `#read/${book.id}/ch-${prevCh.chapter_number}`;
      };
    } else {
      el.btnPrevChapter.style.visibility = 'hidden';
    }

    if (nextCh) {
      el.btnNextChapter.style.visibility = 'visible';
      el.nextChTitle.textContent = nextCh.title;
      el.btnNextChapter.onclick = () => {
        window.location.hash = `#read/${book.id}/ch-${nextCh.chapter_number}`;
      };
    } else {
      el.btnNextChapter.style.visibility = 'hidden';
    }

    el.btnBackToBook.href = `#book/${book.id}`;
    
    // Update TOC drawer contents
    renderTocDrawer(book, chNum);
  }

  function navigateToAdjacentChapter(dir) {
    const book = state.books.find(b => b.id === state.currentBookId);
    if (!book) return;
    const targetNum = state.currentChapterNumber + dir;
    const targetChapter = book.chapters.find(c => c.chapter_number === targetNum);
    if (targetChapter) {
      window.location.hash = `#read/${book.id}/ch-${targetNum}`;
    }
  }

  // Render TOC Drawer List
  function renderTocDrawer(book, currentChNum) {
    el.tocBookSummary.innerHTML = `
      <p style="font-weight: 600; font-size: 1.05rem; margin-bottom: 0.3rem;">${book.title}</p>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Sunny Lee 作品 · 共 ${book.chapters.length} 回</p>
    `;

    el.tocChapterList.innerHTML = '';
    book.chapters.forEach(ch => {
      const li = document.createElement('li');
      li.className = `toc-chapter-item ${ch.chapter_number === currentChNum ? 'active' : ''}`;
      li.innerHTML = `
        <a href="#read/${book.id}/ch-${ch.chapter_number}">
          <span>${ch.title}</span>
          <span style="font-size: 0.8rem; opacity: 0.7;">${ch.sections.length} 節</span>
        </a>
      `;
      li.querySelector('a').addEventListener('click', () => {
        closeTocDialog();
      });
      el.tocChapterList.appendChild(li);
    });
  }

  function openTocDialog() {
    el.tocDialog.showModal();
    // Scroll active item into view
    const activeItem = el.tocChapterList.querySelector('.toc-chapter-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'center' });
    }
  }

  function closeTocDialog() {
    el.tocDialog.close();
  }

  // Theme Toggler
  function toggleTheme() {
    const themes = ['paper', 'night', 'light'];
    const nextIdx = (themes.indexOf(state.currentTheme) + 1) % themes.length;
    setTheme(themes[nextIdx], true);
  }

  function setTheme(theme, save = true) {
    state.currentTheme = theme;
    el.body.setAttribute('data-theme', theme);
    
    // Update Meta color-scheme
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = (theme === 'night') ? 'dark' : (theme === 'light' ? 'light' : 'light dark');
    }

    if (theme === 'paper') {
      el.themeIcon.textContent = '📜';
      el.themeLabel.textContent = '暖紙';
    } else if (theme === 'night') {
      el.themeIcon.textContent = '🌙';
      el.themeLabel.textContent = '夜讀';
    } else {
      el.themeIcon.textContent = '☀️';
      el.themeLabel.textContent = '晨白';
    }

    if (save) {
      try {
        localStorage.setItem('beyond-words-theme', theme);
      } catch (e) {}
    }
  }

  // Font Size Stepper
  function stepFontSize(dir) {
    let idx = fontSizes.indexOf(state.currentFontSize);
    idx = Math.max(0, Math.min(fontSizes.length - 1, idx + dir));
    setFontSize(fontSizes[idx], true);
  }

  function setFontSize(size, save = true) {
    state.currentFontSize = size;
    el.body.setAttribute('data-font-size', size);
    if (save) {
      try {
        localStorage.setItem('beyond-words-fontsize', size);
      } catch (e) {}
    }
  }

  // Scroll Progress Calculator
  function updateScrollProgress() {
    if (el.viewReader.style.display === 'none') {
      el.progressBar.style.width = '0%';
      return;
    }
    const winScroll = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    el.progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + '%';
  }

  // Boot Application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
