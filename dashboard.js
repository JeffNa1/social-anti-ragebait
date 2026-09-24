// Hook Vault & Viral Intelligence - Dashboard Script
(function () {
  'use strict';

  const STORAGE_KEY = 'x_hook_vault_v1';
  const VAULTS_KEY = 'x_vaults_v2';
  const DEFAULT_VAULT_ID = 'vault-default';
  const DEFAULT_VAULTS = [
    { id: 'vault-default', name: 'Chung / Mặc định', color: '#ff6161', createdAt: new Date().toISOString() },
    { id: 'vault-tech-ai', name: 'AI & Tech', color: '#57c1ff', createdAt: new Date().toISOString() },
    { id: 'vault-business', name: 'Khởi Nghiệp', color: '#ffc533', createdAt: new Date().toISOString() }
  ];

  let currentVaults = [];
  let selectedVaultId = 'all';

  const INITIALIZED_KEY = 'x_hook_vault_initialized_v2';
  const SEED_IDS = new Set(['seed-outlier-1', 'seed-1', 'seed-2', 'seed-3', 'seed-threads-1']);

  // Seed samples for on-demand trial
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
      mediaUrls: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
      ],
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
      mediaUrls: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'
      ],
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
      mediaUrls: [
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80'
      ],
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
      mediaUrls: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
      ],
      metrics: { views: 0, likes: 48500, retweets: 6200, replies: 3400, bookmarks: 0 },
      formula: 'proof',
      url: 'https://threads.net/@zuck',
      savedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'seed-threads-2',
      platform: 'threads',
      authorName: 'Adam Mosseri',
      authorHandle: '@mosseri',
      authorAvatar: '',
      authorFollowers: 2800000,
      outlierMultiplier: 4.8,
      hook: 'If you want to reach new audiences on Threads in 2026 without paid ads, here is the exact algorithm ranking breakdown:',
      fullText: 'If you want to reach new audiences on Threads in 2026 without paid ads, here is the exact algorithm ranking breakdown:\n\n1. Meaningful replies and conversations carry 3x more weight than simple likes.\n2. Original media sparks longer dwell time.\n3. Topic tags connect your post directly to interest graphs.\n4. Avoid engagement bait—it gets demoted in For You feed.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80'
      ],
      metrics: { views: 420000, likes: 28900, retweets: 4100, replies: 3120, bookmarks: 0 },
      formula: 'cheatsheet',
      url: 'https://threads.net/@mosseri',
      savedAt: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ];

  let currentHooks = [];

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
  const btnLoadSamples = document.getElementById('btnLoadSamples');

  // Stats DOM
  const statTotalHooks = document.getElementById('statTotalHooks');
  const statMaxViews = document.getElementById('statMaxViews');
  const statMaxViewsAuthor = document.getElementById('statMaxViewsAuthor');
  const statTopFormula = document.getElementById('statTopFormula');
  const statTopFormulaPct = document.getElementById('statTopFormulaPct');
  const statAvgLikes = document.getElementById('statAvgLikes');
  const statHooksMeter = document.getElementById('statHooksMeter');
  const statReachMeter = document.getElementById('statReachMeter');
  const statFormulaMeter = document.getElementById('statFormulaMeter');
  const statEngageMeter = document.getElementById('statEngageMeter');

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

  const FORMULA_META = {
    curiosity: {
      label: 'Curiosity Gap',
      class: 'badge-curiosity',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6"/><path d="M21 21l-4.35-4.35"/></svg>'
    },
    contrarian: {
      label: 'Contrarian / Hot Take',
      class: 'badge-contrarian',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>'
    },
    cheatsheet: {
      label: 'Cheatsheet / Framework',
      class: 'badge-cheatsheet',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>'
    },
    story: {
      label: 'Story / Transformation',
      class: 'badge-story',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
    },
    proof: {
      label: 'Social Proof / Authority',
      class: 'badge-proof',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>'
    },
    challenge: {
      label: 'Direct Challenge',
      class: 'badge-challenge',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
    },
    other: {
      label: 'Đa dạng',
      class: 'badge-other',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    }
  };

  // Load from storage
  function loadVaultData(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY, INITIALIZED_KEY], (res) => {
        const isInit = !!res[INITIALIZED_KEY];
        let items = res[STORAGE_KEY];

        if (!isInit) {
          // Fresh migration/upgrade: purge auto-seeded fake samples so user gets a clean slate
          chrome.storage.local.set({ [INITIALIZED_KEY]: true });
          if (Array.isArray(items)) {
            items = items.filter((item) => !SEED_IDS.has(item.id));
            chrome.storage.local.set({ [STORAGE_KEY]: items });
          } else {
            items = [];
            chrome.storage.local.set({ [STORAGE_KEY]: [] });
          }
        } else {
          if (!items || !Array.isArray(items)) {
            items = [];
          }
        }

        // Also check if localStorage has saved items to merge
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const localItems = JSON.parse(raw);
            if (Array.isArray(localItems) && localItems.length > 0) {
              const existingIds = new Set(items.map((it) => it.id));
              let added = false;
              for (const it of localItems) {
                if (!existingIds.has(it.id)) {
                  items.push(it);
                  existingIds.add(it.id);
                  added = true;
                }
              }
              if (added) {
                chrome.storage.local.set({ [STORAGE_KEY]: items });
              }
            }
          }
        } catch (e) {}

        // Ensure every item has a vaultId assigned
        items = items.map((it) => {
          if (!it.vaultId) it.vaultId = DEFAULT_VAULT_ID;
          return it;
        });

        // Mirror to localStorage so preview mode stays in sync
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {}

        callback(items);
      });
    } else {
      // LocalStorage fallback for standalone preview
      try {
        const isInit = localStorage.getItem(INITIALIZED_KEY);
        const raw = localStorage.getItem(STORAGE_KEY);
        let items = raw ? JSON.parse(raw) : null;
        if (!isInit) {
          localStorage.setItem(INITIALIZED_KEY, 'true');
          if (Array.isArray(items)) {
            items = items.filter((item) => !SEED_IDS.has(item.id));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
          } else {
            items = [];
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          }
        } else {
          if (!items || !Array.isArray(items)) {
            items = [];
          }
        }

        // Ensure every item has a vaultId assigned
        items = items.map((it) => {
          if (!it.vaultId) it.vaultId = DEFAULT_VAULT_ID;
          return it;
        });

        callback(items);
      } catch (e) {
        callback([]);
      }
    }
  }

  // Load Vaults / Topics list
  function loadVaults(callback) {
    function processVaults(vaults) {
      if (!Array.isArray(vaults) || vaults.length === 0) {
        vaults = [...DEFAULT_VAULTS];
        saveVaults(vaults);
      } else {
        if (!vaults.some((v) => v.id === DEFAULT_VAULT_ID)) {
          vaults.unshift(DEFAULT_VAULTS[0]);
          saveVaults(vaults);
        }
      }
      currentVaults = vaults;
      if (callback) callback(vaults);
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([VAULTS_KEY], (res) => {
        let vaults = res?.[VAULTS_KEY];
        if (!vaults) {
          try {
            const raw = localStorage.getItem(VAULTS_KEY);
            if (raw) vaults = JSON.parse(raw);
          } catch (e) {}
        }
        processVaults(vaults);
      });
    } else {
      try {
        const raw = localStorage.getItem(VAULTS_KEY);
        const vaults = raw ? JSON.parse(raw) : null;
        processVaults(vaults);
      } catch (e) {
        processVaults([]);
      }
    }
  }

  // Save Vaults / Topics list
  function saveVaults(vaults, callback) {
    currentVaults = vaults;
    try {
      localStorage.setItem(VAULTS_KEY, JSON.stringify(vaults));
    } catch (e) {}
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [VAULTS_KEY]: vaults }, () => {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  // Save to storage
  function saveVaultData(items, callback) {
    currentHooks = items;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  // Smooth Raycast Animated Counter (odometer roll - CountUp)
  function animateCounter(element, target, duration = 650) {
    if (!element) return;
    const targetNum = Number(target) || 0;
    if (targetNum === 0) {
      element.textContent = '0';
      element.setAttribute('data-raw-val', '0');
      return;
    }
    const startNum = Number(element.getAttribute('data-raw-val')) || 0;
    if (startNum === targetNum) {
      element.textContent = formatMetric(targetNum);
      return;
    }
    element.setAttribute('data-raw-val', String(targetNum));
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startNum + (targetNum - startNum) * ease);
      element.textContent = formatMetric(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = formatMetric(targetNum);
      }
    }
    requestAnimationFrame(update);
  }

  // DecryptedText Matrix Hacker Scramble Animation (React Bits)
  let scrambleAnimId = null;
  let scrambleTimeoutId = null;
  function scrambleDecryptedText(element, iconHtml, targetText, duration = 320) {
    if (!element) return;
    if (scrambleAnimId) cancelAnimationFrame(scrambleAnimId);
    if (scrambleTimeoutId) clearTimeout(scrambleTimeoutId);

    const cleanTarget = String(targetText || '');
    if (!cleanTarget) {
      element.innerHTML = `${iconHtml ? iconHtml + ' ' : ''}<span>Chưa đủ dữ liệu</span>`;
      return;
    }

    const GLYPHS = 'ABCDEF0123456789!@#$%^&*<>~+=/?';
    const startTime = performance.now();
    const len = cleanTarget.length;

    const setFinal = () => {
      element.innerHTML = `${iconHtml ? iconHtml + ' ' : ''}<span>${cleanTarget}</span>`;
      scrambleAnimId = null;
      scrambleTimeoutId = null;
    };

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      if (progress >= 1) {
        setFinal();
        return;
      }

      const resolvedCount = Math.floor(progress * len);
      let scrambled = '';
      for (let i = 0; i < len; i++) {
        if (i < resolvedCount || cleanTarget[i] === ' ' || cleanTarget[i] === '/' || cleanTarget[i] === '-') {
          scrambled += cleanTarget[i];
        } else {
          scrambled += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }

      element.innerHTML = `${iconHtml ? iconHtml + ' ' : ''}<span>${scrambled}</span>`;
      scrambleAnimId = requestAnimationFrame(frame);
    }

    scrambleAnimId = requestAnimationFrame(frame);
    scrambleTimeoutId = setTimeout(setFinal, duration + 20);
  }

  // SpotlightCard Cursor-following Radial Glow (React Bits)
  function initSpotlightCards() {
    const cards = document.querySelectorAll('.spotlight-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '-1000px');
        card.style.setProperty('--mouse-y', '-1000px');
      });
    });
  }

  // ClickSpark Micro Particle Burst (React Bits)
  function initClickSparks() {
    const SPARK_COLORS = ['#ff6161', '#ff8585', '#ffb340', '#ffffff', '#a855f7'];

    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, .btn, .chip, .segment-btn, .custom-dropdown-btn, .custom-dropdown-item, .formula-badge');
      if (!target) return;

      const x = e.clientX;
      const y = e.clientY;
      const count = 7;

      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'click-spark-particle';

        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const distance = 20 + Math.random() * 26;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const size = 3 + Math.random() * 2.5;
        const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 6px ${color}`;
        particle.style.setProperty('--spark-tx', `${tx}px`);
        particle.style.setProperty('--spark-ty', `${ty}px`);

        document.body.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 480);
      }
    });
  }

  // Update Stats Cards
  function updateStats(items) {
    if (items.length === 0) {
      statTotalHooks.textContent = '0';
      statTotalHooks.setAttribute('data-raw-val', '0');
      statMaxViews.textContent = '0';
      statMaxViews.setAttribute('data-raw-val', '0');
      statMaxViewsAuthor.textContent = 'Chưa có dữ liệu';
      statTopFormula.textContent = 'Chưa đủ dữ liệu';
      statTopFormulaPct.textContent = '0% tỷ trọng';
      statAvgLikes.textContent = '0';
      statAvgLikes.setAttribute('data-raw-val', '0');
      if (statHooksMeter) statHooksMeter.style.width = '0%';
      if (statReachMeter) statReachMeter.style.width = '0%';
      if (statFormulaMeter) statFormulaMeter.style.width = '0%';
      if (statEngageMeter) statEngageMeter.style.width = '0%';
      return;
    }

    animateCounter(statTotalHooks, items.length);
    if (statHooksMeter) {
      const hooksPct = Math.min(100, Math.round((items.length / 30) * 100));
      statHooksMeter.style.width = `${hooksPct}%`;
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

    const maxViews = maxItem.metrics?.views || 0;
    animateCounter(statMaxViews, maxViews);
    statMaxViewsAuthor.textContent = `Bởi ${maxItem.authorName || maxItem.authorHandle || 'Tác giả'}`;
    if (statReachMeter) {
      const reachPct = maxViews > 0 ? Math.min(100, Math.round((Math.log10(maxViews + 1) / 6) * 100)) : 0;
      statReachMeter.style.width = `${reachPct}%`;
    }

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
    scrambleDecryptedText(statTopFormula, meta.icon, meta.label);
    statTopFormulaPct.textContent = `${pct}% tổng số bài (${topCount}/${items.length})`;
    if (statFormulaMeter) {
      statFormulaMeter.style.width = `${pct}%`;
    }

    // 3. Avg Likes
    const avg = Math.round(totalLikes / items.length);
    animateCounter(statAvgLikes, avg);
    if (statEngageMeter) {
      const engagePct = avg > 0 ? Math.min(100, Math.round((avg / 500) * 100)) : 0;
      statEngageMeter.style.width = `${engagePct}%`;
    }
  }

  // Render Vault Tabs / Playlists
  function renderVaultTabs() {
    const vaultTabsList = document.getElementById('vaultTabsList');
    const collectionsTotalBadge = document.getElementById('collectionsTotalBadge');
    if (!vaultTabsList) return;

    if (collectionsTotalBadge) {
      collectionsTotalBadge.textContent = `${currentVaults.length} Vaults`;
    }

    vaultTabsList.innerHTML = '';

    // 1. "Tất cả bài viết" tab
    const allTab = document.createElement('button');
    allTab.type = 'button';
    allTab.className = `vault-tab ${selectedVaultId === 'all' ? 'active' : ''}`;
    allTab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      <span>Tất cả bài viết</span>
      <span class="vault-tab-count">${currentHooks.length}</span>
    `;
    allTab.onclick = () => {
      selectedVaultId = 'all';
      renderVaultTabs();
      renderHookList();
    };
    vaultTabsList.appendChild(allTab);

    // 2. Each Vault tab
    currentVaults.forEach((vault) => {
      const count = currentHooks.filter((h) => (h.vaultId || DEFAULT_VAULT_ID) === vault.id).length;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `vault-tab ${selectedVaultId === vault.id ? 'active' : ''}`;

      const isDefault = vault.id === DEFAULT_VAULT_ID;
      const deleteBtnHtml = !isDefault
        ? `<span class="vault-tab-delete" title="Xóa Vault này" data-id="${vault.id}">&times;</span>`
        : '';

      tab.innerHTML = `
        <span class="vault-tab-dot" style="background:${vault.color || '#ff6161'};"></span>
        <span>${escapeHtml(vault.name)}</span>
        <span class="vault-tab-count">${count}</span>
        ${deleteBtnHtml}
      `;

      tab.onclick = (e) => {
        if (e.target.classList.contains('vault-tab-delete')) {
          e.stopPropagation();
          deleteVaultPrompt(vault);
          return;
        }
        selectedVaultId = vault.id;
        renderVaultTabs();
        renderHookList();
      };

      vaultTabsList.appendChild(tab);
    });
  }

  function deleteVaultPrompt(vault) {
    if (confirm(`Bạn có chắc muốn xóa Vault "${vault.name}"?\nToàn bộ bài viết trong Vault này sẽ được chuyển về "Chung / Mặc định".`)) {
      currentHooks = currentHooks.map((h) => {
        if (h.vaultId === vault.id) {
          return { ...h, vaultId: DEFAULT_VAULT_ID };
        }
        return h;
      });
      const nextVaults = currentVaults.filter((v) => v.id !== vault.id);
      if (selectedVaultId === vault.id) {
        selectedVaultId = 'all';
      }
      saveVaults(nextVaults, () => {
        saveVaultData(currentHooks, () => {
          renderVaultTabs();
          renderHookList();
          showToast(`✓ Đã xóa Vault "${vault.name}"`);
        });
      });
    }
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
      if (selectedVaultId !== 'all' && (item.vaultId || DEFAULT_VAULT_ID) !== selectedVaultId) return false;
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

  function renderCardMedia(mediaUrls) {
    if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) return '';
    const validUrls = mediaUrls.filter((u) => u && typeof u === 'string').slice(0, 4);
    if (validUrls.length === 0) return '';

    const count = validUrls.length;
    const countClass = `media-count-${count}`;

    const imgsHtml = validUrls
      .map(
        (url, idx) => `
      <div class="media-item media-item-${idx}" data-src="${escapeHtml(url)}" title="Bấm để mở ảnh gốc">
        <img src="${escapeHtml(url)}" loading="lazy" alt="Ảnh đính kèm" onerror="this.parentElement.style.display='none';" />
      </div>
    `
      )
      .join('');

    return `
      <div class="card-media-gallery ${countClass}">
        ${imgsHtml}
      </div>
    `;
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
      ? `<span class="outlier-chip" title="Reach gấp ${mult.toFixed(1)} lần lượng followers"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>${mult.toFixed(1)}x Outlier ${fols > 0 ? `(${formatMetric(fols)} fols)` : ''}</span>`
      : '';

    const itemVault = currentVaults.find((v) => v.id === (item.vaultId || DEFAULT_VAULT_ID)) || currentVaults[0] || { id: DEFAULT_VAULT_ID, name: 'Chung', color: '#ff6161' };
    const vaultBadge = `
      <span class="card-vault-tag" style="border-color:${itemVault.color}44; color:${itemVault.color};" title="Vault: ${escapeHtml(itemVault.name)}">
        <span class="card-vault-tag-dot" style="background:${itemVault.color};"></span>
        <span class="card-vault-tag-text">${escapeHtml(itemVault.name)}</span>
      </span>
    `;

    const platformBadge = item.platform === 'threads'
      ? `<span class="platform-badge threads" title="Bài viết từ Threads">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.3 11.2c-.3 1.8-1.5 2.8-3.3 2.8-2 0-3.3-1.4-3.3-3.7 0-2.4 1.4-3.8 3.5-3.8 1.9 0 3.1 1.2 3.2 2.9h-1.6c-.1-1-.7-1.5-1.6-1.5-1.1 0-1.8.8-1.8 2.4 0 1.5.7 2.3 1.8 2.3 1 0 1.5-.6 1.6-1.4z"/>
           </svg>
           <span>Threads</span>
         </span>`
      : `<span class="platform-badge x-twitter" title="Bài viết từ X (Twitter)">
           <svg viewBox="0 0 24 24" fill="currentColor">
             <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
           </svg>
           <span>Twitter</span>
         </span>`;

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
          ${platformBadge}
          ${vaultBadge}
        </div>
      </div>

      <div class="hook-content-body">
        <div class="hook-text-highlight">
          ${escapeHtml(item.fullText || item.hook || '').replace(/\n/g, '<br/>')}
        </div>

        ${renderCardMedia(item.mediaUrls)}

        <div class="card-meta-row">
          <span class="formula-badge ${meta.class}" title="Công thức Hook: ${escapeHtml(meta.label)}">
            ${meta.icon} <span>${meta.label}</span>
          </span>
          ${outlierBadge}
        </div>
      </div>

      <div class="metrics-bar">
        ${
          item.platform === 'threads'
            ? `
          <div class="metric-item likes" title="Lượt thích (Likes)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/><path d="M7 10h2.5l1.5-3 2 6 1.5-3H17" stroke-width="1.5"/></svg>
            <strong>${formatMetric(item.metrics?.likes)}</strong>
          </div>
          <div class="metric-item views" title="Lượt phản hồi (Replies)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <strong>${formatMetric(item.metrics?.replies)}</strong>
          </div>
          <div class="metric-item retweets" title="Lượt chia sẻ (Reposts)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            <strong>${formatMetric(item.metrics?.reposts || item.metrics?.retweets)}</strong>
          </div>
        `
            : `
          <div class="metric-item views" title="Lượt xem (Views)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 12c2.5-5 6.5-8 9-8s6.5 3 9 8c-2.5 5-6.5 8-9 8s-6.5-3-9-8z"/></svg>
            <strong>${formatMetric(item.metrics?.views)}</strong>
          </div>
          <div class="metric-item likes" title="Lượt thích (Likes)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/><path d="M7 10h2.5l1.5-3 2 6 1.5-3H17" stroke-width="1.5"/></svg>
            <strong>${formatMetric(item.metrics?.likes)}</strong>
          </div>
          <div class="metric-item retweets" title="Lượt chia sẻ (Reposts)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            <strong>${formatMetric(item.metrics?.retweets)}</strong>
          </div>
          <div class="metric-item bookmarks" title="Lượt Bookmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            <strong>${formatMetric(item.metrics?.bookmarks)}</strong>
          </div>
        `
        }
      </div>

      <div class="card-actions">
        <div class="card-actions-left">
          ${
            item.url
              ? `
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-card btn-view-post" title="Mở trực tiếp bài viết gốc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span>Xem bài gốc ↗</span>
            </a>
          `
              : ''
          }

          <button class="btn btn-secondary btn-card btn-copy-hook" title="Sao chép câu Hook mở đầu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copy</span>
          </button>
        </div>

        <div class="card-actions-right">
          <div class="custom-dropdown card-vault-dropdown">
            <button type="button" class="btn btn-secondary btn-card card-vault-trigger custom-dropdown-trigger" title="Chuyển bài viết sang Vault khác" aria-haspopup="listbox" aria-expanded="false">
              <span class="card-vault-dot" style="background: ${itemVault.color || '#ff6161'};"></span>
              <span class="card-vault-label dropdown-trigger-label">${escapeHtml(itemVault.name)}</span>
              <svg class="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="custom-dropdown-menu card-vault-menu" role="listbox">
              ${currentVaults.map((v) => `
                <div class="custom-dropdown-item ${(item.vaultId || DEFAULT_VAULT_ID) === v.id ? 'selected' : ''}" data-val="${v.id}">
                  <div class="item-content">
                    <span class="card-vault-item-dot" style="background: ${v.color || '#ff6161'};"></span>
                    <span>${escapeHtml(v.name)}</span>
                  </div>
                  <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
              `).join('')}
            </div>
          </div>

          <button class="btn btn-destructive-subtle btn-card btn-delete-hook" title="Xóa hook này khỏi Vault">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
          </button>
        </div>
      </div>
    `;

    // Media gallery click to open original image
    const gallery = card.querySelector('.card-media-gallery');
    if (gallery) {
      gallery.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.media-item');
        if (itemEl && itemEl.dataset.src) {
          e.stopPropagation();
          e.preventDefault();
          window.open(itemEl.dataset.src, '_blank');
        }
      });
    }


    // Copy hook
    const copyBtn = card.querySelector('.btn-copy-hook');
    copyBtn.onclick = () => {
      const textToCopy = item.hook || item.fullText || '';
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('✓ Đã sao chép Hook vào clipboard!');
      });
    };

    // Delete hook
    const deleteBtn = card.querySelector('.btn-delete-hook');
    deleteBtn.onclick = () => {
      if (confirm(`Bạn có chắc muốn xóa Hook của ${item.authorName || item.authorHandle || 'bài này'} khỏi Vault?`)) {
        const nextHooks = currentHooks.filter((h) => h.id !== item.id);
        saveVaultData(nextHooks, () => {
          updateStats(currentHooks);
          renderVaultTabs();
          renderHookList();
          showToast('Đã xóa Hook thành công');
        });
      }
    };

    // Move vault custom dropdown
    const vaultDropdown = card.querySelector('.card-vault-dropdown');
    if (vaultDropdown) {
      const trigger = vaultDropdown.querySelector('.card-vault-trigger');
      const menu = vaultDropdown.querySelector('.card-vault-menu');
      const items = vaultDropdown.querySelectorAll('.custom-dropdown-item');

      trigger.onclick = (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');

        document.querySelectorAll('.custom-dropdown-menu').forEach((m) => m.classList.remove('open'));
        document.querySelectorAll('.custom-dropdown-trigger').forEach((t) => {
          t.classList.remove('open');
          t.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          const rect = trigger.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          if (spaceBelow < 230 && rect.top > 230) {
            menu.style.bottom = 'calc(100% + 6px)';
            menu.style.top = 'auto';
          } else {
            menu.style.top = 'calc(100% + 6px)';
            menu.style.bottom = 'auto';
          }

          menu.classList.add('open');
          trigger.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      };

      items.forEach((it) => {
        it.onclick = (e) => {
          e.stopPropagation();
          const targetVaultId = it.getAttribute('data-val');
          menu.classList.remove('open');
          trigger.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');

          if (targetVaultId === (item.vaultId || DEFAULT_VAULT_ID)) return;

          item.vaultId = targetVaultId;
          const targetVault = currentVaults.find((v) => v.id === targetVaultId);
          saveVaultData(currentHooks, () => {
            renderVaultTabs();
            renderHookList();
            showToast(`✓ Đã chuyển bài sang Vault "${targetVault?.name || 'Vault'}"!`);
          });
        };
      });
    }

    return card;
  }

  // Export Markdown
  btnExportMd.onclick = () => {
    if (currentHooks.length === 0) {
      alert('Không có hook nào để xuất!');
      return;
    }

    let md = `# ⚡ Threads & X Hook Vault Export (${new Date().toLocaleDateString('vi-VN')})\n\n`;
    md += `*Tổng số hook đã lưu: ${currentHooks.length} bài viết*\n\n---\n\n`;

    currentHooks.forEach((item, index) => {
      const meta = FORMULA_META[item.formula] || FORMULA_META.other;
      md += `### ${index + 1}. ${item.authorName || 'Tác giả'} (${item.authorHandle || ''})\n\n`;
      md += `> **Hook**: ${item.hook || item.fullText || ''}\n\n`;
      md += `- **Nền tảng**: ${item.platform === 'threads' ? 'Threads' : 'X (Twitter)'}\n`;
      md += `- **Công thức**: ${meta.label}\n`;
      md += `- **Chỉ số**: ${formatMetric(item.metrics?.views)} Views | ${formatMetric(item.metrics?.likes)} Likes | ${formatMetric(item.metrics?.bookmarks || item.metrics?.replies)} ${item.platform === 'threads' ? 'Replies' : 'Bookmarks'}\n`;
      md += `- **Link bài viết**: [Xem trên ${item.platform === 'threads' ? 'Threads' : 'X'}](${item.url || '#'})\n`;
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
    a.download = `threads-hook-vault-${new Date().toISOString().slice(0, 10)}.md`;
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
    a.download = `threads-hook-vault-${new Date().toISOString().slice(0, 10)}.json`;
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

  // Load Sample Hooks on demand
  if (btnLoadSamples) {
    btnLoadSamples.onclick = () => {
      saveVaultData(SEED_SAMPLES, () => {
        updateStats(currentHooks);
        renderHookList();
        showToast('✓ Đã nạp 5 bài mẫu thử nghiệm thành công!');
      });
    };
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

  const FILTER_PLATFORM_KEY = 'vault_filter_platform_pref_v2';

  // Segmented Control Switchers
  function setupSegmentedControl(containerId, selectEl, storageKey) {
    const container = document.getElementById(containerId);
    if (!container || !selectEl) return;
    const buttons = container.querySelectorAll('.segment-btn');

    // Restore saved choice if valid, defaulting to 'all'
    if (storageKey) {
      let saved = null;
      try {
        saved = localStorage.getItem(storageKey);
      } catch (e) {}
      if (!saved) saved = 'all';

      if (Array.from(buttons).some((b) => b.getAttribute('data-val') === saved)) {
        buttons.forEach((b) => b.classList.toggle('active', b.getAttribute('data-val') === saved));
        selectEl.value = saved;
      }
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val') || 'all';
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectEl.value = val;
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, val);
          } catch (e) {}
        }
        renderHookList();
      });
    });
  }

  setupSegmentedControl('segmentedPlatform', filterPlatform, FILTER_PLATFORM_KEY);
  setupSegmentedControl('segmentedOutlier', filterOutlier);

  // View Density Switcher (To / Bé - Twittermark Style)
  const DENSITY_KEY = 'vault_view_density_v1';
  function setupViewDensityToggle() {
    const hookList = document.getElementById('hookList');
    const btnLarge = document.getElementById('btnDensityLarge');
    const btnCompact = document.getElementById('btnDensityCompact');
    if (!hookList || !btnLarge || !btnCompact) return;

    let saved = 'large';
    try {
      const val = localStorage.getItem(DENSITY_KEY);
      if (val === 'compact' || val === 'large') saved = val;
    } catch (e) {}

    const urlParams = new URLSearchParams(window.location.search);
    const paramDensity = urlParams.get('density');
    if (paramDensity === 'compact' || paramDensity === 'large') {
      saved = paramDensity;
    }

    function setDensity(mode) {
      hookList.classList.remove('density-large', 'density-compact');
      hookList.classList.add(`density-${mode}`);
      btnLarge.classList.toggle('active', mode === 'large');
      btnCompact.classList.toggle('active', mode === 'compact');
      try {
        localStorage.setItem(DENSITY_KEY, mode);
      } catch (e) {}
    }

    btnLarge.addEventListener('click', () => setDensity('large'));
    btnCompact.addEventListener('click', () => setDensity('compact'));

    setDensity(saved);
  }

  setupViewDensityToggle();

  // Custom Floating Popover Dropdown Setup
  function setupCustomDropdown(dropdownId, triggerId, menuId, selectEl, onChangeCallback) {
    const dropdown = document.getElementById(dropdownId);
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);
    if (!dropdown || !trigger || !menu || !selectEl) return;

    const triggerIcon = trigger.querySelector('.dropdown-trigger-icon');
    const triggerLabel = trigger.querySelector('.dropdown-trigger-label');
    const items = menu.querySelectorAll('.custom-dropdown-item');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      document.querySelectorAll('.custom-dropdown-menu').forEach((m) => m.classList.remove('open'));
      document.querySelectorAll('.custom-dropdown-trigger').forEach((t) => {
        t.classList.remove('open');
        t.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        menu.classList.add('open');
        trigger.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    items.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.getAttribute('data-val');
        items.forEach((it) => it.classList.remove('selected'));
        item.classList.add('selected');

        const itemSvg = item.querySelector('.item-content svg');
        const itemText = item.querySelector('.item-content span')?.textContent || '';
        if (triggerIcon && itemSvg) triggerIcon.innerHTML = itemSvg.outerHTML;
        if (triggerLabel) triggerLabel.textContent = itemText;

        selectEl.value = val;
        menu.classList.remove('open');
        trigger.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        if (typeof onChangeCallback === 'function') onChangeCallback(val);
      });
    });
  }

  setupCustomDropdown('dropdownFormula', 'triggerFormula', 'menuFormula', filterFormula, () => renderHookList());
  setupCustomDropdown('dropdownSort', 'triggerSort', 'menuSort', sortOrder, () => renderHookList());

  // Close custom dropdowns on click outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown-menu').forEach((m) => m.classList.remove('open'));
    document.querySelectorAll('.custom-dropdown-trigger').forEach((t) => {
      t.classList.remove('open');
      t.setAttribute('aria-expanded', 'false');
    });
  });

  // Keyboard shortcut '/' to focus search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Create Vault Modal Setup
  function initCreateVaultModal() {
    const btnCreateVault = document.getElementById('btnCreateVault');
    const modalCreateVault = document.getElementById('modalCreateVault');
    const btnCloseModalVault = document.getElementById('btnCloseModalVault');
    const btnCancelModalVault = document.getElementById('btnCancelModalVault');
    const btnConfirmModalVault = document.getElementById('btnConfirmModalVault');
    const inputVaultName = document.getElementById('inputVaultName');
    let selectedModalColor = '#ff6161';

    if (!btnCreateVault || !modalCreateVault) return;

    const openModal = () => {
      modalCreateVault.classList.remove('hidden');
      if (inputVaultName) {
        inputVaultName.value = '';
        setTimeout(() => inputVaultName.focus(), 80);
      }
    };

    const closeModal = () => {
      modalCreateVault.classList.add('hidden');
    };

    btnCreateVault.onclick = openModal;
    if (btnCloseModalVault) btnCloseModalVault.onclick = closeModal;
    if (btnCancelModalVault) btnCancelModalVault.onclick = closeModal;

    modalCreateVault.addEventListener('click', (e) => {
      if (e.target === modalCreateVault) closeModal();
    });

    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach((swatch) => {
      swatch.onclick = () => {
        colorSwatches.forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');
        selectedModalColor = swatch.getAttribute('data-color') || '#ff6161';
      };
    });

    const submitCreateVault = () => {
      const name = (inputVaultName?.value || '').trim();
      if (!name) {
        alert('Vui lòng nhập tên cho Vault mới!');
        return;
      }
      if (currentVaults.some((v) => v.name.toLowerCase() === name.toLowerCase())) {
        alert('Tên Vault này đã tồn tại!');
        return;
      }
      const newVault = {
        id: 'vault-' + Date.now(),
        name: name,
        color: selectedModalColor,
        createdAt: new Date().toISOString()
      };
      const nextVaults = [...currentVaults, newVault];
      saveVaults(nextVaults, () => {
        selectedVaultId = newVault.id;
        renderVaultTabs();
        renderHookList();
        closeModal();
        showToast(`✓ Đã tạo Vault "${name}" thành công!`);
      });
    };

    if (btnConfirmModalVault) btnConfirmModalVault.onclick = submitCreateVault;
    if (inputVaultName) {
      inputVaultName.onkeydown = (e) => {
        if (e.key === 'Enter') submitCreateVault();
        if (e.key === 'Escape') closeModal();
      };
    }
  }

  // Initialize
  initSpotlightCards();
  initClickSparks();
  initCreateVaultModal();

  loadVaults(() => {
    loadVaultData((items) => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('sample') === 'true') {
        items = [...SEED_SAMPLES];
      }
      currentHooks = items;
      updateStats(currentHooks);
      renderVaultTabs();
      renderHookList();
    });
  });

  // Real-time synchronization when a hook or vault is saved in another tab (Threads or X)
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes[STORAGE_KEY] || changes[VAULTS_KEY])) {
        loadVaults(() => {
          loadVaultData((items) => {
            currentHooks = items;
            updateStats(currentHooks);
            renderVaultTabs();
            renderHookList();
          });
        });
      }
    });
  }

  // Cross-tab synchronization for localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === VAULTS_KEY) {
      loadVaults(() => {
        loadVaultData((items) => {
          currentHooks = items;
          updateStats(currentHooks);
          renderVaultTabs();
          renderHookList();
        });
      });
    }
  });
})();
