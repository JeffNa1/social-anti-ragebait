// Hook Vault & Viral Intelligence - Dashboard Script
(function () {
  'use strict';

  const STORAGE_KEY = 'x_hook_vault_v1';

  // Seed samples if user opens dashboard with 0 items (for instant trial)
  const SEED_SAMPLES = [
    {
      id: 'seed-outlier-1',
      platform: 'x',
      authorName: 'Alex River (Solo Bootstrapper)',
      authorHandle: '@alex_builds',
      authorAvatar: '',
      authorFollowers: 1450,
      outlierMultiplier: 28.5,
      postAgeHours: 14,
      hook: 'I launched a micro-SaaS with 0 audience and hit $8,200 MRR in 45 days. The counter-intuitive distribution strategy nobody tells you:',
      fullText: 'I launched a micro-SaaS with 0 audience and hit $8,200 MRR in 45 days. The counter-intuitive distribution strategy nobody tells you:\n\n1. Target negative reviews of bloated enterprise tools.\n2. DM unhappy users with a 1-click alternative.\n3. Offer 50% lifetime discount for direct feedback.\n4. Convert the best feedback into public case studies.',
      metrics: { views: 41300, likes: 2100, retweets: 480, bookmarks: 1850, replies: 165 },
      formula: 'story',
      url: 'https://x.com/alex_builds',
      savedAt: new Date(Date.now() - 3600000 * 14).toISOString()
    },
    {
      id: 'seed-1',
      platform: 'x',
      authorName: 'Alex Hormozi',
      authorHandle: '@AlexHormozi',
      authorAvatar: '',
      authorFollowers: 650000,
      outlierMultiplier: 2.8,
      postAgeHours: 24,
      hook: 'Most people think starting a business is about having a great idea. It’s not. It’s about solving an expensive problem for people who have money.',
      fullText: 'Most people think starting a business is about having a great idea. It’s not. It’s about solving an expensive problem for people who have money.\n\nHere are 5 questions to ask yourself before building anything:\n1. Who has the money?\n2. What hurts them most?\n3. Can you deliver fast?\n4. Can you charge high ticket?\n5. Can you get referrals?',
      metrics: { views: 1840000, likes: 34200, retweets: 4800, bookmarks: 12500, replies: 950 },
      formula: 'contrarian',
      url: 'https://x.com/AlexHormozi',
      savedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'seed-2',
      platform: 'x',
      authorName: 'Sahil Bloom',
      authorHandle: '@SahilBloom',
      authorAvatar: '',
      authorFollowers: 1100000,
      outlierMultiplier: 2.9,
      postAgeHours: 48,
      hook: 'I spent 40 hours studying the daily routines of 10 self-made billionaires. Here are the 7 habits they all share (that cost $0):',
      fullText: 'I spent 40 hours studying the daily routines of 10 self-made billionaires. Here are the 7 habits they all share (that cost $0):\n\n1. Deep work blocks before 9 AM\n2. Walking meetings\n3. Ruthless calendar audits\n4. Daily reflection\n5. Reading 1 hour daily\n6. High protein breakfast\n7. Zero notifications during family dinners.',
      metrics: { views: 3200000, likes: 62000, retweets: 11400, bookmarks: 28900, replies: 1420 },
      formula: 'cheatsheet',
      url: 'https://x.com/SahilBloom',
      savedAt: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: 'seed-3',
      authorName: 'Dan Koe',
      authorHandle: '@thedankoe',
      authorAvatar: '',
      hook: 'The modern trap is working 50 hours a week at a job you hate to buy things you don’t need to impress people you don’t like.',
      fullText: 'The modern trap is working 50 hours a week at a job you hate to buy things you don’t need to impress people you don’t like.\n\nEscaping it doesn’t require millions. It requires:\n- Lower fixed expenses\n- 2 hours of daily skill building\n- A distribution channel (your writing)\n- Patience to play a 2-year game.',
      metrics: { views: 920000, likes: 21500, retweets: 3900, bookmarks: 8700, replies: 620 },
      formula: 'curiosity',
      url: 'https://x.com/thedankoe',
      savedAt: new Date(Date.now() - 3600000 * 72).toISOString()
    },
    {
      id: 'seed-threads-1',
      platform: 'threads',
      authorName: 'Mark Zuckerberg',
      authorHandle: '@zuck',
      authorAvatar: '',
      hook: 'The future of open-source AI is moving significantly faster than closed models. Here is what we learned deploying Llama across 500M users:',
      fullText: 'The future of open-source AI is moving significantly faster than closed models. Here is what we learned deploying Llama across 500M users:\n\n1. Community fine-tunes beat general frontier models on niche benchmarks.\n2. On-device inference cost dropped by 10x.\n3. The ecosystem effect creates faster feedback loops than proprietary APIs.',
      metrics: { views: 0, likes: 48500, retweets: 6200, replies: 3400, bookmarks: 0 },
      formula: 'proof',
      jevConfidence: 0.94,
      jevLabel: 'Social Proof authority hook',
      url: 'https://threads.net/@zuck',
      savedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];

  let currentHooks = [];
  let selectedHookForAdaptation = null;

  // DOM Elements
  const hookList = document.getElementById('hookList');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const filterPlatform = document.getElementById('filterPlatform');
  const filterOutlier = document.getElementById('filterOutlier');
  const filterFormula = document.getElementById('filterFormula');
  const sortOrder = document.getElementById('sortOrder');
  const btnExportMd = document.getElementById('btnExportMd');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnClearAll = document.getElementById('btnClearAll');

  // Stats DOM
  const statTotalHooks = document.getElementById('statTotalHooks');
  const statMaxViews = document.getElementById('statMaxViews');
  const statMaxViewsAuthor = document.getElementById('statMaxViewsAuthor');
  const statTopFormula = document.getElementById('statTopFormula');
  const statTopFormulaPct = document.getElementById('statTopFormulaPct');
  const statAvgLikes = document.getElementById('statAvgLikes');

  // Modal DOM
  const adaptorModal = document.getElementById('adaptorModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalRefFormula = document.getElementById('modalRefFormula');
  const modalRefAuthor = document.getElementById('modalRefAuthor');
  const modalRefHookText = document.getElementById('modalRefHookText');
  const nicheInput = document.getElementById('nicheInput');
  const btnGenerateVariations = document.getElementById('btnGenerateVariations');
  const variationsContainer = document.getElementById('variationsContainer');
  const variationsList = document.getElementById('variationsList');

  // Toast DOM
  const vaultToast = document.getElementById('vaultToast');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMsg.textContent = message;
    vaultToast.classList.remove('hidden');
    toastTimer = setTimeout(() => {
      vaultToast.classList.add('hidden');
    }, 2400);
  }

  // Format big numbers (e.g. 1.8M, 24.5K)
  function formatMetric(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return Number(num).toLocaleString('vi-VN');
  }

  // Formula label mapping
  const FORMULA_META = {
    curiosity: { label: 'Curiosity Gap', class: 'badge-curiosity', icon: '🔍' },
    contrarian: { label: 'Contrarian / Hot Take', class: 'badge-contrarian', icon: '🔥' },
    cheatsheet: { label: 'Cheatsheet / Framework', class: 'badge-cheatsheet', icon: '📚' },
    story: { label: 'Story / Transformation', class: 'badge-story', icon: '📖' },
    proof: { label: 'Social Proof / Authority', class: 'badge-proof', icon: '🏆' },
    challenge: { label: 'Direct Challenge', class: 'badge-challenge', icon: '🎯' },
    other: { label: 'Đa dạng', class: 'badge-other', icon: '💬' }
  };

  // Load from storage
  function loadVaultData(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        let items = res[STORAGE_KEY];
        if (!items || !Array.isArray(items) || items.length === 0) {
          // Initialize with seed samples so dashboard looks great immediately
          items = SEED_SAMPLES;
          chrome.storage.local.set({ [STORAGE_KEY]: items });
        }
        callback(items);
      });
    } else {
      // LocalStorage fallback for standalone preview
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let items = raw ? JSON.parse(raw) : null;
        if (!items || items.length === 0) {
          items = SEED_SAMPLES;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
        callback(items);
      } catch (e) {
        callback(SEED_SAMPLES);
      }
    }
  }

  // Save to storage
  function saveVaultData(items, callback) {
    currentHooks = items;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
        if (callback) callback();
      });
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {}
      if (callback) callback();
    }
  }

  // Update Stats Cards
  function updateStats(items) {
    statTotalHooks.textContent = items.length;

    if (items.length === 0) {
      statMaxViews.textContent = '0';
      statMaxViewsAuthor.textContent = 'Chưa có dữ liệu';
      statTopFormula.textContent = 'Chưa đủ dữ liệu';
      statTopFormulaPct.textContent = '0% tỷ trọng';
      statAvgLikes.textContent = '0';
      return;
    }

    // 1. Max Views
    let maxItem = items[0];
    let totalLikes = 0;
    const formulaCounts = {};

    items.forEach((item) => {
      const v = item.metrics?.views || 0;
      if (v > (maxItem.metrics?.views || 0)) {
        maxItem = item;
      }
      totalLikes += item.metrics?.likes || 0;

      const f = item.formula || 'other';
      formulaCounts[f] = (formulaCounts[f] || 0) + 1;
    });

    statMaxViews.textContent = formatMetric(maxItem.metrics?.views || 0);
    statMaxViewsAuthor.textContent = `Bởi ${maxItem.authorName || maxItem.authorHandle || 'Tác giả'}`;

    // 2. Dominant Formula
    let topFormula = 'curiosity';
    let topCount = 0;
    Object.entries(formulaCounts).forEach(([f, cnt]) => {
      if (cnt > topCount) {
        topCount = cnt;
        topFormula = f;
      }
    });

    const meta = FORMULA_META[topFormula] || FORMULA_META.other;
    const pct = Math.round((topCount / items.length) * 100);
    statTopFormula.textContent = `${meta.icon} ${meta.label}`;
    statTopFormulaPct.textContent = `${pct}% tổng số bài (${topCount}/${items.length})`;

    // 3. Avg Likes
    const avg = Math.round(totalLikes / items.length);
    statAvgLikes.textContent = formatMetric(avg);
  }

  // Render hook feed
  function renderHookList() {
    const query = searchInput.value.trim().toLowerCase();
    const platformVal = filterPlatform ? filterPlatform.value : 'all';
    const outlierVal = filterOutlier ? filterOutlier.value : 'all';
    const formulaVal = filterFormula.value;
    const sortVal = sortOrder.value;

    btnClearSearch.classList.toggle('hidden', query.length === 0);

    // Filter
    let filtered = currentHooks.filter((item) => {
      if (platformVal !== 'all' && (item.platform || 'x') !== platformVal) return false;
      if (outlierVal === 'outliers_only' && (item.outlierMultiplier || 0) < 3.0) return false;
      if (outlierVal === 'super_outliers' && (item.outlierMultiplier || 0) < 10.0) return false;
      if (formulaVal !== 'all' && (item.formula || 'other') !== formulaVal) return false;
      if (query.length > 0) {
        const textToSearch = `${item.hook || ''} ${item.fullText || ''} ${item.authorName || ''} ${item.authorHandle || ''}`.toLowerCase();
        if (!textToSearch.includes(query)) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortVal === 'multiplier_desc') return (b.outlierMultiplier || 0) - (a.outlierMultiplier || 0);
      if (sortVal === 'views_desc') return (b.metrics?.views || 0) - (a.metrics?.views || 0);
      if (sortVal === 'likes_desc') return (b.metrics?.likes || 0) - (a.metrics?.likes || 0);
      if (sortVal === 'bookmarks_desc') return (b.metrics?.bookmarks || 0) - (a.metrics?.bookmarks || 0);
      if (sortVal === 'date_asc') return new Date(a.savedAt || 0) - new Date(b.savedAt || 0);
      return new Date(b.savedAt || 0) - new Date(a.savedAt || 0); // default: date_desc
    });

    hookList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    filtered.forEach((item) => {
      const card = createHookCard(item);
      hookList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Create Card DOM
  function createHookCard(item) {
    const card = document.createElement('div');
    const isOutlier = (item.outlierMultiplier || 0) >= 3.0;
    const isViral = (item.metrics?.views || 0) >= 50000 || (item.metrics?.likes || 0) >= 1000;
    card.className = `hook-card ${isOutlier ? 'is-outlier-card' : (isViral ? 'is-viral-card' : '')}`;
    card.setAttribute('data-id', item.id);

    const meta = FORMULA_META[item.formula] || FORMULA_META.other;
    const authorInitials = (item.authorName || 'U').substring(0, 2).toUpperCase();
    const avatarHtml = item.authorAvatar
      ? `<img src="${escapeHtml(item.authorAvatar)}" class="author-avatar" alt="${escapeHtml(item.authorName)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="author-avatar fallback" style="display:none; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${authorInitials}</div>`
      : `<div class="author-avatar fallback" style="display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${authorInitials}</div>`;

    const formattedDate = item.savedAt ? new Date(item.savedAt).toLocaleDateString('vi-VN') : 'Gần đây';
    const fallbackAuthor = item.platform === 'threads' ? 'Tác giả Threads' : 'Tác giả X';
    const mult = item.outlierMultiplier || 0;
    const fols = item.authorFollowers || 0;
    const outlierBadge = mult >= 3.0
      ? `<span class="outlier-chip" title="Reach gấp ${mult.toFixed(1)} lần lượng followers">🔥 ${mult.toFixed(1)}x Outlier ${fols > 0 ? `(${formatMetric(fols)} fols)` : ''}</span>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <div class="author-info">
          ${avatarHtml}
          <div class="author-meta">
            <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener noreferrer" class="author-name">
              ${escapeHtml(item.authorName || fallbackAuthor)}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <span class="author-handle">${escapeHtml(item.authorHandle || '')} • ${formattedDate}</span>
          </div>
        </div>

        <div class="card-top-badges">
          ${outlierBadge}
          ${
            item.platform === 'threads'
              ? `<span class="platform-badge threads">🧵 Threads</span>
                 <span class="jev-ai-chip" title="Phân tích ngữ nghĩa chuyên sâu bởi Jev AI">🤖 Jev AI: ${Math.round((item.jevConfidence || 0.9) * 100)}%</span>`
              : `<span class="platform-badge x-twitter">𝕏 X</span>`
          }
          <span class="formula-badge ${meta.class}" title="Công thức Hook">
            ${meta.icon} ${meta.label}
          </span>
        </div>
      </div>

      <div class="hook-content-body">
        <div class="hook-text-highlight">
          ${escapeHtml(item.hook || item.fullText || '')}
        </div>

        ${
          item.fullText && item.fullText !== item.hook
            ? `
          <button class="btn-toggle-accordion">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            <span>Xem toàn bộ bài viết</span>
          </button>
          <div class="full-text-accordion collapsed">
            ${escapeHtml(item.fullText).replace(/\n/g, '<br/>')}
          </div>
        `
            : ''
        }
      </div>

      <div class="metrics-bar">
        ${
          item.platform === 'threads'
            ? `
          <div class="metric-item likes" title="Lượt thích (Likes)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <strong>${formatMetric(item.metrics?.likes)}</strong>
          </div>
          <div class="metric-item views" title="Lượt phản hồi (Replies)" style="color:#c084fc;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <strong>${formatMetric(item.metrics?.replies)}</strong>
          </div>
          <div class="metric-item retweets" title="Lượt chia sẻ (Reposts)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            <strong>${formatMetric(item.metrics?.reposts || item.metrics?.retweets)}</strong>
          </div>
        `
            : `
          <div class="metric-item views" title="Lượt xem (Views)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            <strong>${formatMetric(item.metrics?.views)}</strong>
          </div>
          <div class="metric-item likes" title="Lượt thích (Likes)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <strong>${formatMetric(item.metrics?.likes)}</strong>
          </div>
          <div class="metric-item retweets" title="Lượt chia sẻ (Reposts)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            <strong>${formatMetric(item.metrics?.retweets)}</strong>
          </div>
          <div class="metric-item bookmarks" title="Lượt Bookmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            <strong>${formatMetric(item.metrics?.bookmarks)}</strong>
          </div>
        `
        }
      </div>

      <div class="card-actions">
        <div class="card-actions-left">
          <button class="btn btn-secondary btn-card btn-copy-hook" title="Sao chép câu Hook mở đầu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copy Hook</span>
          </button>
          <button class="btn btn-primary btn-card btn-adapt-niche" title="Mở bộ biến hóa sang niche của bạn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Biến Hóa Niche</span>
          </button>
        </div>

        <button class="btn btn-destructive-subtle btn-card btn-delete-hook" title="Xóa hook này khỏi Vault">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
        </button>
      </div>
    `;

    // Accordion toggle
    const toggleBtn = card.querySelector('.btn-toggle-accordion');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const acc = card.querySelector('.full-text-accordion');
        const isCollapsed = acc.classList.toggle('collapsed');
        toggleBtn.querySelector('span').textContent = isCollapsed ? 'Xem toàn bộ bài viết' : 'Thu gọn nội dung';
      };
    }

    // Copy hook
    const copyBtn = card.querySelector('.btn-copy-hook');
    copyBtn.onclick = () => {
      const textToCopy = item.hook || item.fullText || '';
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('✓ Đã sao chép Hook vào clipboard!');
      });
    };

    // Adapt to Niche
    const adaptBtn = card.querySelector('.btn-adapt-niche');
    adaptBtn.onclick = () => {
      openAdaptorModal(item);
    };

    // Delete hook
    const deleteBtn = card.querySelector('.btn-delete-hook');
    deleteBtn.onclick = () => {
      if (confirm(`Bạn có chắc muốn xóa Hook của ${item.authorName || item.authorHandle || 'bài này'} khỏi Vault?`)) {
        const nextHooks = currentHooks.filter((h) => h.id !== item.id);
        saveVaultData(nextHooks, () => {
          updateStats(currentHooks);
          renderHookList();
          showToast('Đã xóa Hook thành công');
        });
      }
    };

    return card;
  }

  // AI Niche Adaptor Modal Logic
  function openAdaptorModal(item) {
    selectedHookForAdaptation = item;
    const meta = FORMULA_META[item.formula] || FORMULA_META.other;

    modalRefFormula.textContent = `${meta.icon} ${meta.label}`;
    modalRefAuthor.textContent = item.authorHandle || item.authorName || '@creator';
    modalRefHookText.textContent = `"${item.hook || item.fullText || ''}"`;

    variationsContainer.classList.add('hidden');
    variationsList.innerHTML = '';

    adaptorModal.classList.remove('hidden');
    nicheInput.focus();
  }

  function closeModal() {
    adaptorModal.classList.add('hidden');
    selectedHookForAdaptation = null;
  }

  // Niche Adaptor Engine
  function generateNicheVariations(hookText, formula, niche) {
    const cleanNiche = niche.trim() || 'lĩnh vực của bạn';

    const generators = {
      contrarian: [
        {
          type: 'Góc Nhìn Lật Ngược (The Lie)',
          text: `Hầu hết mọi người trong ngành ${cleanNiche} đều đang tin vào lời khuyên lỗi thời này. Sự thật là nó đang kìm hãm 99% sự tiến bộ của bạn.`
        },
        {
          type: 'Thực Tế Phũ Phàng (The Unpopular Truth)',
          text: `Ý kiến trái chiều: ${cleanNiche} không hề phức tạp như các "chuyên gia" cố tỏ ra nguy hiểm. Bạn chỉ cần làm chủ đúng 2 nguyên lý cốt lõi này:`
        },
        {
          type: 'Lệnh Dừng Ngay Lập Tức (Stop Doing X)',
          text: `Nếu bạn muốn bứt phá trong ${cleanNiche} năm nay, hãy DỪNG NGAY việc lãng phí công sức vào việc này. Đây là lý do tại sao:`
        }
      ],
      curiosity: [
        {
          type: 'Quy Luật Ngầm (The Hidden Rule)',
          text: `Quy luật ngầm trong giới ${cleanNiche} mà người trong cuộc đố ai dám công khai nói cho bạn biết:`
        },
        {
          type: 'Mẫu Số Chung Duy Nhất (The Secret Factor)',
          text: `Sự khác biệt duy nhất giữa top 1% trong ${cleanNiche} và những người chật vật còn lại chỉ nằm ở 1 thói quen này:`
        },
        {
          type: 'Góc Khuất Hậu Trường (Behind The Scenes)',
          text: `Tôi đã âm thầm quan sát những người giỏi nhất ngành ${cleanNiche} suốt 12 tháng qua. Đây là 3 điều họ làm mỗi ngày mà không bao giờ đăng lên mạng:`
        }
      ],
      cheatsheet: [
        {
          type: 'Cẩm Nang Tinh Gọn (Time Saver)',
          text: `Tôi đã tốn hơn 100 giờ thử nghiệm mọi phương pháp trong ${cleanNiche}. Đây là bản tóm gọn bạn có thể áp dụng ngay trong 10 phút:`
        },
        {
          type: 'Kho Tài Liệu Triệu Đô (The Ultimate Stack)',
          text: `Bộ công cụ & khung sườn giúp bạn làm chủ ${cleanNiche} từ con số 0 (hãy Bookmark lại trước khi bài viết này bị trôi):`
        },
        {
          type: 'Lộ Trình Từng Bước (Step-by-Step Blueprint)',
          text: `Lộ trình 5 bước chinh phục ${cleanNiche} mà trường lớp hay các khóa học đắt tiền không bao giờ dạy bạn:`
        }
      ],
      story: [
        {
          type: 'Từ Số 0 Đến Thành Tựu (Zero to Hero)',
          text: `Cách đây 2 năm, tôi hoàn toàn mù tịt về ${cleanNiche}. Hôm nay, đây là hệ thống tinh gọn đã thay đổi toàn bộ kết quả của tôi:`
        },
        {
          type: 'Bài Học Xương Máu (Hardest Lesson)',
          text: `Sai lầm ngớ ngẩn và đắt giá nhất của tôi khi bắt đầu với ${cleanNiche} (và cách bạn có thể né nó mà không mất 1 xu):`
        },
        {
          type: 'Khoảnh Khắc Bước Ngoặt (Turning Point)',
          text: `Khoảnh khắc tôi nhận ra mình đã tiếp cận ${cleanNiche} hoàn toàn sai lầm — và cách tôi xoay chuyển tình thế trong 30 ngày:`
        }
      ],
      proof: [
        {
          type: 'Phân Tích Chuyên Gia (Top Performers Audit)',
          text: `Tôi đã phân tích hơn 50 case-study xuất sắc nhất trong lĩnh vực ${cleanNiche}. Đây là 4 chiến lược chung giúp họ thống trị:`
        },
        {
          type: 'Nếu Bắt Đầu Lại Từ Đầu (Starting From Scratch)',
          text: `Nếu bị tước bỏ mọi tài nguyên và phải bắt đầu lại từ con số 0 với ${cleanNiche}, đây là kế hoạch chi tiết tôi sẽ thực hiện trong 30 ngày tới:`
        },
        {
          type: 'Số Liệu Thực Chiến (Data-Backed Findings)',
          text: `Chúng tôi đã áp dụng thử nghiệm chiến lược này trên thực tế trong mảng ${cleanNiche}. Kết quả cho thấy tỷ lệ thành công tăng vượt trội:`
        }
      ],
      challenge: [
        {
          type: 'Thức Tỉnh Trực Diện (Reality Check)',
          text: `Bạn đã dành bao nhiêu thời gian cho ${cleanNiche} mà vẫn dậm chân tại chỗ? 3 phút đọc bài viết này sẽ chỉ rõ nút thắt của bạn:`
        },
        {
          type: 'Giả Định Đổi Đời (What If)',
          text: `Điều gì sẽ xảy ra nếu bạn chỉ tập trung vào đúng 20% nỗ lực mang lại 80% kết quả trong ${cleanNiche}? Hãy thử bài test này:`
        },
        {
          type: 'Bộ Câu Hỏi Tự Vấn (Checklist Provocation)',
          text: `3 câu hỏi bạn bắt buộc phải trả lời dc trước khi quyết định dấn thân sâu hơn vào ${cleanNiche}:`
        }
      ]
    };

    const targetList = generators[formula] || generators.curiosity;
    return targetList;
  }

  // Handle Generate Button
  btnGenerateVariations.onclick = () => {
    const niche = nicheInput.value.trim();
    if (!niche) {
      alert('Vui lòng nhập niche hoặc chọn 1 chip gợi ý bên dưới!');
      nicheInput.focus();
      return;
    }

    if (!selectedHookForAdaptation) return;

    const variations = generateNicheVariations(
      selectedHookForAdaptation.hook,
      selectedHookForAdaptation.formula,
      niche
    );

    variationsList.innerHTML = '';
    variations.forEach((v) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'variation-item';
      itemEl.innerHTML = `
        <div class="variation-header">
          <span class="variation-type">${escapeHtml(v.type)}</span>
          <button class="btn btn-secondary btn-card btn-copy-var">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Sao chép</span>
          </button>
        </div>
        <div class="variation-text">${escapeHtml(v.text)}</div>
      `;

      itemEl.querySelector('.btn-copy-var').onclick = () => {
        navigator.clipboard.writeText(v.text).then(() => {
          showToast('✓ Đã chép biến thể Hook vào clipboard!');
        });
      };

      variationsList.appendChild(itemEl);
    });

    variationsContainer.classList.remove('hidden');
  };

  // Niche chips click
  document.querySelectorAll('.niche-chips .chip').forEach((chip) => {
    chip.onclick = () => {
      nicheInput.value = chip.getAttribute('data-niche');
      btnGenerateVariations.click();
    };
  });

  // Modal events
  btnCloseModal.onclick = closeModal;
  adaptorModal.onclick = (e) => {
    if (e.target === adaptorModal) closeModal();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !adaptorModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Export Markdown
  btnExportMd.onclick = () => {
    if (currentHooks.length === 0) {
      alert('Không có hook nào để xuất!');
      return;
    }

    let md = `# ⚡ X Hook Vault Export (${new Date().toLocaleDateString('vi-VN')})\n\n`;
    md += `*Tổng số hook đã lưu: ${currentHooks.length} bài viết*\n\n---\n\n`;

    currentHooks.forEach((item, index) => {
      const meta = FORMULA_META[item.formula] || FORMULA_META.other;
      md += `### ${index + 1}. ${item.authorName || 'Tác giả'} (${item.authorHandle || ''})\n\n`;
      md += `> **Hook**: ${item.hook || item.fullText || ''}\n\n`;
      md += `- **Công thức**: ${meta.label}\n`;
      md += `- **Chỉ số**: ${formatMetric(item.metrics?.views)} Views | ${formatMetric(item.metrics?.likes)} Likes | ${formatMetric(item.metrics?.bookmarks)} Bookmarks\n`;
      md += `- **Link bài viết**: [Xem trên X](${item.url || '#'})\n`;
      md += `- **Ngày lưu**: ${item.savedAt ? new Date(item.savedAt).toLocaleString('vi-VN') : 'N/A'}\n\n`;
      if (item.fullText && item.fullText !== item.hook) {
        md += `<details><summary>Nội dung đầy đủ</summary>\n\n${item.fullText}\n\n</details>\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-hook-vault-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất file Markdown thành công!');
  };

  // Export JSON
  btnExportJson.onclick = () => {
    if (currentHooks.length === 0) {
      alert('Không có hook nào để xuất!');
      return;
    }

    const dataStr = JSON.stringify(currentHooks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-hook-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất file JSON thành công!');
  };

  // Clear All
  btnClearAll.onclick = () => {
    if (confirm('CẢNH BÁO: M có chắc chắn muốn xóa sạch toàn bộ Hook trong Vault k? Thao tác này đéo thể khôi phục!')) {
      saveVaultData([], () => {
        updateStats([]);
        renderHookList();
        showToast('Đã xóa sạch Vault');
      });
    }
  };

  // Search & Filters Listeners
  searchInput.oninput = () => renderHookList();
  btnClearSearch.onclick = () => {
    searchInput.value = '';
    renderHookList();
    searchInput.focus();
  };
  if (filterPlatform) filterPlatform.onchange = () => renderHookList();
  if (filterOutlier) filterOutlier.onchange = () => renderHookList();
  filterFormula.onchange = () => renderHookList();
  sortOrder.onchange = () => renderHookList();

  // Initialize
  loadVaultData((items) => {
    currentHooks = items;
    updateStats(currentHooks);
    renderHookList();
  });
})();
