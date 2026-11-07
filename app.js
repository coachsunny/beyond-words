/**
 * 言未盡處 (Beyond Words) - Reader Application Script
 * Featuring OpenCC (Traditional/Simplified Conversion with Phrase Localization)
 * Pure Vanilla JavaScript for high performance, smooth routing, and offline support.
 */

(function () {
  'use strict';

  // OpenCC Converters Setup
  let toSimp = null;
  let toTrad = null;

  if (window.OpenCC) {
    try {
      // Use 'twp' to 'cn' for Taiwan Traditional with phrases -> Mainland Simplified with phrases
      toSimp = window.OpenCC.Converter({ from: 'twp', to: 'cn' });
      toTrad = window.OpenCC.Converter({ from: 'cn', to: 'twp' });
    } catch (e) {
      console.warn('OpenCC initialization error:', e);
    }
  }

  // State Management
  const state = {
    currentBookId: 'those-unspoken-words',
    currentChapterNumber: 1,
    currentTheme: 'paper', // 'paper' | 'night' | 'light'
    currentFontSize: 'medium', // 'small' | 'medium' | 'large' | 'xlarge'
    currentLang: 'zh-Hant', // 'zh-Hant' | 'zh-Hans'
    books: []
  };

  const fontSizes = ['small', 'medium', 'large', 'xlarge'];

  // Translation Helper
  function t(text) {
    if (!text || typeof text !== 'string') return text;
    if (state.currentLang === 'zh-Hans' && toSimp) {
      try {
        return toSimp(text);
      } catch (e) {
        return text;
      }
    }
    return text;
  }

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

    // Language Toggle
    btnLang: document.getElementById('btn-lang'),
    currentLangLabel: document.getElementById('current-lang-label'),

    // Theme & Font
    btnTheme: document.getElementById('btn-theme'),
    themeIcon: document.getElementById('current-theme-icon'),
    themeLabel: document.getElementById('current-theme-label'),
    btnFontDec: document.getElementById('btn-font-dec'),
    btnFontInc: document.getElementById('btn-font-inc'),

    // Static UI strings for localization
    siteTitle: document.getElementById('site-title'),
    siteTagline: document.getElementById('site-tagline'),
    btnTocText: document.getElementById('btn-toc-text'),
    navBookshelfText: document.getElementById('nav-bookshelf-text'),
    heroQuote: document.getElementById('hero-quote'),
    heroAuthor: document.getElementById('hero-author'),
    heroDesc: document.getElementById('hero-desc'),
    shelfTitle: document.getElementById('shelf-title'),
    shelfSubtitle: document.getElementById('shelf-subtitle'),
    authorRole: document.getElementById('author-role'),
    authorBio: document.getElementById('author-bio'),
    badge1: document.getElementById('badge-1'),
    badge2: document.getElementById('badge-2'),
    badge3: document.getElementById('badge-3'),
    badge4: document.getElementById('badge-4'),
    footerBrand: document.getElementById('footer-brand'),
    footerLinkShelf: document.getElementById('footer-link-shelf'),
    footerLinkAuthor: document.getElementById('footer-link-author'),
    footerMotto: document.getElementById('footer-motto'),

    // Containers
    booksGrid: document.getElementById('books-grid'),
    bookDetailContent: document.getElementById('book-detail-content'),
    readerBody: document.getElementById('reader-body'),
    readerChapterTitle: document.getElementById('reader-chapter-title'),
    readerMetaSections: document.getElementById('reader-meta-sections'),
    readerMetaWords: document.getElementById('reader-meta-words'),
    readerFontMeta: document.getElementById('reader-font-meta'),
    readerBreadcrumbCh: document.getElementById('reader-breadcrumb-ch'),
    readerBookLink: document.getElementById('reader-book-link'),
    breadcrumbShelf: document.getElementById('breadcrumb-shelf'),

    // Nav Buttons
    btnPrevChapter: document.getElementById('btn-prev-chapter'),
    btnNextChapter: document.getElementById('btn-next-chapter'),
    prevChDir: document.getElementById('prev-ch-dir'),
    nextChDir: document.getElementById('next-ch-dir'),
    prevChTitle: document.getElementById('prev-ch-title'),
    nextChTitle: document.getElementById('next-ch-title'),
    btnBackToBook: document.getElementById('btn-back-to-book'),
    btnBackToBookText: document.getElementById('btn-back-to-book-text'),
    keyboardHintText: document.getElementById('keyboard-hint-text'),

    // TOC Dialog
    tocDialog: document.getElementById('toc-dialog'),
    tocDialogTitle: document.getElementById('toc-dialog-title'),
    btnToc: document.getElementById('btn-toc'),
    btnCloseToc: document.getElementById('btn-close-toc'),
    tocBookSummary: document.getElementById('toc-book-summary'),
    tocChapterList: document.getElementById('toc-chapter-list')
  };

  // Static strings template in Traditional Chinese
  const staticStrings = {
    siteTitle: '言未盡處',
    siteTagline: '那些未曾說出的話，在這裡都被溫柔聽見',
    btnTocText: '目錄',
    navBookshelfText: '書架',
    heroQuote: '「當你試圖完美時，你推開了人；當你承認笨拙時，你連接了人。」',
    heroAuthor: '—— Sunny Lee · 《言未盡處》心靈書房',
    heroDesc: '這裡是一處安靜翻頁的角落。收錄以心理學、教練覺察與人生蛻變為底色的長篇故事。願字裡行間的微光，陪你在紙墨溫度中卸下盔甲，與真實的自己相遇。',
    shelfTitle: '📚 作品書架',
    shelfSubtitle: '點擊封面或書名開啟深度閱讀',
    authorRole: '作者與陪伴者',
    authorBio: '企業教練、引路人與文字擺渡者。相信人與人之間最深沈的靠近，從來不是無懈可擊的話術，而是在防禦與沉默的裂縫裡，如實說出那句真誠的「人話」。',
    badge1: '薩提爾冰山探索',
    badge2: '非暴力溝通',
    badge3: '由有為入無為',
    badge4: '紙本深度閱讀體驗',
    footerBrand: '言未盡處 · Sunny Lee 心靈小說系列',
    footerLinkShelf: '總書架',
    footerLinkAuthor: '關於陪伴者',
    footerMotto: '安靜翻頁 · 溫柔同在',
    breadcrumbShelf: '書架',
    prevChDir: '← 上一回',
    nextChDir: '下一回 →',
    btnBackToBookText: '返回本書目錄',
    keyboardHintText: '💡 提示：您可以使用鍵盤左、右方向鍵 ← → 快速翻閱章節',
    tocDialogTitle: '📖 章節目錄'
  };

  // Initialize
  function init() {
    loadSavedPreferences();
    loadBooksData();
    setupEventListeners();
    updateStaticTexts();
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

      const savedLang = localStorage.getItem('beyond-words-lang');
      if (savedLang === 'zh-Hans' || savedLang === 'zh-Hant') {
        setLanguage(savedLang, false);
      } else {
        setLanguage('zh-Hant', false);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function loadBooksData() {
    if (window.BEYOND_WORDS_DATA && window.BEYOND_WORDS_DATA.books) {
      state.books = window.BEYOND_WORDS_DATA.books;
    } else {
      console.error('Novel data not loaded.');
      state.books = [];
    }
  }

  function setupEventListeners() {
    // Window hash change routing
    window.addEventListener('hashchange', handleRoute);

    // Scroll progress listener
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Language toggle
    el.btnLang.addEventListener('click', toggleLanguage);

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

    const isReader = (activeView === el.viewReader);
    el.readerControls.style.display = isReader ? 'flex' : 'none';
    el.progressContainer.style.display = isReader ? 'block' : 'none';

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function showBookshelf() {
    renderBookshelf();
    switchView(el.viewBookshelf);
    document.title = `${t('言未盡處')} | Sunny Lee ${t('的心靈小說書房')}`;
  }

  function showBookDetail(bookId) {
    const book = state.books.find(b => b.id === bookId) || state.books[0];
    if (!book) return;
    
    state.currentBookId = book.id;
    renderBookDetailPage(book);
    switchView(el.viewBookDetail);
    document.title = `${t(book.title)} | ${t('目錄導讀')} - ${t('言未盡處')}`;
  }

  function showReader(bookId, chNum) {
    const book = state.books.find(b => b.id === bookId) || state.books[0];
    if (!book) return;

    state.currentBookId = book.id;
    state.currentChapterNumber = chNum;
    
    try {
      localStorage.setItem(`last-read-${book.id}`, chNum);
    } catch (e) {}

    renderChapter(book, chNum);
    switchView(el.viewReader);
  }

  // Update All Static Text Nodes according to current language
  function updateStaticTexts() {
    el.siteTitle.textContent = t(staticStrings.siteTitle);
    el.siteTagline.textContent = t(staticStrings.siteTagline);
    el.btnTocText.textContent = t(staticStrings.btnTocText);
    el.navBookshelfText.textContent = t(staticStrings.navBookshelfText);
    el.heroQuote.textContent = t(staticStrings.heroQuote);
    el.heroAuthor.textContent = t(staticStrings.heroAuthor);
    el.heroDesc.textContent = t(staticStrings.heroDesc);
    el.shelfTitle.textContent = t(staticStrings.shelfTitle);
    el.shelfSubtitle.textContent = t(staticStrings.shelfSubtitle);
    el.authorRole.textContent = t(staticStrings.authorRole);
    el.authorBio.textContent = t(staticStrings.authorBio);
    el.badge1.textContent = t(staticStrings.badge1);
    el.badge2.textContent = t(staticStrings.badge2);
    el.badge3.textContent = t(staticStrings.badge3);
    el.badge4.textContent = t(staticStrings.badge4);
    el.footerBrand.textContent = t(staticStrings.footerBrand);
    el.footerLinkShelf.textContent = t(staticStrings.footerLinkShelf);
    el.footerLinkAuthor.textContent = t(staticStrings.footerLinkAuthor);
    el.footerMotto.textContent = t(staticStrings.footerMotto);
    el.breadcrumbShelf.textContent = t(staticStrings.breadcrumbShelf);
    el.prevChDir.textContent = t(staticStrings.prevChDir);
    el.nextChDir.textContent = t(staticStrings.nextChDir);
    el.btnBackToBookText.textContent = t(staticStrings.btnBackToBookText);
    el.keyboardHintText.innerHTML = t('💡 提示：您可以使用鍵盤左、右方向鍵 <code>←</code> <code>→</code> 快速翻閱章節');
    el.tocDialogTitle.textContent = t(staticStrings.tocDialogTitle);

    if (el.readerFontMeta) {
      el.readerFontMeta.textContent = (state.currentLang === 'zh-Hans') ? '正文字体：思源宋体 (简)' : '正文字體：思源宋體 (繁)';
    }
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
          <img src="${book.cover}" alt="${t(book.title)} 封面" class="book-card-cover" loading="lazy">
          <span class="book-badge ${hasChapters ? 'active-badge' : ''}">${t(book.status)}</span>
        </div>
        <div class="book-card-body">
          <span class="book-genre">${t(book.genre || '心靈小說')}</span>
          <h3 class="book-card-title">${t(book.title)}</h3>
          <p class="book-card-subtitle">${t(book.subtitle || '')}</p>
          ${book.quote ? `<blockquote class="book-card-quote">${t(book.quote)}</blockquote>` : ''}
          <p class="book-card-desc">${t(book.description)}</p>
          <div class="book-card-meta">
            <span>✍️ ${book.author}</span>
            <span>·</span>
            <span>📖 ${hasChapters ? `${t('共')} ${book.chapters.length} ${t('回')}` : t('規劃中')}</span>
            <span>·</span>
            <span>📝 ${t(book.word_count)}</span>
          </div>
          <div class="book-card-actions">
            ${hasChapters ? `
              <a href="#read/${book.id}/ch-${lastReadCh}" class="btn-primary">
                <span>${lastReadCh > 1 ? `${t('繼續閱讀')} (${t('第')} ${lastReadCh} ${t('回')})` : t('開始沉浸閱讀')}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </a>
              <a href="#book/${book.id}" class="btn-secondary">${t('完整目錄')}</a>
            ` : `
              <button type="button" class="btn-secondary" style="width: 100%; opacity: 0.75; cursor: default;">
                ${t('作品籌備中，敬請期待')}
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
        <img src="${book.cover}" alt="${t(book.title)} 封面" class="book-detail-cover">
        <div class="book-detail-info">
          <span class="book-genre">${t(book.genre)}</span>
          <h2 class="book-detail-title">${t(book.title)}</h2>
          <p class="book-detail-subtitle">${t(book.subtitle)}</p>
          ${book.quote ? `<blockquote class="book-card-quote" style="margin-bottom: 1rem;">${t(book.quote)}</blockquote>` : ''}
          <p class="hero-desc" style="font-size: 0.95rem; margin-bottom: 1.5rem;">${t(book.description)}</p>
          
          <div class="book-card-actions" style="max-width: 320px;">
            <a href="#read/${book.id}/ch-${lastReadCh}" class="btn-primary">
              <span>${lastReadCh > 1 ? `${t('繼續閱讀')} (${t('第')} ${lastReadCh} ${t('回')})` : t('從第一回開始讀')}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </a>
          </div>
        </div>
      </div>

      <div class="toc-container">
        <h3 class="section-title">
          <span>📑 ${t('完整章節目錄')}</span>
          <small class="section-subtitle">${t('全書收錄')} ${chapters.length} ${t('回，點擊立即閱讀')}</small>
        </h3>

        <div class="toc-grid">
          ${chapters.map(ch => {
            const firstPara = (ch.sections[0] && ch.sections[0].paragraphs[0]) ? ch.sections[0].paragraphs[0].slice(0, 52) + '...' : '';
            return `
              <a href="#read/${book.id}/ch-${ch.chapter_number}" class="toc-card-link">
                <div class="toc-item-header">
                  <span class="toc-item-title">${t(ch.title)}</span>
                  <span class="toc-item-count">${ch.sections.length} ${t('節')}</span>
                </div>
                <p class="toc-item-snippet">${t(firstPara)}</p>
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
    el.readerBreadcrumbCh.textContent = `${t('第')} ${chapter.chapter_number} ${t('回')}`;
    el.readerBookLink.textContent = t(book.title);
    el.readerBookLink.href = `#book/${book.id}`;
    el.readerChapterTitle.textContent = t(chapter.title);
    el.readerMetaSections.textContent = `${t('共')} ${chapter.sections.length} ${t('節')}`;
    
    // Estimate word count
    let totalChars = 0;
    chapter.sections.forEach(sec => {
      sec.paragraphs.forEach(p => totalChars += p.length);
      if (sec.reflection) {
        sec.reflection.paragraphs.forEach(p => totalChars += p.length);
      }
    });
    el.readerMetaWords.textContent = `${t('約')} ${Math.round(totalChars / 100) * 100} ${t('字')}`;
    el.readerFontMeta.textContent = (state.currentLang === 'zh-Hans') ? '正文字体：思源宋体 (简)' : '正文字體：思源宋體 (繁)';

    document.title = `${t(chapter.title)} | ${t(book.title)} - ${t('言未盡處')}`;

    // Render Body Sections
    el.readerBody.innerHTML = '';
    chapter.sections.forEach(sec => {
      const secWrap = document.createElement('section');
      secWrap.className = 'reader-section-wrap';

      // Section Title
      const secTitle = document.createElement('h2');
      secTitle.className = 'reader-section-title';
      secTitle.textContent = t(sec.title);
      secWrap.appendChild(secTitle);

      // Story Paragraphs
      sec.paragraphs.forEach(text => {
        if (!text.trim()) return;
        const p = document.createElement('p');
        p.className = 'reader-paragraph';
        p.textContent = t(text);
        secWrap.appendChild(p);
      });

      // Reflection Note Card (if present)
      if (sec.reflection && sec.reflection.paragraphs.length > 0) {
        const card = document.createElement('div');
        card.className = 'reflection-card';

        const cardTitle = document.createElement('h3');
        cardTitle.className = 'reflection-title';
        cardTitle.textContent = t(sec.reflection.title || '【易新省思札記】');
        card.appendChild(cardTitle);

        sec.reflection.paragraphs.forEach(rp => {
          const trimmed = rp.trim();
          if (!trimmed || trimmed === '【易新省思札記】' || trimmed === '[易新省思札記]') return;
          const rEl = document.createElement('p');
          rEl.className = 'reflection-paragraph';
          rEl.textContent = t(trimmed);
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
      el.prevChTitle.textContent = t(prevCh.title);
      el.btnPrevChapter.onclick = () => {
        window.location.hash = `#read/${book.id}/ch-${prevCh.chapter_number}`;
      };
    } else {
      el.btnPrevChapter.style.visibility = 'hidden';
    }

    if (nextCh) {
      el.btnNextChapter.style.visibility = 'visible';
      el.nextChTitle.textContent = t(nextCh.title);
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
      <p style="font-weight: 600; font-size: 1.05rem; margin-bottom: 0.3rem;">${t(book.title)}</p>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Sunny Lee ${t('作品')} · ${t('共')} ${book.chapters.length} ${t('回')}</p>
    `;

    el.tocChapterList.innerHTML = '';
    book.chapters.forEach(ch => {
      const li = document.createElement('li');
      li.className = `toc-chapter-item ${ch.chapter_number === currentChNum ? 'active' : ''}`;
      li.innerHTML = `
        <a href="#read/${book.id}/ch-${ch.chapter_number}">
          <span>${t(ch.title)}</span>
          <span style="font-size: 0.8rem; opacity: 0.7;">${ch.sections.length} ${t('節')}</span>
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
    const activeItem = el.tocChapterList.querySelector('.toc-chapter-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'center' });
    }
  }

  function closeTocDialog() {
    el.tocDialog.close();
  }

  // Language Toggler (OpenCC)
  function toggleLanguage() {
    const targetLang = (state.currentLang === 'zh-Hant') ? 'zh-Hans' : 'zh-Hant';
    setLanguage(targetLang, true);
  }

  function setLanguage(lang, save = true) {
    state.currentLang = lang;
    document.documentElement.lang = lang;
    el.body.setAttribute('data-lang', lang);
    el.currentLangLabel.textContent = (lang === 'zh-Hans') ? '简' : '繁';

    if (save) {
      try {
        localStorage.setItem('beyond-words-lang', lang);
      } catch (e) {}
    }

    // Update static texts
    updateStaticTexts();

    // Re-render active view
    const book = state.books.find(b => b.id === state.currentBookId) || state.books[0];
    if (el.viewBookshelf.style.display !== 'none') {
      renderBookshelf();
      document.title = `${t('言未盡處')} | Sunny Lee ${t('的心靈小說書房')}`;
    } else if (el.viewBookDetail.style.display !== 'none' && book) {
      renderBookDetailPage(book);
      document.title = `${t(book.title)} | ${t('目錄導讀')} - ${t('言未盡處')}`;
    } else if (el.viewReader.style.display !== 'none' && book) {
      renderChapter(book, state.currentChapterNumber);
    }

    if (el.tocDialog.open && book) {
      renderTocDrawer(book, state.currentChapterNumber);
    }
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
    
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = (theme === 'night') ? 'dark' : (theme === 'light' ? 'light' : 'light dark');
    }

    if (theme === 'paper') {
      el.themeIcon.textContent = '📜';
      el.themeLabel.textContent = (state.currentLang === 'zh-Hans') ? '暖纸' : '暖紙';
    } else if (theme === 'night') {
      el.themeIcon.textContent = '🌙';
      el.themeLabel.textContent = (state.currentLang === 'zh-Hans') ? '夜读' : '夜讀';
    } else {
      el.themeIcon.textContent = '☀️';
      el.themeLabel.textContent = (state.currentLang === 'zh-Hans') ? '晨白' : '晨白';
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
