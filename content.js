// Universal Social Shield (Threads, Facebook, X) - Anti-Rage, Anti-Scam, Anti-Seeding, Monk Mode
// Powered by Jev Zero-shot AI (classifier.dev) & Client-side Vision Metadata
(function () {
  'use strict';

  let config = {
    apiEndpoint: 'https://classifier.dev/',
    batchDebounceMs: 120,
    confidenceThreshold: 0.30,
    filterMotivationalEnabled: true,
    filterMemeEnabled: true,
    filterDeepDiveEnabled: true,
    filterWholesomeEnabled: true,
    filterDoomEnabled: true,
    filterFomoEnabled: true,
    filterCasualEnabled: true,
    focusModeEnabled: false,
    focusWhitelistTags: ['motivational', 'meme', 'deepdive', 'wholesome', 'custom'],
    monkModeEnabled: true,       // Hardcore Monk Mode: Block all photos/videos with women & goon-bait
    blockReelsEnabled: true,     // Block Reels pop-ups & short videos on Facebook
    autoBlurRageEnabled: true,
    blockScamsEnabled: true,
    collapseSeedingEnabled: true,
    hideFloatingPill: false,
    customLabels: [],
    viralDetectionEnabled: true,
    viralMinViews: 50000,
    viralMinLikes: 1000,
    viralMinBookmarks: 200,
    outlierDetectionEnabled: true,
    outlierMinMultiplier: 3.0,
    outlierMinViews: 3000,
    outlierMaxAgeHours: 48,
    outlierThreadsMinLikes: 150,
    outlierThreadsMinMultiplier: 2.0,
  };

  let scannedCount = 0;
  let monkModeBlockedCount = 0;
  let blockedRageCount = 0;
  let blockedScamCount = 0;
  let cleanedSeedingCount = 0;
  let motivationalCount = 0;
  let memeCount = 0;
  let deepDiveCount = 0;
  let wholesomeCount = 0;
  let doomCount = 0;
  let fomoCount = 0;
  let casualCount = 0;
  let customCount = 0;
  let focusCollapsedCount = 0;

  function getPlatform() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('threads.net') || host.includes('threads.com')) return 'threads';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('youtube.com')) return 'youtube';
    return 'x';
  }

  // Regex pattern matching women visual tags in Meta/X alt-text and captions
  const WOMEN_OR_GOONBAIT_REGEX =
    /(\b(woman|women|girl|girls|female|lady|ladies|bikini|cleavage|swimwear|selfie|thirst\s*trap|goon|gooning|onlyfans|fansly)\b|phụ nữ|con gái|cô gái|gái xinh|nữ sinh|hot girl|mặc hở|khoe thân|áo tắm|nội y|gái|mlem)/i;

  // Impeccable & Lucide SVG Icons (Zero Slop Unicode)
  const ICONS = {
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    shieldAlert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
    scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    flame: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    smile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>`,
    binary: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    skull: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    messageSquare: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    broom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m16 4 3 3L6 20l-3-3z"/><path d="m14 6 3 3"/><path d="M3 21l3-3"/></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .698 10.793 10.793 0 0 1-3.125 4.148"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.35a1 1 0 0 1 0-.698 10.75 10.75 0 0 1 2.825-3.834"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
    chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
  };

  function getBadgeIconSvg(label) {
    if (label === 'self-improvement / motivational') return ICONS.sparkles;
    if (label === 'meme / humor / satire') return ICONS.smile;
    if (label === 'deep dive / technical breakdown / industry insider') return ICONS.binary;
    if (label === 'wholesome / positive') return ICONS.heart;
    if (label === 'fearmongering / doom') return ICONS.skull;
    if (label === 'fomo / hype') return ICONS.zap;
    if (label === 'other / casual discussion') return ICONS.messageSquare;
    return ICONS.tag;
  }

  // Fast synchronous session cache (0ms instant response on reload)
  const CACHE_KEY = `social_guardian_cache_v4_${getPlatform()}`;
  const textCache = new Map();
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => textCache.set(k, v));
    }
  } catch (e) {}

  function saveCacheToStorage() {
    try {
      const obj = {};
      const entries = Array.from(textCache.entries()).slice(-300);
      entries.forEach(([k, v]) => (obj[k] = v));
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  const COUNTED_KEY = `social_guardian_counted_v1_${getPlatform()}`;
  const countedTexts = new Set();
  try {
    const rawCounted = sessionStorage.getItem(COUNTED_KEY);
    if (rawCounted) {
      JSON.parse(rawCounted).forEach((t) => countedTexts.add(t));
    }
  } catch (e) {}

  function saveCountedToStorage() {
    try {
      const arr = Array.from(countedTexts).slice(-500);
      sessionStorage.setItem(COUNTED_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  const REVEALED_KEY = `social_guardian_revealed_v1_${getPlatform()}`;
  const revealedTexts = new Set();
  try {
    const rawRevealed = sessionStorage.getItem(REVEALED_KEY);
    if (rawRevealed) {
      JSON.parse(rawRevealed).forEach((t) => revealedTexts.add(t));
    }
  } catch (e) {}

  function saveRevealedToStorage() {
    try {
      const arr = Array.from(revealedTexts).slice(-500);
      sessionStorage.setItem(REVEALED_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  // Follower & Outlier Caches (populated by Main World Interceptor)
  const authorFollowerCache = new Map();
  const tweetDataCache = new Map();
  try {
    const rawFols = sessionStorage.getItem('social_shield_fols_v1');
    if (rawFols) {
      const parsed = JSON.parse(rawFols);
      Object.entries(parsed).forEach(([k, v]) => authorFollowerCache.set(k, v));
    }
  } catch (e) {}

  function saveFollowersCache() {
    try {
      const obj = {};
      const entries = Array.from(authorFollowerCache.entries()).slice(-600);
      entries.forEach(([k, v]) => (obj[k] = v));
      sessionStorage.setItem('social_shield_fols_v1', JSON.stringify(obj));
    } catch (e) {}
  }

  window.addEventListener('SOCIAL_SHIELD_INTERCEPTED_DATA', (e) => {
    const { users, tweets } = e.detail || {};
    let updated = false;
    if (users) {
      Object.entries(users).forEach(([handle, info]) => {
        const clean = handle.toLowerCase().replace('@', '');
        if (typeof info.followersCount === 'number' && info.followersCount > 0) {
          authorFollowerCache.set(clean, info.followersCount);
          updated = true;
        }
      });
    }
    if (tweets) {
      Object.entries(tweets).forEach(([id, t]) => {
        tweetDataCache.set(id, t);
        if (t.authorHandle && t.followersCount > 0) {
          const clean = t.authorHandle.toLowerCase().replace('@', '');
          authorFollowerCache.set(clean, t.followersCount);
          updated = true;
        }
      });
    }
    if (updated) {
      saveFollowersCache();
      if (config.viralDetectionEnabled && (getPlatform() === 'x' || getPlatform() === 'threads')) {
        scheduleScan();
      }
    }
  });
  // Load saved settings from Chrome Storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
      [
        'filterMotivationalEnabled',
        'filterMemeEnabled',
        'filterDeepDiveEnabled',
        'filterWholesomeEnabled',
        'filterDoomEnabled',
        'filterFomoEnabled',
        'filterCasualEnabled',
        'customLabels',
        'monkModeEnabled',
        'blockReelsEnabled',
        'autoBlurRageEnabled',
        'blockScamsEnabled',
        'collapseSeedingEnabled',
        'hideFloatingPill',
        'confidenceThreshold',
        'monkModeBlockedCount',
        'blockedRageCount',
        'blockedScamCount',
        'cleanedSeedingCount',
        'motivationalCount',
        'memeCount',
        'deepDiveCount',
        'wholesomeCount',
        'doomCount',
        'fomoCount',
        'casualCount',
        'customCount',
        'focusModeEnabled',
        'focusWhitelistTags',
        'focusCollapsedCount',
        'viralDetectionEnabled',
        'viralMinViews',
        'viralMinLikes',
        'viralMinBookmarks',
        'outlierDetectionEnabled',
        'outlierMinMultiplier',
        'outlierMinViews',
        'outlierMaxAgeHours',
        'outlierThreadsMinLikes',
        'outlierThreadsMinMultiplier',
      ],
      (res) => {
        if (typeof res.outlierDetectionEnabled === 'boolean') config.outlierDetectionEnabled = res.outlierDetectionEnabled;
        if (typeof res.outlierMinMultiplier === 'number') config.outlierMinMultiplier = res.outlierMinMultiplier;
        if (typeof res.outlierMinViews === 'number') config.outlierMinViews = res.outlierMinViews;
        if (typeof res.outlierMaxAgeHours === 'number') config.outlierMaxAgeHours = res.outlierMaxAgeHours;
        if (typeof res.outlierThreadsMinLikes === 'number') config.outlierThreadsMinLikes = res.outlierThreadsMinLikes;
        if (typeof res.outlierThreadsMinMultiplier === 'number') config.outlierThreadsMinMultiplier = res.outlierThreadsMinMultiplier;
        if (typeof res.filterMotivationalEnabled === 'boolean') config.filterMotivationalEnabled = res.filterMotivationalEnabled;
        if (typeof res.filterMemeEnabled === 'boolean') config.filterMemeEnabled = res.filterMemeEnabled;
        if (typeof res.filterDeepDiveEnabled === 'boolean') config.filterDeepDiveEnabled = res.filterDeepDiveEnabled;
        if (typeof res.filterWholesomeEnabled === 'boolean') config.filterWholesomeEnabled = res.filterWholesomeEnabled;
        if (typeof res.filterDoomEnabled === 'boolean') config.filterDoomEnabled = res.filterDoomEnabled;
        if (typeof res.filterFomoEnabled === 'boolean') config.filterFomoEnabled = res.filterFomoEnabled;
        if (typeof res.filterCasualEnabled === 'boolean') config.filterCasualEnabled = res.filterCasualEnabled;
        if (Array.isArray(res.customLabels)) config.customLabels = res.customLabels;
        if (typeof res.focusModeEnabled === 'boolean') config.focusModeEnabled = res.focusModeEnabled;
        if (Array.isArray(res.focusWhitelistTags)) config.focusWhitelistTags = res.focusWhitelistTags;
        if (typeof res.monkModeEnabled === 'boolean') config.monkModeEnabled = res.monkModeEnabled;
        if (typeof res.blockReelsEnabled === 'boolean') config.blockReelsEnabled = res.blockReelsEnabled;
        if (typeof res.autoBlurRageEnabled === 'boolean') config.autoBlurRageEnabled = res.autoBlurRageEnabled;
        if (typeof res.blockScamsEnabled === 'boolean') config.blockScamsEnabled = res.blockScamsEnabled;
        if (typeof res.collapseSeedingEnabled === 'boolean') config.collapseSeedingEnabled = res.collapseSeedingEnabled;
        if (typeof res.hideFloatingPill === 'boolean') config.hideFloatingPill = res.hideFloatingPill;
        if (typeof res.confidenceThreshold === 'number') {
          config.confidenceThreshold = res.confidenceThreshold;
        }
        if (typeof res.viralDetectionEnabled === 'boolean') config.viralDetectionEnabled = res.viralDetectionEnabled;
        if (typeof res.viralMinViews === 'number') config.viralMinViews = res.viralMinViews;
        if (typeof res.viralMinLikes === 'number') config.viralMinLikes = res.viralMinLikes;
        if (typeof res.viralMinBookmarks === 'number') config.viralMinBookmarks = res.viralMinBookmarks;

        if (typeof res.monkModeBlockedCount === 'number') monkModeBlockedCount = res.monkModeBlockedCount;
        if (typeof res.blockedRageCount === 'number') blockedRageCount = res.blockedRageCount;
        if (typeof res.blockedScamCount === 'number') blockedScamCount = res.blockedScamCount;
        if (typeof res.cleanedSeedingCount === 'number') cleanedSeedingCount = res.cleanedSeedingCount;
        if (typeof res.motivationalCount === 'number') motivationalCount = res.motivationalCount;
        if (typeof res.memeCount === 'number') memeCount = res.memeCount;
        if (typeof res.deepDiveCount === 'number') deepDiveCount = res.deepDiveCount;
        if (typeof res.wholesomeCount === 'number') wholesomeCount = res.wholesomeCount;
        if (typeof res.doomCount === 'number') doomCount = res.doomCount;
        if (typeof res.fomoCount === 'number') fomoCount = res.fomoCount;
        if (typeof res.casualCount === 'number') casualCount = res.casualCount;
        if (typeof res.customCount === 'number') customCount = res.customCount;
        if (typeof res.focusCollapsedCount === 'number') focusCollapsedCount = res.focusCollapsedCount;

        updatePill();
        applyStateToDOM();
      }
    );

    const TAXONOMY_KEYS = [
      'filterMotivationalEnabled',
      'filterMemeEnabled',
      'filterDeepDiveEnabled',
      'filterWholesomeEnabled',
      'filterDoomEnabled',
      'filterFomoEnabled',
      'filterCasualEnabled',
      'customLabels',
      'autoBlurRageEnabled',
      'blockScamsEnabled',
      'collapseSeedingEnabled',
      'confidenceThreshold',
    ];

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'UPDATE_CONFIG') {
        let taxonomyChanged = false;
        TAXONOMY_KEYS.forEach((key) => {
          if (key === 'customLabels') {
            if (Array.isArray(request.config.customLabels) && JSON.stringify(request.config.customLabels) !== JSON.stringify(config.customLabels)) {
              taxonomyChanged = true;
            }
          } else if (request.config[key] !== undefined && request.config[key] !== config[key]) {
            taxonomyChanged = true;
          }
        });

        if (typeof request.config.filterMotivationalEnabled === 'boolean') config.filterMotivationalEnabled = request.config.filterMotivationalEnabled;
        if (typeof request.config.filterMemeEnabled === 'boolean') config.filterMemeEnabled = request.config.filterMemeEnabled;
        if (typeof request.config.filterDeepDiveEnabled === 'boolean') config.filterDeepDiveEnabled = request.config.filterDeepDiveEnabled;
        if (typeof request.config.filterWholesomeEnabled === 'boolean') config.filterWholesomeEnabled = request.config.filterWholesomeEnabled;
        if (typeof request.config.filterDoomEnabled === 'boolean') config.filterDoomEnabled = request.config.filterDoomEnabled;
        if (typeof request.config.filterFomoEnabled === 'boolean') config.filterFomoEnabled = request.config.filterFomoEnabled;
        if (typeof request.config.filterCasualEnabled === 'boolean') config.filterCasualEnabled = request.config.filterCasualEnabled;
        if (Array.isArray(request.config.customLabels)) config.customLabels = request.config.customLabels;
        config.monkModeEnabled = request.config.monkModeEnabled;
        if (typeof request.config.blockReelsEnabled === 'boolean') config.blockReelsEnabled = request.config.blockReelsEnabled;
        config.autoBlurRageEnabled = request.config.autoBlurRageEnabled;
        config.blockScamsEnabled = request.config.blockScamsEnabled;
        config.collapseSeedingEnabled = request.config.collapseSeedingEnabled;
        if (typeof request.config.focusModeEnabled === 'boolean') config.focusModeEnabled = request.config.focusModeEnabled;
        if (Array.isArray(request.config.focusWhitelistTags)) config.focusWhitelistTags = request.config.focusWhitelistTags;
        if (typeof request.config.hideFloatingPill === 'boolean') config.hideFloatingPill = request.config.hideFloatingPill;
        config.confidenceThreshold = request.config.confidenceThreshold;
        if (typeof request.config.viralDetectionEnabled === 'boolean') config.viralDetectionEnabled = request.config.viralDetectionEnabled;
        if (typeof request.config.viralMinViews === 'number') config.viralMinViews = request.config.viralMinViews;
        if (typeof request.config.viralMinLikes === 'number') config.viralMinLikes = request.config.viralMinLikes;
        if (typeof request.config.viralMinBookmarks === 'number') config.viralMinBookmarks = request.config.viralMinBookmarks;

        if (taxonomyChanged) {
          textCache.clear();
          saveCacheToStorage();
        }
        updatePill();
        applyStateToDOM();
        sendResponse({ status: 'ok' });
      } else if (request.type === 'RESET_STATS') {
        motivationalCount = 0;
        memeCount = 0;
        deepDiveCount = 0;
        wholesomeCount = 0;
        doomCount = 0;
        fomoCount = 0;
        casualCount = 0;
        customCount = 0;
        focusCollapsedCount = 0;
        monkModeBlockedCount = 0;
        blockedRageCount = 0;
        blockedScamCount = 0;
        cleanedSeedingCount = 0;
        countedTexts.clear();
        saveCountedToStorage();
        revealedTexts.clear();
        saveRevealedToStorage();
        updatePill();
        sendResponse({ status: 'ok' });
      }
    });

    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        let configChanged = false;
        let taxonomyChanged = false;
        [
          'filterMotivationalEnabled',
          'filterMemeEnabled',
          'filterDeepDiveEnabled',
          'filterWholesomeEnabled',
          'filterDoomEnabled',
          'filterFomoEnabled',
          'filterCasualEnabled',
          'customLabels',
          'focusModeEnabled',
          'focusWhitelistTags',
          'monkModeEnabled',
          'blockReelsEnabled',
          'autoBlurRageEnabled',
          'blockScamsEnabled',
          'collapseSeedingEnabled',
          'confidenceThreshold',
          'hideFloatingPill',
        ].forEach((key) => {
          if (changes[key]) {
            if (key === 'customLabels') {
              if (JSON.stringify(changes.customLabels.newValue) !== JSON.stringify(config.customLabels)) {
                taxonomyChanged = true;
              }
              config.customLabels = changes.customLabels.newValue || [];
            } else {
              if (TAXONOMY_KEYS.includes(key) && changes[key].newValue !== config[key]) {
                taxonomyChanged = true;
              }
              config[key] = changes[key].newValue;
            }
            configChanged = true;
          }
        });

        if (changes.motivationalCount) motivationalCount = changes.motivationalCount.newValue || 0;
        if (changes.memeCount) memeCount = changes.memeCount.newValue || 0;
        if (changes.deepDiveCount) deepDiveCount = changes.deepDiveCount.newValue || 0;
        if (changes.wholesomeCount) wholesomeCount = changes.wholesomeCount.newValue || 0;
        if (changes.doomCount) doomCount = changes.doomCount.newValue || 0;
        if (changes.fomoCount) fomoCount = changes.fomoCount.newValue || 0;
        if (changes.casualCount) casualCount = changes.casualCount.newValue || 0;
        if (changes.customCount) customCount = changes.customCount.newValue || 0;
        if (changes.focusCollapsedCount) focusCollapsedCount = changes.focusCollapsedCount.newValue || 0;
        if (changes.monkModeBlockedCount) monkModeBlockedCount = changes.monkModeBlockedCount.newValue || 0;
        if (changes.blockedRageCount) blockedRageCount = changes.blockedRageCount.newValue || 0;
        if (changes.blockedScamCount) blockedScamCount = changes.blockedScamCount.newValue || 0;
        if (changes.cleanedSeedingCount) cleanedSeedingCount = changes.cleanedSeedingCount.newValue || 0;

        if (taxonomyChanged) {
          textCache.clear();
          saveCacheToStorage();
        }
        if (configChanged) {
          applyStateToDOM();
        }

        updatePill();
      });
    }
  }

  const TAXONOMY_CATALOG = {
    'self-improvement / motivational': {
      configKey: 'filterMotivationalEnabled',
      instruction: 'personal growth, discipline, fitness, productivity lessons, inspiring mindsets, self-help, stoicism.',
      badge: {
        text: '🌱 Động lực / Mindset',
        desc: 'Personal growth, productivity, and constructive mindset (Phát triển bản thân, động lực)',
        bg: 'rgba(245, 158, 11, 0.18)',
        border: '#f59e0b',
        color: '#fbbf24',
      },
    },
    'meme / humor / satire': {
      configKey: 'filterMemeEnabled',
      instruction: 'lighthearted jokes, funny memes, sarcastic humor, parody, troll posts.',
      badge: {
        text: '🎭 Meme / Giải trí',
        desc: 'Humor, memes, satire, and playful wit (Hài hước, ảnh chế, troll vui)',
        bg: 'rgba(236, 72, 153, 0.18)',
        border: '#ec4899',
        color: '#f472b6',
      },
    },
    'deep dive / technical breakdown / industry insider': {
      configKey: 'filterDeepDiveEnabled',
      instruction: 'in-depth technical threads, architectural teardowns, insider industry analysis, comprehensive teardowns of complex problems.',
      badge: {
        text: '🔬 Mổ xẻ / Deep Dive',
        desc: 'Detailed domain teardown, insider analysis, or technical deep dive (Phân tích chuyên sâu)',
        bg: 'rgba(99, 102, 241, 0.2)',
        border: '#6366f1',
        color: '#818cf8',
      },
    },
    'wholesome / positive': {
      configKey: 'filterWholesomeEnabled',
      instruction: 'uplifting, heartwarming, kind, peaceful, constructive positive stories, wholesome moments.',
      badge: {
        text: '🌿 Wholesome / Tích cực',
        desc: 'Uplifting, heartwarming, and constructive positive content (Ấm áp, tích cực)',
        bg: 'rgba(16, 185, 129, 0.18)',
        border: '#10b981',
        color: '#34d399',
      },
    },
    'fearmongering / doom': {
      configKey: 'filterDoomEnabled',
      instruction: 'alarming, sensationalized bad news, apocalyptic anxiety, catastrophic predictions, fearmongering.',
      badge: {
        text: '⚠️ Doom / Gieo rắc sợ hãi',
        desc: 'Sensationalized bad news, existential threat, or doom anxiety (Gieo rắc sợ hãi / bi quan)',
        bg: 'rgba(249, 115, 22, 0.18)',
        border: '#f97316',
        color: '#fb923c',
      },
    },
    'fomo / hype': {
      configKey: 'filterFomoEnabled',
      countKey: 'fomoCount',
      badge: {
        text: '⚡ FOMO / Hype',
        desc: 'Hyperbolic hype, get-rich-quick claims (Lùa gà, thổi phồng ảo)',
        bg: 'rgba(234, 179, 8, 0.15)',
        border: '#eab308',
        color: '#fde047',
      },
      instruction: 'exaggerated breakthrough hype, urgency inducing claims, overnight wealth promises, or artificial urgency.',
    },
    'other / casual discussion': {
      configKey: 'filterCasualEnabled',
      countKey: 'casualCount',
      badge: {
        text: '💬 Thảo luận / Khác',
        desc: 'Everyday casual talk or general post (Thảo luận bình thường)',
        bg: 'rgba(100, 116, 139, 0.15)',
        border: '#64748b',
        color: '#94a3b8',
      },
      instruction: 'everyday personal chatter, news, generic talk, or any content that does not fit the other categories.',
    },
    'rage bait / toxic / hostile / dismissive negativity': {
      configKey: 'autoBlurRageEnabled',
      instruction: 'provocative content designed to incite outrage, anger, toxic drama, hostile or dismissive negativity, cynicism, or insults.',
    },
    'scam / fraudulent scheme': {
      configKey: 'blockScamsEnabled',
      instruction: 'online fraud, deceptive financial schemes, crypto Ponzi, fake high-yield investment, or fake remote job scams.',
    },
    'bot seeding / affiliate spam / fake review': {
      configKey: 'collapseSeedingEnabled',
      instruction: 'commercial astroturfing, bot farming, fake praise, affiliate link spam, or deceptive promotional clone comments.',
    },
  };

  const CATCH_ALL_LABEL = 'other / casual discussion';
  const CATCH_ALL_INSTRUCTION = 'everyday personal chatter, news, generic talk, or any content that does not fit the other categories.';

  const BADGE_MAP = {
    'self-improvement / motivational': TAXONOMY_CATALOG['self-improvement / motivational'].badge,
    'meme / humor / satire': TAXONOMY_CATALOG['meme / humor / satire'].badge,
    'deep dive / technical breakdown / industry insider': TAXONOMY_CATALOG['deep dive / technical breakdown / industry insider'].badge,
    'wholesome / positive': TAXONOMY_CATALOG['wholesome / positive'].badge,
    'fearmongering / doom': TAXONOMY_CATALOG['fearmongering / doom'].badge,
    'fomo / hype': TAXONOMY_CATALOG['fomo / hype'].badge,
    'other / casual discussion': TAXONOMY_CATALOG['other / casual discussion'].badge,
  };

  function getActiveTaxonomy(cfg = {}) {
    const activeLabels = [];
    const instructionsList = [];

    Object.entries(TAXONOMY_CATALOG).forEach(([label, def]) => {
      if (label === CATCH_ALL_LABEL) return; // Always appended at the end
      if (cfg && cfg[def.configKey] !== false) {
        activeLabels.push(label);
        instructionsList.push(`"${label}": ${def.instruction}`);
      }
    });

    if (Array.isArray(cfg?.customLabels)) {
      cfg.customLabels.forEach((c) => {
        const rawName = typeof c === 'string' ? c : c?.name;
        const enabled = typeof c === 'object' ? c?.enabled !== false : true;
        const name = rawName ? rawName.replace(/["\r\n\t]/g, '').slice(0, 40).trim() : '';
        const isDuplicate =
          !name ||
          name.toLowerCase() === CATCH_ALL_LABEL.toLowerCase() ||
          Boolean(TAXONOMY_CATALOG[name.toLowerCase()]) ||
          activeLabels.some((l) => l.toLowerCase() === name.toLowerCase());
        if (enabled && !isDuplicate) {
          activeLabels.push(name);
          instructionsList.push(`"${name}": content specifically discussing, focused on, or related to ${name}.`);
        }
      });
    }

    if (activeLabels.length === 0) {
      return { labels: [], instructions: '' };
    }

    activeLabels.push(CATCH_ALL_LABEL);
    instructionsList.push(`"${CATCH_ALL_LABEL}": ${CATCH_ALL_INSTRUCTION}`);

    const formattedInstructions = instructionsList.map((item, idx) => `${idx + 1}. ${item}`).join(' ');

    return {
      labels: activeLabels,
      instructions:
        'Analyze social media content in Vietnamese or English for any categories that apply: ' +
        formattedInstructions,
    };
  }

  let queue = [];
  let debounceTimer = null;

  function openVaultDashboard() {
    const dashboardUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
      ? chrome.runtime.getURL('dashboard.html')
      : 'dashboard.html';

    let msgSent = false;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' }, (res) => {
          if (chrome.runtime?.lastError || !res?.success) {
            window.open(dashboardUrl, '_blank');
          }
        });
        msgSent = true;
      } catch (err) {
        window.open(dashboardUrl, '_blank');
        return;
      }
    }
    if (!msgSent) {
      window.open(dashboardUrl, '_blank');
    }
  }

  // Dynamic Island / Radar Status Widget UI (ReactBits Border Beam & Shadcn)
  const pill = document.createElement('div');
  pill.className = 'x-jev-floating-pill';
  pill.title = 'Social Shield (Nhấn để xem thống kê / bật tắt)';

  const pillBeam = document.createElement('span');
  pillBeam.className = 'x-jev-pill-beam';
  pill.appendChild(pillBeam);

  const radarDot = document.createElement('span');
  radarDot.className = 'x-jev-radar-dot';
  const radarPing = document.createElement('span');
  radarPing.className = 'x-jev-radar-ping';
  radarDot.appendChild(radarPing);

  const pillPlatform = document.createElement('span');
  pillPlatform.className = 'x-jev-pill-platform';

  const pillBadgeCount = document.createElement('span');
  pillBadgeCount.className = 'x-jev-pill-badge-count';
  pillBadgeCount.textContent = '0';

  const pillToggle = document.createElement('span');
  pillToggle.className = 'x-jev-pill-toggle';
  pillToggle.innerHTML = ICONS.chevronDown;

  const pillClose = document.createElement('span');
  pillClose.className = 'x-jev-pill-close';
  pillClose.title = 'Ẩn thanh trạng thái (bật lại trong popup)';
  pillClose.innerHTML = ICONS.x;

  // Flyout Panel
  const flyout = document.createElement('div');
  flyout.className = 'x-jev-pill-flyout';
  flyout.innerHTML = `
    <div class="x-jev-flyout-header">
      <div class="x-jev-flyout-title">${ICONS.shield} Social Shield</div>
      <span class="x-jev-flyout-status">Active</span>
    </div>
    <div class="x-jev-flyout-grid">
      <div class="x-jev-metric-card">
        <span class="x-jev-metric-label">${ICONS.scan} Đã quét</span>
        <span class="x-jev-metric-val" id="x-jev-stat-scanned">0</span>
      </div>
      <div class="x-jev-metric-card">
        <span class="x-jev-metric-label">${ICONS.flame} Ragebait</span>
        <span class="x-jev-metric-val" id="x-jev-stat-rage" style="color:#f87171;">0</span>
      </div>
      <div class="x-jev-metric-card">
        <span class="x-jev-metric-label">${ICONS.shieldAlert} Lừa đảo</span>
        <span class="x-jev-metric-val" id="x-jev-stat-scam" style="color:#fb923c;">0</span>
      </div>
      <div class="x-jev-metric-card">
        <span class="x-jev-metric-label">${ICONS.target} Focus ẩn</span>
        <span class="x-jev-metric-val" id="x-jev-stat-focus" style="color:#38bdf8;">0</span>
      </div>
      <div class="x-jev-metric-card">
        <span class="x-jev-metric-label">${ICONS.broom} Seeding</span>
        <span class="x-jev-metric-val" id="x-jev-stat-seeding" style="color:#c084fc;">0</span>
      </div>
      <div class="x-jev-metric-card">
        <span class="x-jev-metric-label">${ICONS.eyeOff} Monk Mode</span>
        <span class="x-jev-metric-val" id="x-jev-stat-monk" style="color:#38bdf8;">0</span>
      </div>
    </div>
    <div id="x-jev-flyout-tag-summary" style="display:flex;flex-wrap:wrap;gap:4px;font-size:10px;color:#a1a1aa;padding-top:4px;border-top:1px solid rgba(255,255,255,0.06);"></div>
    <button id="x-jev-flyout-open-vault" type="button" style="width:100%;margin-top:6px;padding:6px 10px;background:rgba(2,132,199,0.15);border:1px solid rgba(2,132,199,0.3);border-radius:6px;color:#38bdf8;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:background 0.2s;">
      ${ICONS.zap} Mở Hook Vault Dashboard
    </button>
    <div style="font-size:9.5px;color:#71717a;text-align:center;margin-top:4px;">Nhấn đúp vào thanh để Bật/Tắt chế độ bảo vệ</div>
  `;

  pill.appendChild(radarDot);
  pill.appendChild(pillPlatform);
  pill.appendChild(pillBadgeCount);
  pill.appendChild(pillToggle);
  pill.appendChild(pillClose);
  pill.appendChild(flyout);

  const btnOpenVault = flyout.querySelector('#x-jev-flyout-open-vault');
  if (btnOpenVault) {
    btnOpenVault.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openVaultDashboard();
    });
  }

  // Capture phase listeners so React / framework can NEVER swallow close click
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target && e.target.closest && e.target.closest('.x-jev-pill-close')) {
        e.preventDefault();
        e.stopPropagation();
        config.hideFloatingPill = true;
        initPill();
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ hideFloatingPill: true });
        }
      }
    },
    true
  );

  document.addEventListener(
    'click',
    (e) => {
      if (e.target && e.target.closest && e.target.closest('.x-jev-pill-close')) {
        e.preventDefault();
        e.stopPropagation();
        config.hideFloatingPill = true;
        initPill();
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ hideFloatingPill: true });
        }
      }
    },
    true
  );

  function initPill() {
    if (document.body) {
      document.body.classList.toggle('x-jev-hide-pill', !!config.hideFloatingPill);
    }
    if (config.hideFloatingPill) {
      pill.setAttribute('data-hidden', 'true');
      pill.classList.add('x-jev-pill-hidden');
      pill.style.setProperty('display', 'none', 'important');
      document.querySelectorAll('.x-jev-floating-pill').forEach((el) => {
        el.setAttribute('data-hidden', 'true');
        el.classList.add('x-jev-pill-hidden');
        el.style.setProperty('display', 'none', 'important');
        el.remove();
      });
      return;
    }

    pill.removeAttribute('data-hidden');
    pill.classList.remove('x-jev-pill-hidden');
    pill.style.setProperty('display', 'flex', 'important');
    if (document.body && !document.contains(pill)) {
      document.body.appendChild(pill);
    }
  }

  function updatePill() {
    if (config.hideFloatingPill) {
      initPill();
      return;
    }
    initPill();
    const pName = getPlatform().toUpperCase();
    pillPlatform.textContent = pName;

    const totalProtected = blockedRageCount + blockedScamCount + cleanedSeedingCount + focusCollapsedCount + monkModeBlockedCount;
    pillBadgeCount.textContent = totalProtected > 0 ? `${totalProtected} chặn` : `${scannedCount} quét`;

    const hasThreats = (blockedRageCount > 0 || blockedScamCount > 0);
    pill.setAttribute('data-alert', hasThreats ? 'true' : 'false');

    const elScanned = flyout.querySelector('#x-jev-stat-scanned');
    const elRage = flyout.querySelector('#x-jev-stat-rage');
    const elScam = flyout.querySelector('#x-jev-stat-scam');
    const elFocus = flyout.querySelector('#x-jev-stat-focus');
    const elSeeding = flyout.querySelector('#x-jev-stat-seeding');
    const elMonk = flyout.querySelector('#x-jev-stat-monk');
    const elStatus = flyout.querySelector('.x-jev-flyout-status');

    if (elScanned) elScanned.textContent = scannedCount;
    if (elRage) elRage.textContent = blockedRageCount;
    if (elScam) elScam.textContent = blockedScamCount;
    if (elFocus) elFocus.textContent = focusCollapsedCount;
    if (elSeeding) elSeeding.textContent = cleanedSeedingCount;
    if (elMonk) elMonk.textContent = monkModeBlockedCount;

    const allOn = config.monkModeEnabled || config.autoBlurRageEnabled || config.blockScamsEnabled || config.collapseSeedingEnabled;
    if (elStatus) {
      elStatus.textContent = allOn ? 'Active' : 'Paused';
      elStatus.style.background = allOn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      elStatus.style.color = allOn ? '#4ade80' : '#f87171';
      elStatus.style.borderColor = allOn ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    }

    const tagSummary = flyout.querySelector('#x-jev-flyout-tag-summary');
    if (tagSummary) {
      const activeTags = [];
      if (motivationalCount > 0) activeTags.push(`Động lực: ${motivationalCount}`);
      if (memeCount > 0) activeTags.push(`Meme: ${memeCount}`);
      if (deepDiveCount > 0) activeTags.push(`Deep Dive: ${deepDiveCount}`);
      if (wholesomeCount > 0) activeTags.push(`Wholesome: ${wholesomeCount}`);
      if (doomCount > 0) activeTags.push(`Doom: ${doomCount}`);
      if (fomoCount > 0) activeTags.push(`FOMO: ${fomoCount}`);
      if (casualCount > 0) activeTags.push(`Thảo luận: ${casualCount}`);
      if (customCount > 0) activeTags.push(`Custom: ${customCount}`);

      tagSummary.innerHTML = activeTags.length > 0
        ? activeTags.map((t) => `<span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;">${t}</span>`).join('')
        : '<span style="opacity:0.6;">Chưa ghi nhận tag nổi bật</span>';
    }
  }

  updatePill();

  // Toggle expand flyout on click
  pill.addEventListener('click', (e) => {
    if (e.target.closest('.x-jev-pill-close')) return;
    if (e.target.closest('.x-jev-pill-flyout')) {
      e.stopPropagation();
      return;
    }
    pill.classList.toggle('x-jev-expanded');
  });

  // Hover to expand smoothly
  pill.addEventListener('mouseenter', () => {
    pill.classList.add('x-jev-expanded');
  });
  pill.addEventListener('mouseleave', () => {
    pill.classList.remove('x-jev-expanded');
  });

  // Double click toggles master protection state
  pill.addEventListener('dblclick', (e) => {
    if (e.target.closest('.x-jev-pill-close')) return;
    const allOn = config.monkModeEnabled || config.autoBlurRageEnabled || config.blockScamsEnabled || config.collapseSeedingEnabled;
    config.monkModeEnabled = !allOn;
    config.autoBlurRageEnabled = !allOn;
    config.blockScamsEnabled = !allOn;
    config.collapseSeedingEnabled = !allOn;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        monkModeEnabled: config.monkModeEnabled,
        autoBlurRageEnabled: config.autoBlurRageEnabled,
        blockScamsEnabled: config.blockScamsEnabled,
        collapseSeedingEnabled: config.collapseSeedingEnabled,
      });
    }
    updatePill();
    applyStateToDOM();
  });

  if (document.body) {
    initPill();
  } else {
    document.addEventListener('DOMContentLoaded', initPill);
  }

  function applyStateToDOM() {
    if (document.body) {
      document.body.classList.toggle('x-jev-no-rage-blur', !config.autoBlurRageEnabled);
      document.body.classList.toggle('x-jev-no-monk-blur', !config.monkModeEnabled);
      document.body.classList.toggle('x-jev-no-scam-blur', !config.blockScamsEnabled);
      document.body.classList.toggle('x-jev-hide-pill', !!config.hideFloatingPill);
      document.body.classList.toggle('x-jev-no-focus', !config.focusModeEnabled);
      const disableAll = !config.autoBlurRageEnabled && !config.monkModeEnabled && !config.blockScamsEnabled;
      document.body.classList.toggle('x-jev-disable-all-blur', disableAll);
    }

    // 0. Facebook Reels & Video Popups State
    document.querySelectorAll('[data-monk-reels-blocked="true"]').forEach((dialog) => {
      const overlay = dialog.querySelector('.x-monk-reels-overlay');
      if (config.monkModeEnabled || config.blockReelsEnabled) {
        if (!dialog.classList.contains('monk-revealed')) {
          if (overlay) overlay.style.display = 'flex';
          dialog.querySelectorAll('video').forEach((v) => { try { v.pause(); v.muted = true; } catch (e) {} });
        }
      } else {
        dialog.classList.add('monk-revealed');
        if (overlay) overlay.style.display = 'none';
      }
    });

    document.querySelectorAll('[data-monk-tray-blocked="true"]').forEach((tray) => {
      const banner = tray.querySelector('.x-monk-tray-banner');
      if (config.monkModeEnabled || config.blockReelsEnabled) {
        if (!tray.classList.contains('monk-revealed')) {
          if (banner) banner.style.display = 'flex';
        }
      } else {
        tray.classList.add('monk-revealed');
        if (banner) banner.style.display = 'none';
      }
    });

    // 1. Monk Mode State
    document.querySelectorAll('[data-monk-blocked="true"]').forEach((post) => {
      const box = post.querySelector('.x-monk-warning-box');
      if (config.monkModeEnabled) {
        if (!post.hasAttribute('data-user-revealed')) {
          post.classList.remove('monk-revealed');
          post.removeAttribute('data-monk-revealed');
          if (box) box.style.display = 'flex';
        }
      } else {
        post.classList.add('monk-revealed');
        post.setAttribute('data-monk-revealed', 'true');
        post.querySelectorAll('img, video, .monk-blur-media').forEach((m) => {
          m.style.setProperty('filter', 'none', 'important');
          m.style.setProperty('opacity', '1', 'important');
          m.style.setProperty('pointer-events', 'auto', 'important');
        });
        if (box) box.style.display = 'none';
      }
    });

    // 2. Rage Bait state
    document.querySelectorAll('[data-jev-rage="true"]').forEach((post) => {
      const warning = post.querySelector('.x-jev-warning-box');
      if (config.autoBlurRageEnabled) {
        if (!post.hasAttribute('data-user-revealed')) {
          post.classList.remove('x-jev-revealed');
          post.removeAttribute('data-jev-revealed');
          if (warning) warning.style.display = 'flex';
        }
      } else {
        post.classList.add('x-jev-revealed');
        post.setAttribute('data-jev-revealed', 'true');
        post.querySelectorAll('[data-jev-blur-item="true"], span[dir="auto"], div[dir="auto"], img, video').forEach((el) => {
          el.style.setProperty('filter', 'none', 'important');
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('pointer-events', 'auto', 'important');
          el.style.setProperty('user-select', 'auto', 'important');
        });
        if (warning) warning.style.display = 'none';
      }
    });

    // 3. Scam state
    document.querySelectorAll('[data-jev-scam="true"]').forEach((post) => {
      const scamBox = post.querySelector('.x-jev-scam-box');
      if (config.blockScamsEnabled) {
        if (!post.hasAttribute('data-user-revealed')) {
          post.classList.remove('x-jev-revealed');
          post.removeAttribute('data-jev-revealed');
          if (scamBox) scamBox.style.display = 'flex';
        }
      } else {
        post.classList.add('x-jev-revealed');
        post.setAttribute('data-jev-revealed', 'true');
        post.querySelectorAll('[data-jev-blur-item="true"], span[dir="auto"], div[dir="auto"], img, video').forEach((el) => {
          el.style.setProperty('filter', 'none', 'important');
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('pointer-events', 'auto', 'important');
        });
        if (scamBox) scamBox.style.display = 'none';
      }
    });

    // 4. Seeding collapse state
    document.querySelectorAll('[data-jev-seeding="true"]').forEach((post) => {
      const bar = post.querySelector('.x-jev-seeding-collapsed');
      const content = post.querySelector('[data-jev-seeding-content]');
      if (config.collapseSeedingEnabled) {
        if (bar) bar.style.display = 'flex';
        if (content) content.classList.add('x-jev-collapsed-body');
      } else {
        if (bar) bar.style.display = 'none';
        if (content) content.classList.remove('x-jev-collapsed-body');
      }
    });

    // 5. Curated & Custom Badges State
    document.querySelectorAll('.x-jev-badge').forEach((badge) => {
      const cat = badge.getAttribute('data-jev-badge-category');
      const def = TAXONOMY_CATALOG[cat];
      let isHidden = false;
      if ((def && config[def.configKey] === false) || (cat === 'other / casual discussion' && window.location.pathname.includes('/activity'))) {
        isHidden = true;
      } else if (Array.isArray(config.customLabels)) {
        const customFound = config.customLabels.find(
          (c) => (typeof c === 'string' ? c : c?.name)?.trim().toLowerCase() === cat?.trim().toLowerCase()
        );
        if (customFound && typeof customFound === 'object' && customFound.enabled === false) {
          isHidden = true;
        } else if (!customFound && !def && cat !== 'other / casual discussion') {
          isHidden = true;
        }
      }
      if (isHidden) {
        badge.classList.add('x-jev-hidden');
        badge.style.setProperty('display', 'none', 'important');
      } else {
        badge.classList.remove('x-jev-hidden');
        badge.style.removeProperty('display');
      }
    });

    // 6. Restore bypassed posts if taxonomy is enabled
    const activeTaxonomy = getActiveTaxonomy(config);
    if (activeTaxonomy.labels && activeTaxonomy.labels.length > 1) {
      let restoredCount = 0;
      document.querySelectorAll('[data-jev-bypassed="true"]').forEach((post) => {
        post.removeAttribute('data-jev-bypassed');
        post.removeAttribute('data-jev-scanned');
        post.removeAttribute('data-jev-cmt-scanned');
        post.removeAttribute('data-jev-handled');
        restoredCount++;
      });
      if (restoredCount > 0 && typeof scheduleScan === 'function') {
        scheduleScan();
      }
    }

    // 7. Focus Feed Mode: Re-evaluate state on all classified posts
    let currentFocusCount = 0;
    document.querySelectorAll('[data-jev-assigned-label]').forEach((post) => {
      const assignedLabel = post.getAttribute('data-jev-assigned-label');
      const matchesFocus = isPostMatchingFocus(assignedLabel);
      const bar = post.querySelector('.x-jev-focus-bar');
      const textEl = post.querySelector('[data-jev-tracked-text="true"]') || post.querySelector('span[dir="auto"], div[dir="auto"]');

      if (config.focusModeEnabled && !matchesFocus) {
        currentFocusCount++;
        post.setAttribute('data-jev-focus-offtag', 'true');
        if (textEl) textEl.classList.add('x-jev-focus-collapsed-content');
        post.querySelectorAll('img, video, .x-jev-badge, .x-jev-warning-box, .x-jev-scam-box, .x-monk-warning-box, .x-jev-seeding-collapsed').forEach((m) => {
          if (!m.closest('a[href*="/@"]')) m.classList.add('x-jev-focus-collapsed-content');
        });
        if (!bar && textEl) {
          createFocusBar(post, textEl, assignedLabel);
        } else if (bar) {
          bar.style.display = 'flex';
        }
      } else {
        post.removeAttribute('data-jev-focus-offtag');
        if (textEl) textEl.classList.remove('x-jev-focus-collapsed-content');
        post.querySelectorAll('.x-jev-focus-collapsed-content').forEach((m) => {
          m.classList.remove('x-jev-focus-collapsed-content');
        });
        if (bar) bar.style.display = 'none';
        post.classList.remove('x-jev-focus-expanded');
      }
    });

    if (config.focusModeEnabled) {
      focusCollapsedCount = currentFocusCount;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ focusCollapsedCount });
      }
    }
  }

  // --- HARDCORE MONK MODE: CLIENT-SIDE INSTANT MEDIA SCANNER ---
  // Inspects non-avatar images & videos for Meta AI accessibility alt-tags and captions
  function checkAndApplyMonkMode(postEl, text) {
    if (!config.monkModeEnabled) return false;
    if (postEl.hasAttribute('data-monk-blocked')) return true;

    const mediaList = postEl.querySelectorAll('img, video');
    if (mediaList.length === 0) return false;

    let hasWomenMedia = false;
    let detectedReason = '';

    // Check media alt tags and aria labels
    mediaList.forEach((media) => {
      const isAvatar = (media.closest('a[href*="/@"]') && (media.width < 50 || media.height < 50)) ||
                       media.alt?.toLowerCase().includes('avatar') ||
                       media.alt?.toLowerCase().includes('profile') ||
                       media.src?.includes('profile_images');
      if (isAvatar) return;

      const altText = (media.alt || '') + ' ' + (media.getAttribute('aria-label') || '') + ' ' + (media.title || '');
      if (WOMEN_OR_GOONBAIT_REGEX.test(altText)) {
        hasWomenMedia = true;
        detectedReason = 'Ảnh/Video phụ nữ (Meta AI Alt-Tag)';
      }
    });

    // Also check if text caption has strong goon-bait signals
    if (!hasWomenMedia && WOMEN_OR_GOONBAIT_REGEX.test(text)) {
      hasWomenMedia = true;
      detectedReason = 'Nội dung Goon-baiting / Thirst trap';
    }

    if (hasWomenMedia) {
      postEl.setAttribute('data-monk-blocked', 'true');
      monkModeBlockedCount++;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ monkModeBlockedCount });
      }
      updatePill();

      // Create Monk Mode Warning Bar
      if (!postEl.querySelector('.x-monk-warning-box')) {
        const box = document.createElement('div');
        box.className = 'x-monk-warning-box';
        box.innerHTML = `
          <div class="x-monk-warning-text">
            <span>🧘</span>
            <div>
              <b>Monk Mode: Đã che ảnh/video để giữ tập trung tuyệt đối.</b>
              <div style="font-size:10.5px;font-weight:400;opacity:0.9;margin-top:1px;">${detectedReason}</div>
            </div>
          </div>
        `;

        const btn = document.createElement('button');
        btn.className = 'x-monk-reveal-btn';
        btn.textContent = 'Xem ảnh';
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isRevealed = postEl.classList.toggle('monk-revealed');
          if (isRevealed) {
            postEl.setAttribute('data-monk-revealed', 'true');
            postEl.setAttribute('data-user-revealed', 'true');
            postEl.querySelectorAll('img, video, .monk-blur-media').forEach((m) => {
              m.style.setProperty('filter', 'none', 'important');
              m.style.setProperty('opacity', '1', 'important');
              m.style.setProperty('pointer-events', 'auto', 'important');
            });
            btn.textContent = 'Ẩn lại';
          } else {
            postEl.removeAttribute('data-monk-revealed');
            postEl.removeAttribute('data-user-revealed');
            postEl.querySelectorAll('img, video, .monk-blur-media').forEach((m) => {
              m.style.removeProperty('filter');
              m.style.removeProperty('opacity');
              m.style.removeProperty('pointer-events');
            });
            btn.textContent = 'Xem ảnh';
          }
        };

        box.appendChild(btn);

        // Insert at the top of media or before first image
        const firstMedia = Array.from(mediaList).find((m) => !m.closest('a[href*="/@"]'));
        if (firstMedia && firstMedia.parentElement) {
          firstMedia.parentElement.insertBefore(box, firstMedia);
        } else {
          postEl.prepend(box);
        }
      }

      postEl.classList.remove('monk-revealed');
      return true;
    }

    return false;
  }

  // Call Jev API: Route via background service worker to bypass page CSP
  // Call Jev API: Route via background service worker to bypass page CSP
  async function callJevBatch(inputs) {
    const taxonomy = getActiveTaxonomy(config);
    if (!taxonomy.labels || taxonomy.labels.length <= 1) {
      return inputs.map(() => ({ label: CATCH_ALL_LABEL, confidence: 1 }));
    }

    console.log(`[Social Shield] 📡 Gửi ${inputs.length} mẫu text lên Jev AI (active labels: ${taxonomy.labels.length})...`);
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage(
            {
              type: 'CLASSIFY_BATCH',
              payload: {
                labels: taxonomy.labels,
                inputs: inputs,
                instructions: taxonomy.instructions,
              },
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.warn('[Social Shield] Worker error, direct fetch fallback:', chrome.runtime.lastError.message);
                directFetch(inputs, taxonomy).then(resolve);
              } else if (response && response.success) {
                console.log(`[Social Shield] ✅ Nhận kết quả Jev cho ${response.results?.length} items.`);
                resolve(response.results || []);
              } else {
                directFetch(inputs, taxonomy).then(resolve);
              }
            }
          );
        } catch (e) {
          directFetch(inputs, taxonomy).then(resolve);
        }
      });
    }
    return directFetch(inputs, taxonomy);
  }

  async function directFetch(inputs, activeTax) {
    try {
      const tax = activeTax || getActiveTaxonomy(config);
      if (!tax.labels || tax.labels.length <= 1) {
        return inputs.map(() => ({ label: CATCH_ALL_LABEL, confidence: 1 }));
      }
      const res = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labels: tax.labels,
          inputs: inputs,
          instructions: tax.instructions,
          multi: true,
          max_labels: 5,
        }),
      });
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      return [];
    }
  }

  function isProfileOnlyLink(el) {
    if (!el) return false;
    if (el.closest('[data-testid="User-Name"]') || el.closest('[data-testid="Tweet-User-Avatar"]') || el.closest('[data-testid="UserAvatar-Container"]')) return true;
    const a = el.closest('a[href*="/@"]');
    if (!a) return false;
    const href = a.getAttribute('href') || '';
    // If href contains /post/ or /t/, it links to post content, NOT a user profile link!
    return !href.includes('/post/') && !href.includes('/t/');
  }

  function isHeaderOrNavigation(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (el.closest && el.closest('header, nav, [role="banner"], [role="navigation"], [aria-label*="navigation" i], [aria-label*="header" i], [data-testid*="header" i], [data-testid*="topbar" i], [data-testid*="nav" i]')) {
      return true;
    }
    let curr = el;
    let depth = 0;
    while (curr && curr !== document.body && curr !== document.documentElement && depth < 6) {
      try {
        const style = window.getComputedStyle(curr);
        if (style && (style.position === 'sticky' || style.position === 'fixed')) {
          return true;
        }
      } catch (e) {}
      curr = curr.parentElement;
      depth++;
    }
    return false;
  }

  function syncRevealState(targetEl, isRevealed, text) {
    if (text) {
      if (isRevealed) revealedTexts.add(text);
      else revealedTexts.delete(text);
      saveRevealedToStorage();
    }

    const apply = (el) => {
      el.classList.toggle('x-jev-revealed', isRevealed);
      if (isRevealed) el.setAttribute('data-jev-revealed', 'true');
      else el.removeAttribute('data-jev-revealed');
    };

    apply(targetEl);

    let p = targetEl.parentElement;
    while (p && p !== document.body) {
      if (p.hasAttribute('data-jev-rage') || p.hasAttribute('data-jev-scam') || p.hasAttribute('data-jev-scanned')) {
        apply(p);
      }
      p = p.parentElement;
    }
    targetEl.querySelectorAll('[data-jev-rage="true"], [data-jev-scam="true"], [data-jev-scanned="true"]').forEach((child) => {
      apply(child);
    });
  }

  function applyInlineUnblur(postEl, isRevealed) {
    const targets = postEl.querySelectorAll('[data-jev-blur-item="true"], span[dir="auto"], div[dir="auto"], img, video');
    if (isRevealed) {
      targets.forEach((el) => {
        el.style.setProperty('filter', 'none', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
      });
    } else {
      targets.forEach((el) => {
        el.style.removeProperty('filter');
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
      });
    }
  }

  function getPostTagKey(label) {
    if (label === 'self-improvement / motivational') return 'motivational';
    if (label === 'meme / humor / satire') return 'meme';
    if (label === 'deep dive / technical breakdown / industry insider') return 'deepdive';
    if (label === 'wholesome / positive') return 'wholesome';
    if (label === 'fearmongering / doom') return 'doom';
    if (label === 'fomo / hype') return 'fomo';
    if (label === 'other / casual discussion') return 'casual';
    if (Array.isArray(config.customLabels)) {
      const isCustom = config.customLabels.some(
        (c) => (typeof c === 'string' ? c : c?.name)?.trim().toLowerCase() === label?.trim().toLowerCase()
      );
      if (isCustom) return 'custom';
    }
    return null;
  }

  function getDisplayLabelName(label) {
    if (label === 'self-improvement / motivational') return 'Động lực';
    if (label === 'meme / humor / satire') return 'Meme';
    if (label === 'deep dive / technical breakdown / industry insider') return 'Deep Dive';
    if (label === 'wholesome / positive') return 'Wholesome';
    if (label === 'fearmongering / doom') return 'Doom';
    if (label === 'fomo / hype') return 'FOMO';
    if (label === 'other / casual discussion') return 'Thảo luận';
    if (label === 'scam / fraudulent scheme') return 'Lừa đảo';
    if (label === 'rage bait / toxic / hostile / dismissive negativity') return 'Rage Bait';
    if (label === 'bot seeding / affiliate spam / fake review') return 'Seeding';
    return label || 'Chủ đề khác';
  }

  function isPostMatchingFocus(labels) {
    if (!config.focusModeEnabled) return true;
    const allowedTags = Array.isArray(config.focusWhitelistTags) ? config.focusWhitelistTags : [];
    if (allowedTags.length === 0) return true;

    const labelList = Array.isArray(labels)
      ? labels
      : (typeof labels === 'string' ? labels.split('|') : []);
    if (labelList.length === 0) return false;

    return labelList.some((lbl) => {
      const tagKey = getPostTagKey(lbl);
      return tagKey && allowedTags.includes(tagKey);
    });
  }

  function createFocusBar(postEl, textEl, labels) {
    if (postEl.querySelector('.x-jev-focus-bar')) return;
    const parentContainer = textEl.parentElement;
    if (!parentContainer) return;

    const labelList = Array.isArray(labels)
      ? labels
      : (typeof labels === 'string' ? labels.split('|') : []);
    const displayTag = labelList.map((l) => getDisplayLabelName(l)).join(', ') || 'Chủ đề khác';
    const focusBar = document.createElement('div');
    focusBar.className = 'x-jev-focus-bar';
    focusBar.innerHTML = `
      <div class="x-jev-focus-info">
        ${ICONS.target}
        <span>Khác tag Focus: <b style="color:#e2e8f0;">${displayTag}</b></span>
      </div>
      <span class="x-jev-focus-action"><span>Xem nội dung</span>${ICONS.chevronDown}</span>
    `;
    focusBar.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = postEl.classList.toggle('x-jev-focus-expanded');
      const actionText = focusBar.querySelector('.x-jev-focus-action span');
      if (actionText) {
        actionText.textContent = isExpanded ? 'Thu gọn' : 'Xem nội dung';
      }
    });
    parentContainer.insertBefore(focusBar, textEl);
  }

  function checkAndApplyFocusCollapse(postEl, textEl, labels) {
    const labelStr = Array.isArray(labels) ? labels.join('|') : (labels || '');
    postEl.setAttribute('data-jev-assigned-label', labelStr);
    textEl.setAttribute('data-jev-tracked-text', 'true');
    if (config.focusModeEnabled && !isPostMatchingFocus(labels)) {
      postEl.setAttribute('data-jev-focus-offtag', 'true');
      textEl.classList.add('x-jev-focus-collapsed-content');
      postEl.querySelectorAll('img, video, .x-jev-badge, .x-jev-badge-container, .x-jev-warning-box, .x-jev-scam-box, .x-monk-warning-box, .x-jev-seeding-collapsed').forEach((m) => {
        if (!m.closest('a[href*="/@"]')) m.classList.add('x-jev-focus-collapsed-content');
      });
      createFocusBar(postEl, textEl, labels);
      focusCollapsedCount++;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ focusCollapsedCount });
      }
      updatePill();
    }
  }

  // Unified Rendering Logic
  function renderClassification(item, res) {
    const { postEl, textEl } = item;
    if (!textEl || !textEl.parentElement) return;

    // Check Monk Mode first
    checkAndApplyMonkMode(postEl, item.text);

    if (postEl.hasAttribute('data-jev-handled')) return;
    if (!res || typeof res !== 'object') return;

    let scores = {};
    if (typeof res.scores === 'object' && res.scores !== null) {
      scores = res.scores;
    } else if (Array.isArray(res.labels) && res.labels.length > 0) {
      res.labels.forEach((lbl, idx) => {
        if (typeof lbl === 'string') {
          scores[lbl] = Math.max(0.70, 0.95 - idx * 0.05);
        }
      });
    } else if (res.label) {
      scores = { [res.label]: typeof res.confidence === 'number' ? res.confidence : 0.88 };
    }
    const parentContainer = textEl.parentElement;

    const matchedLabels = Object.entries(scores)
      .filter(([, s]) => typeof s === 'number' && Number.isFinite(s) && s >= config.confidenceThreshold)
      .map(([l, s]) => `${l} (${Math.round(s * 100)}%)`);
    console.log(`[Social Shield 🔍] "${item.text.slice(0, 35)}..." => ${matchedLabels.join(', ') || 'no match'}`);

    // --- PRIORITY 1: SCAM / FRAUDULENT SCHEME ---
    const rawScam = scores['scam / fraudulent scheme'];
    const scamScore = typeof rawScam === 'number' && Number.isFinite(rawScam) ? rawScam : 0;
    if (scamScore >= config.confidenceThreshold) {
      postEl.setAttribute('data-jev-handled', 'true');
      postEl.setAttribute('data-jev-scam', 'true');
      console.info(`[Social Shield 🛑 CHẶN SCAM]`, item.text);
      blockedScamCount++;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ blockedScamCount });
      }
      updatePill();

      // Remove any lingering badges or container (including sibling container on comments)
      postEl.querySelectorAll('.x-jev-badge-container, .x-jev-badge').forEach((b) => b.remove());
      if (postEl.previousElementSibling && postEl.previousElementSibling.classList.contains('x-jev-badge-container')) {
        postEl.previousElementSibling.remove();
      }

      textEl.setAttribute('data-jev-blur-item', 'true');
      postEl.querySelectorAll('img, video').forEach((m) => {
        if (!m.closest('a[href*="/@"]')) m.setAttribute('data-jev-blur-item', 'true');
      });

      if (!postEl.querySelector('.x-jev-scam-box')) {
        const box = document.createElement('div');
        box.className = 'x-jev-scam-box';
        const pct = Math.round(scamScore * 100);
        box.innerHTML = `
          <div class="x-jev-scam-text">
            ${ICONS.shieldAlert}
            <div>
              <b>Cảnh báo Lừa đảo / Bẫy tài chính (${pct}%):</b>
              <div style="font-size:11px;font-weight:400;opacity:0.85;margin-top:2px;">Dấu hiệu: Hứa hẹn thu nhập bất thường, lùa gà crypto hoặc kéo nhóm kín.</div>
            </div>
          </div>
        `;

        const btn = document.createElement('button');
        btn.className = 'x-jev-reveal-btn';
        btn.innerHTML = `${ICONS.scan} <span>Xem bài viết</span>`;
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isRevealed = !postEl.classList.contains('x-jev-revealed') && !postEl.hasAttribute('data-jev-revealed');
          syncRevealState(postEl, isRevealed, item.text);
          if (isRevealed) {
            postEl.setAttribute('data-jev-revealed', 'true');
            postEl.setAttribute('data-user-revealed', 'true');
            applyInlineUnblur(postEl, true);
            btn.textContent = 'Ẩn lại';
          } else {
            postEl.removeAttribute('data-jev-revealed');
            postEl.removeAttribute('data-user-revealed');
            applyInlineUnblur(postEl, false);
            btn.textContent = 'Xem bài viết';
          }
        };

        box.appendChild(btn);
        parentContainer.insertBefore(box, textEl);
      }

      const isScamRevealedByUser = revealedTexts.has(item.text);
      if (isScamRevealedByUser) {
        postEl.classList.add('x-jev-revealed');
        postEl.setAttribute('data-jev-revealed', 'true');
        postEl.setAttribute('data-user-revealed', 'true');
        applyInlineUnblur(postEl, true);
        const scamBtn = postEl.querySelector('.x-jev-scam-box .x-jev-reveal-btn');
        if (scamBtn) scamBtn.textContent = 'Ẩn lại';
      } else if (config.blockScamsEnabled) {
        postEl.classList.remove('x-jev-revealed');
        postEl.removeAttribute('data-jev-revealed');
        postEl.removeAttribute('data-user-revealed');
        applyInlineUnblur(postEl, false);
        const scamBtn = postEl.querySelector('.x-jev-scam-box .x-jev-reveal-btn');
        if (scamBtn) scamBtn.textContent = 'Xem bài viết';
      } else {
        postEl.classList.add('x-jev-revealed');
        postEl.setAttribute('data-jev-revealed', 'true');
        applyInlineUnblur(postEl, true);
      }
      checkAndApplyFocusCollapse(postEl, textEl, 'scam / fraudulent scheme');
      return;
    }

    // --- PRIORITY 2: RAGE BAIT / TOXIC / DISMISSIVE NEGATIVITY ---
    const rawRage =
      scores['rage bait / toxic / hostile / dismissive negativity'] || scores['rage bait / outrage'];
    const rageScore = typeof rawRage === 'number' && Number.isFinite(rawRage) ? rawRage : 0;
    if (rageScore >= config.confidenceThreshold) {
      postEl.setAttribute('data-jev-handled', 'true');
      postEl.setAttribute('data-jev-rage', 'true');
      console.info(`[Social Shield 🚨 CHẶN RAGE BAIT / TOXIC]`, item.text);
      blockedRageCount++;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ blockedRageCount });
      }
      updatePill();

      // Remove any lingering badges or container (including sibling container on comments)
      postEl.querySelectorAll('.x-jev-badge-container, .x-jev-badge').forEach((b) => b.remove());
      if (postEl.previousElementSibling && postEl.previousElementSibling.classList.contains('x-jev-badge-container')) {
        postEl.previousElementSibling.remove();
      }

      textEl.setAttribute('data-jev-blur-item', 'true');
      postEl.querySelectorAll('span[dir="auto"], div[dir="auto"]').forEach((span) => {
        if (!span.closest('button') && !span.closest('time') && !isProfileOnlyLink(span)) {
          span.setAttribute('data-jev-blur-item', 'true');
        }
      });
      postEl.querySelectorAll('img, video').forEach((m) => {
        if (!isProfileOnlyLink(m)) m.setAttribute('data-jev-blur-item', 'true');
      });

      if (!postEl.querySelector('.x-jev-warning-box')) {
        const warningBox = document.createElement('div');
        warningBox.className = 'x-jev-warning-box';
        const pct = Math.round(rageScore * 100);
        warningBox.innerHTML = `
          <span class="x-jev-warning-text">${ICONS.flame} <span><b>Ragebait / Toxic (${pct}%):</b> Nội dung tiêu cực hoặc công kích đã được làm mờ.</span></span>
        `;

        const revealBtn = document.createElement('button');
        revealBtn.className = 'x-jev-reveal-btn';
        revealBtn.innerHTML = `${ICONS.scan} <span>Reveal post</span>`;
        revealBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isRevealed = !postEl.classList.contains('x-jev-revealed') && !postEl.hasAttribute('data-jev-revealed');
          syncRevealState(postEl, isRevealed, item.text);
          if (isRevealed) {
            postEl.setAttribute('data-jev-revealed', 'true');
            postEl.setAttribute('data-user-revealed', 'true');
            applyInlineUnblur(postEl, true);
            revealBtn.textContent = 'Re-blur';
          } else {
            postEl.removeAttribute('data-jev-revealed');
            postEl.removeAttribute('data-user-revealed');
            applyInlineUnblur(postEl, false);
            revealBtn.textContent = 'Reveal post';
          }
        };

        warningBox.appendChild(revealBtn);
        parentContainer.insertBefore(warningBox, textEl);
      }

      const isRageRevealedByUser = revealedTexts.has(item.text);
      if (isRageRevealedByUser) {
        postEl.classList.add('x-jev-revealed');
        postEl.setAttribute('data-jev-revealed', 'true');
        postEl.setAttribute('data-user-revealed', 'true');
        applyInlineUnblur(postEl, true);
        const rBtn = postEl.querySelector('.x-jev-warning-box .x-jev-reveal-btn');
        if (rBtn) rBtn.textContent = 'Re-blur';
      } else if (config.autoBlurRageEnabled) {
        postEl.classList.remove('x-jev-revealed');
        postEl.removeAttribute('data-jev-revealed');
        postEl.removeAttribute('data-user-revealed');
        applyInlineUnblur(postEl, false);
        const rBtn = postEl.querySelector('.x-jev-warning-box .x-jev-reveal-btn');
        if (rBtn) rBtn.textContent = 'Reveal post';
      } else {
        postEl.classList.add('x-jev-revealed');
        postEl.setAttribute('data-jev-revealed', 'true');
        applyInlineUnblur(postEl, true);
      }
      checkAndApplyFocusCollapse(postEl, textEl, 'rage bait / toxic / hostile / dismissive negativity');
      return;
    }

    // --- PRIORITY 3: BOT SEEDING / AFFILIATE SPAM / FAKE REVIEW ---
    const rawSeeding =
      scores['bot seeding / affiliate spam / fake review'] || scores['bot seeding / affiliate spam'];
    const seedingScore = typeof rawSeeding === 'number' && Number.isFinite(rawSeeding) ? rawSeeding : 0;
    if (seedingScore >= config.confidenceThreshold) {
      postEl.setAttribute('data-jev-handled', 'true');
      postEl.setAttribute('data-jev-seeding', 'true');
      console.info(`[Social Shield 🧹 THU GỌN SEEDING]`, item.text);
      cleanedSeedingCount++;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ cleanedSeedingCount });
      }
      updatePill();

      // Remove any lingering badges or container (including sibling container on comments)
      postEl.querySelectorAll('.x-jev-badge-container, .x-jev-badge').forEach((b) => b.remove());
      if (postEl.previousElementSibling && postEl.previousElementSibling.classList.contains('x-jev-badge-container')) {
        postEl.previousElementSibling.remove();
      }

      textEl.setAttribute('data-jev-seeding-content', 'true');

      if (!postEl.querySelector('.x-jev-seeding-collapsed')) {
        const bar = document.createElement('div');
        bar.className = 'x-jev-seeding-collapsed';
        const pct = Math.round(seedingScore * 100);
        bar.innerHTML = `
          <div class="x-jev-seeding-label">
            ${ICONS.broom}
            <span>Đã thu gọn bình luận nghi vấn <b>Seeding / Clone</b> (${pct}%)</span>
          </div>
          <span class="x-jev-expand-icon"><span>Xem nội dung</span>${ICONS.chevronDown}</span>
        `;

        bar.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isCollapsed = textEl.classList.toggle('x-jev-collapsed-body');
          const txt = bar.querySelector('.x-jev-expand-icon span');
          if (txt) {
            txt.textContent = isCollapsed ? 'Xem nội dung' : 'Thu gọn';
          }
        };

        parentContainer.insertBefore(bar, textEl);

        if (config.collapseSeedingEnabled) {
          textEl.classList.add('x-jev-collapsed-body');
        }
      }
      checkAndApplyFocusCollapse(postEl, textEl, 'bot seeding / affiliate spam / fake review');
      return;
    }

    // --- PRIORITY 4: MULTI-TAG CONTENT BADGES ---
    const isActivity = window.location.pathname.includes('/activity');
    const eligibleBadges = [];

    Object.entries(scores).forEach(([candidateLabel, score]) => {
      if (typeof score !== 'number' || !Number.isFinite(score) || score < config.confidenceThreshold) return;
      if (
        candidateLabel === 'scam / fraudulent scheme' ||
        candidateLabel === 'rage bait / toxic / hostile / dismissive negativity' ||
        candidateLabel === 'rage bait / outrage' ||
        candidateLabel === 'bot seeding / affiliate spam / fake review' ||
        candidateLabel === 'bot seeding / affiliate spam'
      ) {
        return;
      }
      if (candidateLabel === 'other / casual discussion' && (config.filterCasualEnabled === false || isActivity)) {
        return;
      }

      const def = TAXONOMY_CATALOG[candidateLabel];
      if (def && config[def.configKey] === false) {
        return;
      }

      let isCustom = false;
      let customMeta = null;
      if (Array.isArray(config.customLabels)) {
        const customFound = config.customLabels.find(
          (c) => (typeof c === 'string' ? c : c?.name)?.trim().toLowerCase() === candidateLabel?.trim().toLowerCase()
        );
        if (customFound) {
          const isEnabled = typeof customFound === 'object' ? customFound.enabled !== false : true;
          if (!isEnabled) return;
          isCustom = true;
          const displayName = typeof customFound === 'object' ? customFound.name : customFound;
          customMeta = {
            text: `🏷️ ${displayName}`,
            desc: `Nhãn tùy chỉnh: ${displayName}`,
            bg: 'rgba(168, 85, 247, 0.18)',
            border: '#a855f7',
            color: '#c084fc',
          };
        }
      }

      const meta = BADGE_MAP[candidateLabel] || customMeta;
      if (meta) {
        eligibleBadges.push({ label: candidateLabel, score, meta, isCustom });
      }
    });

    // Sort by score descending and cap to top 4 badges
    eligibleBadges.sort((a, b) => b.score - a.score);
    const selectedBadges = eligibleBadges.slice(0, 4);

    if (selectedBadges.length > 0) {
      if (!countedTexts.has(item.text)) {
        countedTexts.add(item.text);
        saveCountedToStorage();
        postEl.setAttribute('data-jev-counted', 'true');

        let storageUpdates = {};
        selectedBadges.forEach(({ label, isCustom }) => {
          if (label === 'self-improvement / motivational') {
            motivationalCount++;
            storageUpdates.motivationalCount = motivationalCount;
          } else if (label === 'meme / humor / satire') {
            memeCount++;
            storageUpdates.memeCount = memeCount;
          } else if (label === 'deep dive / technical breakdown / industry insider') {
            deepDiveCount++;
            storageUpdates.deepDiveCount = deepDiveCount;
          } else if (label === 'wholesome / positive') {
            wholesomeCount++;
            storageUpdates.wholesomeCount = wholesomeCount;
          } else if (label === 'fearmongering / doom') {
            doomCount++;
            storageUpdates.doomCount = doomCount;
          } else if (label === 'fomo / hype') {
            fomoCount++;
            storageUpdates.fomoCount = fomoCount;
          } else if (label === 'other / casual discussion') {
            casualCount++;
            storageUpdates.casualCount = casualCount;
          } else if (isCustom) {
            customCount++;
            storageUpdates.customCount = customCount;
          }
        });

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && Object.keys(storageUpdates).length > 0) {
          chrome.storage.local.set(storageUpdates);
        }
        updatePill();
      }

      // Remove any lingering uncontained badge right before textEl
      if (textEl.previousElementSibling && textEl.previousElementSibling.classList.contains('x-jev-badge')) {
        textEl.previousElementSibling.remove();
      }

      // Scope container search strictly to textEl's previous sibling to prevent leaking into child comments
      let container = (textEl.previousElementSibling && textEl.previousElementSibling.classList.contains('x-jev-badge-container'))
        ? textEl.previousElementSibling
        : null;
      if (!container) {
        container = document.createElement('div');
        container.className = 'x-jev-badge-container';
        parentContainer.insertBefore(container, textEl);
      }
      container.innerHTML = '';

      selectedBadges.forEach(({ label, score, meta }) => {
        const badge = document.createElement('div');
        badge.className = 'x-jev-badge';
        badge.setAttribute('data-jev-badge-category', label);
        badge.style.backgroundColor = meta.bg;
        badge.style.borderColor = meta.border;
        badge.style.color = meta.color;
        badge.title = `${meta.desc} (Confidence: ${Math.round(score * 100)}%)`;

        const iconWrapper = document.createElement('span');
        iconWrapper.innerHTML = getBadgeIconSvg(label);
        const iconSvg = iconWrapper.firstElementChild;

        const cleanLabel = (meta.text || '').replace(/^[\p{Emoji}\p{Extended_Pictographic}\s]+/u, '');
        const textSpan = document.createElement('span');
        textSpan.textContent = cleanLabel;

        const confSpan = document.createElement('span');
        confSpan.className = 'x-jev-confidence';
        confSpan.textContent = `${Math.round(score * 100)}%`;

        if (iconSvg) badge.appendChild(iconSvg);
        badge.appendChild(textSpan);
        badge.appendChild(confSpan);
        container.appendChild(badge);
      });
    }
    const assignedLabels = selectedBadges.length > 0
      ? selectedBadges.map((b) => b.label)
      : [Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other / casual discussion'];
    checkAndApplyFocusCollapse(postEl, textEl, assignedLabels);
    postEl.setAttribute('data-jev-handled', 'true');
  }

  async function flushQueue() {
    if (queue.length === 0) return;

    const taxonomy = getActiveTaxonomy(config);
    if (!taxonomy.labels || taxonomy.labels.length <= 1) {
      const allBypassed = queue.splice(0);
      allBypassed.forEach((item) => {
        item.postEl.setAttribute('data-jev-bypassed', 'true');
      });
      return;
    }

    const currentBatch = queue.splice(0, 15);
    const uncachedIndices = [];
    const uncachedInputs = [];

    currentBatch.forEach((item, idx) => {
      if (textCache.has(item.text)) {
        renderClassification(item, textCache.get(item.text));
      } else {
        uncachedIndices.push(idx);
        uncachedInputs.push(item.text);
      }
    });

    if (uncachedInputs.length > 0) {
      const results = await callJevBatch(uncachedInputs);
      if (Array.isArray(results) && results.length > 0) {
        uncachedIndices.forEach((itemIdx, i) => {
          const item = currentBatch[itemIdx];
          const res = results[i];
          if (item && res) {
            textCache.set(item.text, res);
            renderClassification(item, res);
          } else if (item && item.postEl) {
            item.postEl.removeAttribute('data-jev-scanned');
            item.postEl.removeAttribute('data-jev-cmt-scanned');
          }
        });
        saveCacheToStorage();
      } else {
        // Clear data-jev-scanned and data-jev-cmt-scanned on failure so posts can be retried on next scroll
        uncachedIndices.forEach((idx) => {
          const item = currentBatch[idx];
          if (item && item.postEl) {
            item.postEl.removeAttribute('data-jev-scanned');
            item.postEl.removeAttribute('data-jev-cmt-scanned');
          }
        });
      }
    }

    if (queue.length > 0) {
      debounceTimer = setTimeout(flushQueue, 80);
    }
  }

  // --- FACEBOOK REELS & VIDEO POPUPS / TRAYS SCANNER ---
  function scanFacebookReels() {
    if (getPlatform() !== 'facebook') return;
    if (!config.monkModeEnabled && !config.blockReelsEnabled) return;

    // 1. Target Reels Pop-up / Modal Dialogs / Tahoe Video Player / Floating Miniplayer
    const dialogs = document.querySelectorAll(
      'div[role="dialog"], div[data-pagelet*="Tahoe"], div[data-pagelet*="FloatingVideo"]'
    );

    dialogs.forEach((dialog) => {
      const videos = dialog.querySelectorAll('video');
      if (videos.length === 0) return;

      const hasReelLink = dialog.querySelector('a[href*="/reel/"], a[href*="/reels/"], a[href*="/watch"]');
      const isReelUrl = window.location.pathname.includes('/reel') || window.location.pathname.includes('/watch');
      const isTahoeOrFloating = dialog.getAttribute('data-pagelet')?.includes('Tahoe') ||
                                dialog.getAttribute('data-pagelet')?.includes('FloatingVideo');

      if (hasReelLink || isReelUrl || isTahoeOrFloating || dialog.getAttribute('role') === 'dialog') {
        if (!dialog.hasAttribute('data-monk-reels-blocked')) {
          dialog.setAttribute('data-monk-reels-blocked', 'true');
          monkModeBlockedCount++;
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ monkModeBlockedCount });
          }
          updatePill();
        }

        // Pause & mute videos if not revealed
        if (!dialog.classList.contains('monk-revealed')) {
          videos.forEach((vid) => {
            try {
              vid.pause();
              vid.muted = true;
            } catch (e) {}
            if (!vid.dataset.monkHooked) {
              vid.dataset.monkHooked = 'true';
              vid.addEventListener('play', () => {
                if (!dialog.classList.contains('monk-revealed')) {
                  try {
                    vid.pause();
                    vid.muted = true;
                  } catch (e) {}
                }
              });
            }
          });
        }

        // Mount Overlay and Floating Re-blur Button
        if (!dialog.querySelector('.x-monk-reels-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'x-monk-reels-overlay';
          overlay.innerHTML = `
            <div class="x-monk-reels-card">
              <div class="x-monk-reels-icon">🧘</div>
              <div class="x-monk-reels-title">Monk Mode: Đã chặn Pop-up Reels Facebook</div>
              <div class="x-monk-reels-desc">Thước phim ngắn đã được tạm dừng và làm mờ để bảo vệ sự tập trung tuyệt đối.</div>
              <div class="x-monk-reels-actions">
                <button class="x-monk-btn-reveal">▶ Xem video</button>
                <button class="x-monk-btn-close">✕ Đóng pop-up</button>
              </div>
            </div>
          `;

          const floatingReblur = document.createElement('button');
          floatingReblur.className = 'x-monk-re-blur-floating';
          floatingReblur.innerHTML = `<span>🧘</span><span>Ẩn lại Reels</span>`;
          floatingReblur.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dialog.classList.remove('monk-revealed');
            videos.forEach((v) => {
              try {
                v.pause();
                v.muted = true;
              } catch (err) {}
            });
          };

          const revealBtn = overlay.querySelector('.x-monk-btn-reveal');
          revealBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dialog.classList.add('monk-revealed');
            videos.forEach((v) => {
              try {
                v.muted = false;
                v.play();
              } catch (err) {}
            });
          };

          const closeBtn = overlay.querySelector('.x-monk-btn-close');
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const fbClose = dialog.querySelector(
              'div[aria-label*="Đóng" i], div[aria-label*="Close" i], div[role="button"][tabindex="0"]'
            );
            if (fbClose) {
              fbClose.click();
            }
            const esc = new KeyboardEvent('keydown', {
              key: 'Escape',
              code: 'Escape',
              keyCode: 27,
              which: 27,
              bubbles: true,
              cancelable: true,
            });
            document.dispatchEvent(esc);
            window.dispatchEvent(esc);
            dialog.dispatchEvent(esc);
          };

          const videoWrapper = dialog.querySelector('div:has(> video)') || videos[0]?.parentElement || dialog;
          videoWrapper.style.position = 'relative';
          videoWrapper.appendChild(overlay);
          videoWrapper.appendChild(floatingReblur);
        }
      }
    });

    // 2. Target Reels Trays / Carousels in Feed ("Reels và video ngắn" / "Thước phim")
    const reelLinks = document.querySelectorAll('a[href*="/reel/"], a[href*="/reels/"]');
    reelLinks.forEach((link) => {
      if (link.closest('[data-monk-reels-blocked="true"]')) return;

      let tray = link.closest('div[data-pagelet*="Reels"]') ||
                 link.closest('div[aria-label*="Reels" i]') ||
                 link.closest('div[aria-label*="Thước phim" i]') ||
                 link.closest('div[data-pagelet^="FeedUnit_"]');

      if (!tray) {
        let curr = link.parentElement;
        let depth = 0;
        while (curr && curr !== document.body && depth < 6) {
          if (curr.querySelectorAll('a[href*="/reel/"]').length >= 2) {
            tray = curr;
            break;
          }
          curr = curr.parentElement;
          depth++;
        }
      }

      if (tray && !tray.hasAttribute('data-monk-tray-handled')) {
        tray.setAttribute('data-monk-tray-handled', 'true');
        tray.setAttribute('data-monk-tray-blocked', 'true');
        monkModeBlockedCount++;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ monkModeBlockedCount });
        }
        updatePill();

        tray.querySelectorAll('video').forEach((v) => {
          try { v.pause(); v.muted = true; } catch (e) {}
        });

        if (!tray.querySelector('.x-monk-tray-banner')) {
          const banner = document.createElement('div');
          banner.className = 'x-monk-tray-banner';
          banner.innerHTML = `
            <div class="x-monk-tray-content">
              <span>🧘</span>
              <div>
                <b>Monk Mode: Đã ẩn khu vực Thước phim (Reels) trên Bảng tin</b>
                <div style="font-size:11px;opacity:0.85;margin-top:1px;">Duy trì sự tập trung, chống nghiện lướt video ngắn và dopamine độc hại.</div>
              </div>
            </div>
            <button class="x-monk-tray-toggle">Xem Reels</button>
          `;

          const toggleBtn = banner.querySelector('.x-monk-tray-toggle');
          toggleBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isRevealed = tray.classList.toggle('monk-revealed');
            toggleBtn.textContent = isRevealed ? 'Ẩn lại' : 'Xem Reels';
          };

          tray.prepend(banner);
        }
      }
    });

    // 3. Standalone / Direct Reel URL (`facebook.com/reel/...`)
    if (window.location.pathname.startsWith('/reel/')) {
      const mainReel = document.querySelector('div[role="main"], div[data-pagelet="Tahoe"]');
      if (mainReel && !mainReel.hasAttribute('data-monk-reels-blocked')) {
        const vids = mainReel.querySelectorAll('video');
        if (vids.length > 0) {
          mainReel.setAttribute('data-monk-reels-blocked', 'true');
          vids.forEach((v) => {
            try { v.pause(); v.muted = true; } catch (e) {}
          });
          if (!mainReel.querySelector('.x-monk-reels-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'x-monk-reels-overlay';
            overlay.innerHTML = `
              <div class="x-monk-reels-card">
                <div class="x-monk-reels-icon">🧘</div>
                <div class="x-monk-reels-title">Monk Mode: Đã chặn Reels Facebook</div>
                <div class="x-monk-reels-desc">Thước phim ngắn đã được tạm dừng để bảo vệ sự tập trung tuyệt đối.</div>
                <div class="x-monk-reels-actions">
                  <button class="x-monk-btn-reveal">▶ Xem video</button>
                </div>
              </div>
            `;
            const revealBtn = overlay.querySelector('.x-monk-btn-reveal');
            revealBtn.onclick = (e) => {
              e.preventDefault();
              mainReel.classList.add('monk-revealed');
              vids.forEach((v) => { try { v.muted = false; v.play(); } catch (err) {} });
            };
            const wrapper = mainReel.querySelector('div:has(> video)') || vids[0]?.parentElement || mainReel;
            wrapper.style.position = 'relative';
            wrapper.appendChild(overlay);
          }
        }
      }
    }
  }

  // --- INSTAGRAM REELS SCANNER ---
  function scanInstagramReels() {
    if (getPlatform() !== 'instagram') return;
    if (!config.monkModeEnabled && !config.blockReelsEnabled) return;

    // 1. Direct Reels Page (`instagram.com/reels/` or `instagram.com/reel/...`)
    if (window.location.pathname.includes('/reel')) {
      const mainEl = document.querySelector('main[role="main"]') || document.body;
      const videos = mainEl.querySelectorAll('video');
      if (videos.length > 0) {
        mainEl.setAttribute('data-monk-reels-blocked', 'true');
        if (!mainEl.hasAttribute('data-monk-reels-counted')) {
          mainEl.setAttribute('data-monk-reels-counted', 'true');
          monkModeBlockedCount++;
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ monkModeBlockedCount });
          }
          updatePill();
        }

        if (!mainEl.classList.contains('monk-revealed')) {
          videos.forEach((vid) => {
            try { vid.pause(); vid.muted = true; } catch (e) {}
            if (!vid.dataset.monkHooked) {
              vid.dataset.monkHooked = 'true';
              vid.addEventListener('play', () => {
                if (!mainEl.classList.contains('monk-revealed')) {
                  try { vid.pause(); vid.muted = true; } catch (e) {}
                }
              });
            }
          });
        }

        if (!mainEl.querySelector('.x-monk-reels-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'x-monk-reels-overlay';
          overlay.innerHTML = `
            <div class="x-monk-reels-card">
              <div class="x-monk-reels-icon">🧘</div>
              <div class="x-monk-reels-title">Monk Mode: Đã chặn Instagram Reel</div>
              <div class="x-monk-reels-desc">Thước phim ngắn đã được tạm dừng và làm mờ để bảo vệ sự tập trung tuyệt đối.</div>
              <div class="x-monk-reels-actions">
                <button class="x-monk-btn-reveal">▶ Xem Reel</button>
                <button class="x-monk-btn-home">🏠 Về Trang chủ</button>
              </div>
            </div>
          `;
          const revealBtn = overlay.querySelector('.x-monk-btn-reveal');
          revealBtn.onclick = (e) => {
            e.preventDefault();
            mainEl.classList.add('monk-revealed');
            videos.forEach((v) => { try { v.muted = false; v.play(); } catch (err) {} });
          };
          const homeBtn = overlay.querySelector('.x-monk-btn-home');
          homeBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'https://www.instagram.com/';
          };
          const wrapper = mainEl.querySelector('div:has(> video)') || videos[0]?.parentElement || mainEl;
          wrapper.style.position = 'relative';
          wrapper.appendChild(overlay);
        }
      }
    }

    // 2. Modal Dialogs (`role="dialog"` containing reel link or video)
    const dialogs = document.querySelectorAll('div[role="dialog"]');
    dialogs.forEach((dialog) => {
      const hasReel = dialog.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
                      window.location.pathname.includes('/reel') ||
                      dialog.querySelector('video');
      const videos = dialog.querySelectorAll('video');
      if (hasReel && videos.length > 0) {
        if (!dialog.hasAttribute('data-monk-reels-blocked')) {
          dialog.setAttribute('data-monk-reels-blocked', 'true');
          monkModeBlockedCount++;
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ monkModeBlockedCount });
          }
          updatePill();
        }

        if (!dialog.classList.contains('monk-revealed')) {
          videos.forEach((vid) => {
            try { vid.pause(); vid.muted = true; } catch (e) {}
            if (!vid.dataset.monkHooked) {
              vid.dataset.monkHooked = 'true';
              vid.addEventListener('play', () => {
                if (!dialog.classList.contains('monk-revealed')) {
                  try { vid.pause(); vid.muted = true; } catch (e) {}
                }
              });
            }
          });
        }

        if (!dialog.querySelector('.x-monk-reels-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'x-monk-reels-overlay';
          overlay.innerHTML = `
            <div class="x-monk-reels-card">
              <div class="x-monk-reels-icon">🧘</div>
              <div class="x-monk-reels-title">Monk Mode: Đã chặn Pop-up Reel Instagram</div>
              <div class="x-monk-reels-desc">Thước phim ngắn đã được tạm dừng và làm mờ để bảo vệ sự tập trung.</div>
              <div class="x-monk-reels-actions">
                <button class="x-monk-btn-reveal">▶ Xem Reel</button>
                <button class="x-monk-btn-close">✕ Đóng pop-up</button>
              </div>
            </div>
          `;

          const floatingReblur = document.createElement('button');
          floatingReblur.className = 'x-monk-re-blur-floating';
          floatingReblur.innerHTML = `<span>🧘</span><span>Ẩn lại Reel</span>`;
          floatingReblur.onclick = (e) => {
            e.preventDefault();
            dialog.classList.remove('monk-revealed');
            videos.forEach((v) => { try { v.pause(); v.muted = true; } catch (err) {} });
          };

          const revealBtn = overlay.querySelector('.x-monk-btn-reveal');
          revealBtn.onclick = (e) => {
            e.preventDefault();
            dialog.classList.add('monk-revealed');
            videos.forEach((v) => { try { v.muted = false; v.play(); } catch (err) {} });
          };

          const closeBtn = overlay.querySelector('.x-monk-btn-close');
          closeBtn.onclick = (e) => {
            e.preventDefault();
            const closeSvg = dialog.querySelector('svg[aria-label*="Close" i], svg[aria-label*="Đóng" i]');
            if (closeSvg && closeSvg.closest('button, div[role="button"]')) {
              closeSvg.closest('button, div[role="button"]').click();
            } else {
              const esc = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true });
              document.dispatchEvent(esc);
              window.dispatchEvent(esc);
            }
          };

          const wrapper = dialog.querySelector('div:has(> video)') || videos[0]?.parentElement || dialog;
          wrapper.style.position = 'relative';
          wrapper.appendChild(overlay);
          wrapper.appendChild(floatingReblur);
        }
      }
    });

    // 3. In-Feed Reels / Clips (`article:has(video)` with reel link or clip)
    document.querySelectorAll('article:not([data-monk-reels-handled])').forEach((article) => {
      const hasReel = article.querySelector('a[href*="/reel/"], a[href*="/reels/"]');
      const videos = article.querySelectorAll('video');
      if (hasReel && videos.length > 0) {
        article.setAttribute('data-monk-reels-handled', 'true');
        article.setAttribute('data-monk-reels-blocked', 'true');
        monkModeBlockedCount++;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ monkModeBlockedCount });
        }
        updatePill();

        videos.forEach((vid) => {
          try { vid.pause(); vid.muted = true; } catch (e) {}
        });

        if (!article.querySelector('.x-monk-warning-box')) {
          const box = document.createElement('div');
          box.className = 'x-monk-warning-box';
          box.innerHTML = `
            <div class="x-monk-warning-text">
              <span>🧘</span>
              <div>
                <b>Monk Mode: Đã chặn Instagram Reel trên Bảng tin.</b>
                <div style="font-size:10.5px;opacity:0.85;margin-top:1px;">Bảo vệ sự tập trung, chống nghiện lướt clip ngắn.</div>
              </div>
            </div>
          `;
          const btn = document.createElement('button');
          btn.className = 'x-monk-reveal-btn';
          btn.textContent = 'Xem Reel';
          btn.onclick = (e) => {
            e.preventDefault();
            const isRev = article.classList.toggle('monk-revealed');
            btn.textContent = isRev ? 'Ẩn lại' : 'Xem Reel';
            videos.forEach((v) => { try { if (isRev) { v.muted = false; v.play(); } else { v.muted = true; v.pause(); } } catch (err) {} });
          };
          box.appendChild(btn);
          const firstVid = videos[0];
          if (firstVid && firstVid.parentElement) {
            firstVid.parentElement.insertBefore(box, firstVid);
          } else {
            article.prepend(box);
          }
        }
      }
    });

    // 4. Explore Grid Items (`a[href*="/reel/"]`)
    document.querySelectorAll('a[href*="/reel/"]:not([data-monk-explore-handled])').forEach((link) => {
      link.setAttribute('data-monk-explore-handled', 'true');
      const img = link.querySelector('img');
      const vid = link.querySelector('video');
      if (img) img.style.filter = 'blur(20px) grayscale(80%)';
      if (vid) {
        vid.style.filter = 'blur(20px) grayscale(80%)';
        try { vid.pause(); vid.muted = true; } catch (e) {}
      }
    });
  }

  // --- YOUTUBE SHORTS SCANNER ---
  function scanYouTubeShorts() {
    if (getPlatform() !== 'youtube') return;
    if (!config.monkModeEnabled && !config.blockReelsEnabled) return;

    // 1. Direct / Standalone YouTube Shorts (`youtube.com/shorts/...`)
    if (window.location.pathname.startsWith('/shorts')) {
      const shortsContainer = document.querySelector('ytd-shorts, #shorts-container, ytd-reel-video-renderer[is-active]');
      const videos = document.querySelectorAll('ytd-shorts video, #shorts-player video, ytd-reel-video-renderer video');

      if (videos.length > 0) {
        videos.forEach((vid) => {
          try { vid.pause(); vid.muted = true; } catch (e) {}
          if (!vid.dataset.monkHooked) {
            vid.dataset.monkHooked = 'true';
            vid.addEventListener('play', () => {
              const parent = vid.closest('ytd-reel-video-renderer') || shortsContainer;
              if (!parent || !parent.classList.contains('monk-revealed')) {
                try { vid.pause(); vid.muted = true; } catch (e) {}
              }
            });
          }
        });
      }

      if (shortsContainer && !shortsContainer.hasAttribute('data-monk-reels-blocked')) {
        shortsContainer.setAttribute('data-monk-reels-blocked', 'true');
        monkModeBlockedCount++;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ monkModeBlockedCount });
        }
        updatePill();

        if (!shortsContainer.querySelector('.x-monk-reels-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'x-monk-reels-overlay';
          overlay.style.position = 'fixed';
          overlay.innerHTML = `
            <div class="x-monk-reels-card">
              <div class="x-monk-reels-icon">🧘</div>
              <div class="x-monk-reels-title">Monk Mode: Đã chặn YouTube Shorts</div>
              <div class="x-monk-reels-desc">Video ngắn đã được tạm dừng và làm mờ để bảo vệ sự tập trung tuyệt đối.</div>
              <div class="x-monk-reels-actions">
                <button class="x-monk-btn-reveal">▶ Xem Shorts</button>
                <button class="x-monk-btn-home">🏠 Về Trang chủ</button>
              </div>
            </div>
          `;

          const revealBtn = overlay.querySelector('.x-monk-btn-reveal');
          revealBtn.onclick = (e) => {
            e.preventDefault();
            shortsContainer.classList.add('monk-revealed');
            videos.forEach((v) => { try { v.muted = false; v.play(); } catch (err) {} });
          };

          const homeBtn = overlay.querySelector('.x-monk-btn-home');
          homeBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'https://www.youtube.com/';
          };

          shortsContainer.appendChild(overlay);
        }
      }
    }

    // 2. Feed Shorts Shelves (`ytd-rich-shelf-renderer[is-shorts]`, `ytd-reel-shelf-renderer`)
    const shelves = document.querySelectorAll(
      'ytd-rich-shelf-renderer[is-shorts]:not([data-monk-tray-handled]), ytd-reel-shelf-renderer:not([data-monk-tray-handled]), ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]):not([data-monk-tray-handled])'
    );

    shelves.forEach((shelf) => {
      shelf.setAttribute('data-monk-tray-handled', 'true');
      shelf.setAttribute('data-monk-tray-blocked', 'true');
      monkModeBlockedCount++;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ monkModeBlockedCount });
      }
      updatePill();

      shelf.querySelectorAll('video').forEach((v) => {
        try { v.pause(); v.muted = true; } catch (e) {}
      });

      if (!shelf.querySelector('.x-monk-tray-banner')) {
        const banner = document.createElement('div');
        banner.className = 'x-monk-tray-banner';
        banner.innerHTML = `
          <div class="x-monk-tray-content">
            <span>🧘</span>
            <div>
              <b>Monk Mode: Đã ẩn khu vực YouTube Shorts trên Bảng tin</b>
              <div style="font-size:11px;opacity:0.85;margin-top:1px;">Duy trì sự tập trung, chống nghiện lướt video ngắn.</div>
            </div>
          </div>
          <button class="x-monk-tray-toggle">Xem Shorts</button>
        `;

        const toggleBtn = banner.querySelector('.x-monk-tray-toggle');
        toggleBtn.onclick = (e) => {
          e.preventDefault();
          const isRevealed = shelf.classList.toggle('monk-revealed');
          toggleBtn.textContent = isRevealed ? 'Ẩn lại' : 'Xem Shorts';
        };

        shelf.prepend(banner);
      }
    });
  }

  // --- X (Twitter) Viral Scanner & Hook Vault Engine ---
  function parseMetricNumber(str) {
    if (!str) return 0;
    str = str.trim();
    const m = str.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?/i);
    if (!m) return 0;
    let numStr = m[1];
    const suffix = (m[2] || '').toLowerCase();

    if (numStr.includes(',') && numStr.includes('.')) {
      if (numStr.indexOf(',') < numStr.indexOf('.')) {
        numStr = numStr.replace(/,/g, '');
      } else {
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      }
    } else if (numStr.includes(',')) {
      if (suffix || /,\d{1,2}$/.test(numStr)) {
        numStr = numStr.replace(',', '.');
      } else {
        numStr = numStr.replace(/,/g, '');
      }
    } else if (numStr.includes('.')) {
      if (!suffix && /\.\d{3}$/.test(numStr)) {
        numStr = numStr.replace(/\./g, '');
      }
    }

    let val = parseFloat(numStr) || 0;
    if (suffix === 'k' || suffix === 'n') val *= 1000;
    else if (suffix === 'm' || suffix === 'tr') val *= 1000000;
    else if (suffix === 'b' || suffix === 'tỷ') val *= 1000000000;
    return Math.round(val);
  }

  function extractMetricFromElement(el) {
    if (!el) return 0;
    const aria = el.getAttribute('aria-label') || '';
    if (aria) {
      const m = aria.match(/([\d\.,]+\s*[kmbntr]?)\s*(likes?|views?|retweets?|reposts?|bookmarks?|replies?|lượt|câu trả lời)/i);
      if (m) return parseMetricNumber(m[1]);
      const anyNum = aria.match(/([\d\.,]+\s*[kmbntr]?)/i);
      if (anyNum) return parseMetricNumber(anyNum[1]);
    }
    const text = el.innerText || '';
    return parseMetricNumber(text);
  }

  function extractTweetMetrics(postEl) {
    const group = postEl.querySelector('div[role="group"]');
    if (!group) return { views: 0, likes: 0, retweets: 0, bookmarks: 0, replies: 0 };

    const replyEl = group.querySelector('button[data-testid="reply"], [data-testid="reply"]');
    const retweetEl = group.querySelector('button[data-testid="retweet"], button[data-testid="unretweet"]');
    const likeEl = group.querySelector('button[data-testid="like"], button[data-testid="unlike"]');
    const bookmarkEl = group.querySelector('button[data-testid="bookmark"], button[data-testid="removeBookmark"]');
    const analyticsEl = group.querySelector('a[href*="/analytics"], [data-testid*="analytics"], a[aria-label*="views"], a[aria-label*="lượt xem"]');

    return {
      replies: extractMetricFromElement(replyEl),
      retweets: extractMetricFromElement(retweetEl),
      likes: extractMetricFromElement(likeEl),
      bookmarks: extractMetricFromElement(bookmarkEl),
      views: extractMetricFromElement(analyticsEl)
    };
  }

  function extractTweetHook(fullText) {
    if (!fullText) return '';
    const trimmed = fullText.trim();
    const parts = trimmed.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0 && parts.length > 1) {
      if (parts[0].length < 25 && parts.length > 1) {
        return `${parts[0]}\n${parts[1]}`;
      }
      return parts[0];
    }
    const sentenceMatch = trimmed.match(/^([^.!?\n]+[.!?])(?:\s|$)/);
    if (sentenceMatch && sentenceMatch[1].length >= 20) {
      return sentenceMatch[1].trim();
    }
    return parts.length === 1 ? parts[0] : trimmed.slice(0, 180);
  }

  function classifyHookFormula(text) {
    if (!text) return 'other';
    const lower = text.toLowerCase();
    if (/\b(unpopular opinion|is dead|isn't real|stop doing|stop using|don't do|myth|lie|wrong about|đã chết|đừng làm|sai lầm|ảo tưởng|sự thật phũ phàng|ngược lại)\b/i.test(lower)) {
      return 'contrarian';
    }
    if (/\b(\d+\s*(tools|websites|prompts|tips|steps|books|rules|công cụ|bước|mẹo|nguyên tắc|cuốn sách)|cheatsheet|cẩm nang|framework|khung sườn|bookmark|tổng hợp|lưu lại)\b/i.test(lower)) {
      return 'cheatsheet';
    }
    if (/\b(years ago|in 20\d\d|today i|how i went from|started with|năm ngoái|cách đây|tôi từng|từ số 0|hành trình|bước ngoặt)\b/i.test(lower)) {
      return 'story';
    }
    if (/\b(i analyzed|studied|examined|billionaire|millionaire|ceo|mrbeast|musk|jobs|phân tích|nghiên cứu|chuyên gia|doanh thu|triệu đô|hàng ngàn)\b/i.test(lower)) {
      return 'proof';
    }
    if (/\?$/m.test(text.trim()) || /^(why|how|what if|want to|have you ever|tại sao|làm sao|liệu bạn|có bao giờ)\b/i.test(lower)) {
      return 'challenge';
    }
    if (/\b(secret|nobody talks about|hardly anyone|most people don't|hidden|the reason why|bí mật|ít ai biết|không ai nói|lý do tại sao|sự thật là)\b/i.test(lower)) {
      return 'curiosity';
    }
    return 'other';
  }

  function showShieldToast(msg, withVaultBtn = false) {
    const existing = document.querySelector('.x-shield-page-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'x-shield-page-toast';
    toast.innerHTML = `
      ${ICONS.zap}
      <span>${msg}</span>
      ${withVaultBtn ? `<button type="button" class="x-shield-toast-vault-btn" id="toastOpenVaultBtn">Mở Vault ↗</button>` : ''}
    `;
    document.body.appendChild(toast);

    if (withVaultBtn) {
      const openBtn = toast.querySelector('#toastOpenVaultBtn');
      if (openBtn) {
        openBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        openBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        openBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openVaultDashboard();
        });
      }
    }

    const duration = withVaultBtn ? 4200 : 2500;
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function formatMetricNumber(num) {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return Number(num).toLocaleString('vi-VN');
  }

  function getPostAgeHours(postEl) {
    const timeEl = postEl.querySelector('time');
    if (timeEl) {
      const datetime = timeEl.getAttribute('datetime');
      if (datetime) {
        const diffMs = Date.now() - new Date(datetime).getTime();
        if (!isNaN(diffMs) && diffMs >= 0) {
          return diffMs / (1000 * 60 * 60);
        }
      }
      const text = (timeEl.innerText || '').trim().toLowerCase();
      if (text.endsWith('m') || text.includes('phút')) return (parseInt(text, 10) || 1) / 60;
      if (text.endsWith('h') || text.includes('giờ')) return parseInt(text, 10) || 1;
      if (text.endsWith('d') || text.includes('ngày')) return (parseInt(text, 10) || 1) * 24;
    }
    return 6;
  }

  function evaluateOutlierStatus(metrics, authorHandle, postEl, platform = 'x') {
    const ageHours = getPostAgeHours(postEl);
    const maxAge = config.outlierMaxAgeHours || 48;
    const isRecent = ageHours <= maxAge;
    const cleanHandle = (authorHandle || '').toLowerCase().replace('@', '');
    const followers = authorFollowerCache.get(cleanHandle) || 0;

    if (!isRecent) {
      return { isOutlier: false, multiplier: 0, followers, reach: platform === 'x' ? metrics.views : metrics.likes, ageHours, reason: 'too_old' };
    }

    if (platform === 'x') {
      const views = metrics.views || 0;
      const minViews = config.outlierMinViews || 3000;
      const minMultiplier = config.outlierMinMultiplier || 3.0;

      if (followers > 0) {
        const multiplier = views / followers;
        const isOutlier = multiplier >= minMultiplier && views >= minViews;
        return { isOutlier, multiplier, followers, reach: views, ageHours };
      }

      const isOutlierFallback = views >= 20000 && metrics.likes >= 800;
      return { isOutlier: isOutlierFallback, multiplier: 0, followers: 0, reach: views, ageHours, isEstimated: true };
    } else {
      // Threads
      const likes = metrics.likes || 0;
      const views = metrics.views || 0;
      const minMultiplier = config.outlierThreadsMinMultiplier || 2.0;

      if (views > 0) {
        const minViews = config.outlierThreadsMinViews || 2000;
        if (followers > 0) {
          const multiplier = views / followers;
          const isOutlier = multiplier >= minMultiplier && views >= minViews;
          return { isOutlier, multiplier, followers, reach: views, ageHours };
        }
        const isOutlierFallback = views >= 10000;
        return { isOutlier: isOutlierFallback, multiplier: 0, followers: 0, reach: views, ageHours, isEstimated: true };
      }

      const minLikes = config.outlierThreadsMinLikes || 150;
      if (followers > 0) {
        const multiplier = (likes * 15) / followers;
        const isOutlier = multiplier >= minMultiplier && likes >= minLikes;
        return { isOutlier, multiplier, followers, reach: likes, ageHours };
      }

      const isOutlierFallback = likes >= 250;
      return { isOutlier: isOutlierFallback, multiplier: 0, followers: 0, reach: likes, ageHours, isEstimated: true };
    }
  }

  function extractXTweetAuthor(post) {
    const userNameEl = post.querySelector('div[data-testid="User-Name"]');
    let authorName = '';
    let authorHandle = '';
    if (userNameEl) {
      const nameSpan = userNameEl.querySelector('span');
      if (nameSpan) authorName = nameSpan.innerText.trim();
      const handleLink = userNameEl.querySelector('a[href^="/"]');
      if (handleLink) {
        const match = handleLink.innerText.match(/@\w+/);
        authorHandle = match ? match[0] : (handleLink.getAttribute('href') || '').replace('/', '@');
      }
    }
    const avatarImg = post.querySelector('div[data-testid="Tweet-User-Avatar"] img, img[src*="profile_images"]');
    const authorAvatar = avatarImg ? avatarImg.src : '';
    return { authorName, authorHandle, authorAvatar };
  }

  const X_REPOST_REGEX = /(?:reposted|retweeted|đã đăng lại|đã retweet|reposteó|republicou|reposté|repostet|リポスト|リツイート|转推|轉推|재게시|retwit|ripubblic)/i;

  function isXRepost(post) {
    if (!post) return false;

    // 1. Check data-testid="socialContext"
    const socialContext = post.querySelector('div[data-testid="socialContext"]');
    if (socialContext) {
      const text = (socialContext.innerText || '').trim();
      if (X_REPOST_REGEX.test(text)) {
        return true;
      }
    }

    // 2. Check tweetDataCache from interceptor if permalink exists
    const permalink = post.querySelector('a[href*="/status/"]');
    if (permalink && permalink.href) {
      const idMatch = permalink.href.match(/status\/(\d+)/);
      if (idMatch && idMatch[1]) {
        const cached = tweetDataCache.get(idMatch[1]);
        if (cached && (cached.isRetweet || cached.isRepost)) {
          return true;
        }
      }
    }

    return false;
  }

  function processXTweetHookAndViral(post, fullText) {
    if (!config.viralDetectionEnabled && !config.outlierDetectionEnabled) return;
    if (window.location.pathname.includes('/notifications')) return;

    // Reposted tweets must never be tagged or highlighted as viral/outlier
    if (isXRepost(post)) {
      post.classList.remove('x-shield-outlier-post', 'x-shield-viral-post');
      const oldBadge = post.querySelector('.x-shield-outlier-badge, .x-shield-viral-badge');
      if (oldBadge) oldBadge.remove();
      const oldBtn = post.querySelector('.x-shield-hook-btn');
      if (oldBtn) oldBtn.remove();
      return;
    }

    const group = post.querySelector('div[role="group"]');
    if (!group) return;

    const metrics = extractTweetMetrics(post);
    const author = extractXTweetAuthor(post);
    const outlier = evaluateOutlierStatus(metrics, author.authorHandle, post, 'x');

    if (outlier.isOutlier) {
      post.classList.add('x-shield-outlier-post');
      let badge = post.querySelector('.x-shield-outlier-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'x-shield-outlier-badge';
        const textEl = post.querySelector('div[data-testid="tweetText"]');
        if (textEl && textEl.parentElement) {
          textEl.parentElement.insertBefore(badge, textEl);
        }
      }
      const multStr = outlier.multiplier > 0 ? `${outlier.multiplier.toFixed(1)}x Outlier` : 'Breakout Outlier';
      const folsStr = outlier.followers > 0 ? `${formatMetricNumber(outlier.followers)} fols → ` : '';
      const reachStr = `${formatMetricNumber(metrics.views || metrics.likes)} views`;
      const timeStr = outlier.ageHours < 1 ? '<1h trước' : `${Math.round(outlier.ageHours)}h trước`;
      badge.innerHTML = `<span class="outlier-fire">🔥</span> <span class="outlier-mult">${multStr}</span> <span class="outlier-sep">•</span> <span class="outlier-stats">${folsStr}${reachStr}</span> <span class="outlier-sep">•</span> <span class="outlier-time">${timeStr}</span>`;
    } else {
      post.classList.remove('x-shield-outlier-post', 'x-shield-viral-post');
      const oldBadge = post.querySelector('.x-shield-outlier-badge, .x-shield-viral-badge');
      if (oldBadge) oldBadge.remove();
    }

    if (group.querySelector('.x-shield-hook-btn')) return;

    // Create 1-click Save Hook button
    const hookBtn = document.createElement('button');
    hookBtn.type = 'button';
    hookBtn.className = 'x-shield-hook-btn';
    hookBtn.setAttribute('title', 'Lưu Hook Outlier này vào Vault để học hỏi & phân tích');
    hookBtn.innerHTML = `${ICONS.zap} <span>Save Hook</span>`;

    hookBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    hookBtn.addEventListener('mousedown', (e) => e.stopPropagation());

    hookBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (hookBtn.classList.contains('is-saved')) return;

      const hookText = extractTweetHook(fullText);
      const formula = classifyHookFormula(hookText);

      // URL & ID
      let tweetUrl = window.location.href;
      const permalink = post.querySelector('a[href*="/status/"]');
      if (permalink && permalink.href) {
        tweetUrl = permalink.href;
      }
      const idMatch = tweetUrl.match(/status\/(\d+)/);
      const tweetId = idMatch ? idMatch[1] : 'tweet-' + Date.now();

      const itemToSave = {
        id: tweetId,
        platform: 'x',
        authorName: author.authorName || 'X Creator',
        authorHandle: author.authorHandle || '',
        authorAvatar: author.authorAvatar,
        authorFollowers: outlier.followers || 0,
        outlierMultiplier: outlier.multiplier || 0,
        postAgeHours: Math.round(outlier.ageHours || 0),
        hook: hookText,
        fullText: fullText,
        metrics: metrics,
        formula: formula,
        url: tweetUrl,
        savedAt: new Date().toISOString()
      };

      // Instant UI Feedback
      hookBtn.classList.remove('is-loading');
      hookBtn.classList.add('is-saved');
      hookBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg> <span>Saved!</span>`;
      showShieldToast(`✓ Đã lưu Hook Outlier của ${author.authorHandle || author.authorName || 'bài viết'} vào Vault!`, true);

      function saveToLocalStorageFallback() {
        try {
          const raw = localStorage.getItem('x_hook_vault_v1');
          let vault = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(vault)) vault = [];
          vault = vault.filter((item) => item.id !== tweetId);
          vault.unshift(itemToSave);
          localStorage.setItem('x_hook_vault_v1', JSON.stringify(vault));
        } catch (err) {}
      }

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          chrome.storage.local.get(['x_hook_vault_v1'], (res) => {
            if (chrome.runtime?.lastError) {
              saveToLocalStorageFallback();
              return;
            }
            let vault = Array.isArray(res?.x_hook_vault_v1) ? res.x_hook_vault_v1 : [];
            vault = vault.filter((item) => item.id !== tweetId);
            vault.unshift(itemToSave);
            chrome.storage.local.set({ x_hook_vault_v1: vault }, () => {
              try {
                localStorage.setItem('x_hook_vault_v1', JSON.stringify(vault));
              } catch (e) {}
            });
          });
        } catch (err) {
          saveToLocalStorageFallback();
        }
      } else {
        saveToLocalStorageFallback();
      }
    });

    group.appendChild(hookBtn);
  }

  // --- Threads Hook Vault & Jev AI Engine ---
  function extractThreadsMetrics(postEl) {
    let likes = 0;
    let replies = 0;
    let reposts = 0;
    let views = 0;

    if (isHeaderOrNavigation(postEl)) {
      return { views: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0 };
    }

    // 1. Check if post permalink has ID and look up in tweetDataCache (from interceptor)
    const postLink = postEl.querySelector('a[href*="/post/"], a[href*="/t/"]');
    if (postLink && postLink.href) {
      const idMatch = postLink.href.match(/(?:post|t)\/([a-zA-Z0-9_\-]+)/);
      if (idMatch && idMatch[1]) {
        const cached = tweetDataCache.get(idMatch[1]);
        if (cached) {
          likes = Math.max(likes, cached.likes || 0);
          replies = Math.max(replies, cached.replies || 0);
          reposts = Math.max(reposts, cached.retweets || 0);
          views = Math.max(views, cached.viewsCount || 0);
        }
      }
    }

    // 2. Scan accessibility aria-labels
    const ariaEls = postEl.querySelectorAll('[aria-label]');
    ariaEls.forEach((el) => {
      const label = el.getAttribute('aria-label') || '';
      
      const likeMatch = label.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:likes?|lượt thích|người thích)/i) ||
                         label.match(/(?:likes?|lượt thích)[:\s]*([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?/i) ||
                         label.match(/\(([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\)/);
      if (likeMatch && (label.toLowerCase().includes('like') || label.toLowerCase().includes('thích'))) {
        likes = Math.max(likes, parseMetricNumber(`${likeMatch[1]} ${likeMatch[2] || ''}`));
      }

      const replyMatch = label.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:replies?|câu trả lời|bình luận)/i) ||
                          label.match(/(?:replies?|câu trả lời|bình luận)[:\s]*([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?/i);
      if (replyMatch) {
        replies = Math.max(replies, parseMetricNumber(`${replyMatch[1]} ${replyMatch[2] || ''}`));
      }

      const repostMatch = label.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:reposts?|lượt đăng lại)/i) ||
                           label.match(/(?:reposts?|lượt đăng lại)[:\s]*([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?/i);
      if (repostMatch) {
        reposts = Math.max(reposts, parseMetricNumber(`${repostMatch[1]} ${repostMatch[2] || ''}`));
      }

      const viewMatch = label.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:views?|lượt xem)/i) ||
                         label.match(/(?:views?|lượt xem)[:\s]*([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?/i);
      if (viewMatch) {
        views = Math.max(views, parseMetricNumber(`${viewMatch[1]} ${viewMatch[2] || ''}`));
      }
    });

    // 3. Scan visible candidate text elements
    const candidates = postEl.querySelectorAll('span[dir="auto"], a[href*="/post/"], a[href*="/t/"], div[dir="auto"]');
    candidates.forEach((el) => {
      const t = (el.innerText || '').trim();
      if (!t) return;

      const likeMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:likes?|lượt thích)/i);
      if (likeMatch) {
        likes = Math.max(likes, parseMetricNumber(`${likeMatch[1]} ${likeMatch[2] || ''}`));
      }
      const replyMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:replies?|câu trả lời|bình luận)/i);
      if (replyMatch) {
        replies = Math.max(replies, parseMetricNumber(`${replyMatch[1]} ${replyMatch[2] || ''}`));
      }
      const repostMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:reposts?|lượt đăng lại)/i);
      if (repostMatch) {
        reposts = Math.max(reposts, parseMetricNumber(`${repostMatch[1]} ${repostMatch[2] || ''}`));
      }
      const viewMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:views?|lượt xem)/i);
      if (viewMatch) {
        views = Math.max(views, parseMetricNumber(`${viewMatch[1]} ${viewMatch[2] || ''}`));
      }

      // Bare numbers next to buttons
      if (/^[\d\.,]+\s*(k|m|b|n|tr|tỷ)?$/i.test(t)) {
        const prevSvg = el.previousElementSibling?.tagName === 'svg' || el.parentElement?.querySelector('svg');
        if (prevSvg) {
          const val = parseMetricNumber(t);
          if (val > 0) likes = Math.max(likes, val);
        }
      }
    });

    return { views, likes, replies, reposts, bookmarks: 0 };
  }

  const THREADS_REPOST_REGEX = /(?:reposted|reshared|đã đăng lại|đã chia sẻ lại|reposteó|ha reposteado|republicou|a republié|hat repostet|再投稿|リポスト|转帖|轉發|재게시|перепостил)/i;

  function isThreadsRepost(postEl, contentEl) {
    if (!postEl) return false;

    // 1. Check tweetDataCache from interceptor if permalink exists
    const postLink = postEl.querySelector('a[href*="/post/"], a[href*="/t/"]');
    if (postLink && postLink.href) {
      const idMatch = postLink.href.match(/(?:post|t)\/([a-zA-Z0-9_\-]+)/);
      if (idMatch && idMatch[1]) {
        const cached = tweetDataCache.get(idMatch[1]);
        if (cached && (cached.isRepost || cached.isRetweet)) {
          return true;
        }
      }
    }

    // 2. Check author links near top of postEl (reposter banner)
    const authorLinks = postEl.querySelectorAll('a[href*="/@"]');
    for (const link of authorLinks) {
      if (contentEl && contentEl.contains(link)) continue;
      let curr = link.parentElement;
      for (let i = 0; i < 3; i++) {
        if (!curr || curr === postEl) break;
        const text = (curr.innerText || '').trim();
        if (text.length > 0 && text.length < 120 && THREADS_REPOST_REGEX.test(text)) {
          if (!contentEl || !contentEl.contains(curr)) {
            return true;
          }
        }
        curr = curr.parentElement;
      }
    }

    // 3. Check for any top header row with repost text outside contentEl
    const topElements = postEl.querySelectorAll('div[dir="auto"], span[dir="auto"], header');
    for (const el of topElements) {
      if (contentEl && contentEl.contains(el)) continue;
      const t = (el.innerText || '').trim();
      if (t.length > 0 && t.length < 80 && THREADS_REPOST_REGEX.test(t)) {
        if (!contentEl || (el.compareDocumentPosition && (el.compareDocumentPosition(contentEl) & Node.DOCUMENT_POSITION_FOLLOWING))) {
          return true;
        }
      }
    }

    // 4. Check for reshare / repost SVG icons in upper header outside action bar
    const actionBar = findThreadsActionBar(postEl);
    const allSvgs = postEl.querySelectorAll('svg');
    for (const svg of allSvgs) {
      if (actionBar && actionBar.contains(svg)) continue;
      if (contentEl && contentEl.contains(svg)) continue;
      const ariaLabel = (svg.getAttribute('aria-label') || svg.parentElement?.getAttribute('aria-label') || '').toLowerCase();
      if (THREADS_REPOST_REGEX.test(ariaLabel)) {
        return true;
      }
    }

    return false;
  }

  function extractThreadsAuthor(postEl) {
    let authorName = '';
    let authorHandle = '';
    let authorAvatar = '';
    let permalink = window.location.href;

    const allLinks = Array.from(postEl.querySelectorAll('a[href*="/@"]'));
    let handleLink = allLinks[0];
    if (allLinks.length > 1) {
      const firstParentText = (allLinks[0].parentElement?.innerText || '').trim();
      if (THREADS_REPOST_REGEX.test(firstParentText)) {
        handleLink = allLinks[1];
      }
    }

    if (handleLink) {
      const raw = handleLink.getAttribute('href') || '';
      const match = raw.match(/@([a-zA-Z0-9_\.]+)/);
      if (match) {
        authorHandle = '@' + match[1];
      } else {
        authorHandle = raw.replace('/', '');
      }
      const nameSpan = handleLink.querySelector('span') || postEl.querySelector('span[dir="auto"]');
      authorName = nameSpan ? nameSpan.innerText.trim() : authorHandle;
    }

    const avatarImg = postEl.querySelector('img[alt*="ảnh đại diện"], img[alt*="profile"], img[src*="cdninstagram.com"], img[src*="threads.net"]');
    if (avatarImg) {
      authorAvatar = avatarImg.src || '';
    }

    const postLink = postEl.querySelector('a[href*="/post/"], a[href*="/t/"]');
    if (postLink && postLink.href) {
      permalink = postLink.href;
    }

    return { authorName: authorName || 'Threads Creator', authorHandle, authorAvatar, permalink };
  }

  function findThreadsActionBar(postEl) {
    if (!postEl) return null;

    // Filter candidate interaction buttons, strictly rejecting header elements
    const actionButtons = Array.from(postEl.querySelectorAll('div[role="button"], button')).filter((btn) => {
      if (btn.closest('video') || btn.querySelector('video')) return false;
      if (btn.closest('a[href*="/@"]') || btn.querySelector('a[href*="/@"]')) return false;
      if (btn.closest('time') || btn.querySelector('time')) return false;

      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (label.includes('more') || label.includes('thêm') || label.includes('menu') || label.includes('tùy chọn')) return false;
      if (label.includes('follow') || label.includes('theo dõi')) return false;

      return !!btn.querySelector('svg');
    });

    // Strategy 1: Find parent from explicit action buttons (like, reply, repost, share)
    for (const btn of actionButtons) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      const isAction = label.includes('like') || label.includes('thích') ||
                       label.includes('reply') || label.includes('trả lời') ||
                       label.includes('repost') || label.includes('đăng lại') ||
                       label.includes('share') || label.includes('chia sẻ');
      if (isAction) {
        let curr = btn.parentElement;
        for (let depth = 0; depth < 4; depth++) {
          if (!curr || curr === postEl || curr === document.body) break;
          if (!curr.querySelector('a[href*="/@"]') && !curr.querySelector('time')) {
            const svgs = curr.querySelectorAll('svg');
            if (svgs.length >= 2 && svgs.length <= 8) {
              return curr;
            }
          }
          curr = curr.parentElement;
        }
      }
    }

    // Strategy 2: Flex row with 3-6 SVGs and minimal text, strictly outside header
    for (const btn of actionButtons) {
      let curr = btn.parentElement;
      for (let depth = 0; depth < 4; depth++) {
        if (!curr || curr === postEl || curr === document.body) break;
        if (!curr.querySelector('a[href*="/@"]') && !curr.querySelector('time')) {
          const svgs = curr.querySelectorAll('svg');
          const textLen = (curr.innerText || '').trim().length;
          if (svgs.length >= 3 && svgs.length <= 8 && textLen < 80) {
            return curr;
          }
        }
        curr = curr.parentElement;
      }
    }

    return null;
  }

  function processThreadsHookAndViral(post, fullText, contentEl) {
    if (!config.viralDetectionEnabled && !config.outlierDetectionEnabled) return;
    if (isHeaderOrNavigation(post)) return;
    if (window.location.pathname.includes('/activity')) return;

    // Reposted threads must never be tagged or highlighted as viral/outlier
    if (isThreadsRepost(post, contentEl)) {
      post.classList.remove('x-shield-outlier-post', 'is-threads', 'x-shield-threads-viral');
      const oldBadge = post.querySelector('.x-shield-outlier-badge, .x-shield-viral-badge');
      if (oldBadge) oldBadge.remove();
      const oldBtn = post.querySelector('.x-shield-threads-hook-btn');
      if (oldBtn) oldBtn.remove();
      return;
    }

    const authorInfo = extractThreadsAuthor(post);
    if (!authorInfo.authorHandle) return;

    const metrics = extractThreadsMetrics(post);
    const outlier = evaluateOutlierStatus(metrics, authorInfo.authorHandle, post, 'threads');
    const actionBar = findThreadsActionBar(post);

    const isViral = !!(config.viralDetectionEnabled && (metrics.likes >= 500 || metrics.replies >= 50));

    if (outlier.isOutlier || isViral) {
      post.classList.add('x-shield-outlier-post', 'is-threads');
      if (isViral && !outlier.isOutlier) {
        post.classList.add('x-shield-threads-viral');
      }
      let badge = post.querySelector('.x-shield-outlier-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'x-shield-outlier-badge is-threads';

        // Safe insertion avoiding author handle
        const jevContainer = post.querySelector('.x-jev-badge-container');
        if (jevContainer) {
          jevContainer.appendChild(badge);
        } else if (contentEl && contentEl.parentElement) {
          contentEl.parentElement.insertBefore(badge, contentEl);
        } else if (actionBar && actionBar.parentElement) {
          actionBar.parentElement.insertBefore(badge, actionBar);
        }
      }
      const multStr = outlier.multiplier > 0 ? `${outlier.multiplier.toFixed(1)}x Outlier` : (isViral && !outlier.isOutlier ? 'Viral Post' : 'Breakout Outlier');
      const folsStr = outlier.followers > 0 ? `${formatMetricNumber(outlier.followers)} fols → ` : '';
      const reachStr = `${formatMetricNumber(metrics.likes)} likes`;
      const timeStr = outlier.ageHours < 1 ? '<1h trước' : `${Math.round(outlier.ageHours)}h trước`;
      badge.innerHTML = `<span class="outlier-fire">🔥</span> <span class="outlier-mult">${multStr}</span> <span class="outlier-sep">•</span> <span class="outlier-stats">${folsStr}${reachStr}</span> <span class="outlier-sep">•</span> <span class="outlier-time">${timeStr}</span>`;
    } else {
      post.classList.remove('x-shield-outlier-post', 'is-threads', 'x-shield-threads-viral');
      const oldBadge = post.querySelector('.x-shield-outlier-badge, .x-shield-viral-badge');
      if (oldBadge) oldBadge.remove();
    }

    if (post.querySelector('.x-shield-threads-hook-btn')) return;

    // Do NOT inject hook button until action bar is rendered
    if (!actionBar) return;

    const hookBtn = document.createElement('button');
    hookBtn.type = 'button';
    hookBtn.className = 'x-shield-threads-hook-btn';
    hookBtn.setAttribute('title', 'Lưu Hook Outlier này vào Vault để học hỏi & phân tích');
    hookBtn.innerHTML = `${ICONS.zap}<span>Save Hook</span>`;

    hookBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    hookBtn.addEventListener('mousedown', (e) => e.stopPropagation());

    hookBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (hookBtn.classList.contains('is-saved')) return;

      const hookText = extractTweetHook(fullText);
      const formula = classifyHookFormula(hookText);

      const idMatch = authorInfo.permalink.match(/(?:post|t)\/([a-zA-Z0-9_\-]+)/);
      const threadId = idMatch ? 'threads-' + idMatch[1] : 'threads-' + Date.now();

      const itemToSave = {
        id: threadId,
        platform: 'threads',
        authorName: authorInfo.authorName,
        authorHandle: authorInfo.authorHandle,
        authorAvatar: authorInfo.authorAvatar,
        authorFollowers: outlier.followers || 0,
        outlierMultiplier: outlier.multiplier || 0,
        postAgeHours: Math.round(outlier.ageHours || 0),
        hook: hookText,
        fullText: fullText,
        metrics: metrics,
        formula: formula,
        url: authorInfo.permalink,
        savedAt: new Date().toISOString(),
      };

      // Instant UI Feedback
      hookBtn.classList.remove('is-loading');
      hookBtn.classList.add('is-saved');
      hookBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg> <span>Saved!</span>`;
      showShieldToast(`✓ Đã lưu Hook Outlier của ${authorInfo.authorHandle || authorInfo.authorName} vào Vault!`, true);

      function saveToLocalStorageFallback() {
        try {
          const raw = localStorage.getItem('x_hook_vault_v1');
          let vault = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(vault)) vault = [];
          vault = vault.filter((item) => item.id !== threadId);
          vault.unshift(itemToSave);
          localStorage.setItem('x_hook_vault_v1', JSON.stringify(vault));
        } catch (err) {}
      }

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          chrome.storage.local.get(['x_hook_vault_v1'], (vaultRes) => {
            if (chrome.runtime?.lastError) {
              saveToLocalStorageFallback();
              return;
            }
            let vault = Array.isArray(vaultRes?.x_hook_vault_v1) ? vaultRes.x_hook_vault_v1 : [];
            vault = vault.filter((item) => item.id !== threadId);
            vault.unshift(itemToSave);
            chrome.storage.local.set({ x_hook_vault_v1: vault }, () => {
              try {
                localStorage.setItem('x_hook_vault_v1', JSON.stringify(vault));
              } catch (e) {}
            });
          });
        } catch (err) {
          saveToLocalStorageFallback();
        }
      } else {
        saveToLocalStorageFallback();
      }
    });

    actionBar.appendChild(hookBtn);
  }

  // --- Real-time Live Feed Scanner Engine ---
  let isRealtimeScanning = false;
  let scanIntervalId = null;

  function initRealtimeScannerDock() {
    const platform = getPlatform();
    if (platform !== 'x' && platform !== 'threads') return;
    if (document.getElementById('x-shield-scanner-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'x-shield-scanner-dock';
    dock.className = 'x-shield-scanner-dock';
    dock.innerHTML = `
      <div id="scannerLiveHud" class="scanner-live-hud hidden">
        <span class="hud-pulse"></span>
        <span id="scannerHudStatus">Đang quét feed...</span>
        <button type="button" class="btn-scanner-stop" id="btnStopRealtimeScan" title="Dừng quét">Dừng</button>
      </div>
      <button type="button" class="scanner-btn" id="btnTriggerRealtimeScan" title="Bắt đầu quét tìm bài viết Outlier gần đây theo thời gian thực">
        <span>${ICONS.scan}</span>
        <span>Quét Outlier Feed</span>
      </button>
      <button type="button" class="scanner-btn scanner-btn-vault" id="btnOpenVaultDock" title="Mở Threads & X Hook Vault Dashboard">
        <span>${ICONS.zap}</span>
        <span>Hook Vault</span>
      </button>
    `;

    document.body.appendChild(dock);

    const triggerBtn = dock.querySelector('#btnTriggerRealtimeScan');
    const stopBtn = dock.querySelector('#btnStopRealtimeScan');
    const liveHud = dock.querySelector('#scannerLiveHud');
    const hudStatus = dock.querySelector('#scannerHudStatus');
    const vaultBtn = dock.querySelector('#btnOpenVaultDock');

    triggerBtn.addEventListener('click', () => {
      startRealtimeScanning(triggerBtn, liveHud, hudStatus);
    });

    stopBtn.addEventListener('click', () => {
      stopRealtimeScanning(triggerBtn, liveHud);
    });

    if (vaultBtn) {
      vaultBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      vaultBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      vaultBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openVaultDashboard();
      });
    }
  }

  function startRealtimeScanning(triggerBtn, liveHud, hudStatus) {
    if (isRealtimeScanning) return;
    isRealtimeScanning = true;

    triggerBtn.classList.add('hidden');
    liveHud.classList.remove('hidden');
    showShieldToast('⚡ Bắt đầu quét Outlier Realtime...');

    let scrollSteps = 0;
    const maxSteps = 40;

    scanIntervalId = setInterval(() => {
      if (!isRealtimeScanning || scrollSteps >= maxSteps) {
        stopRealtimeScanning(triggerBtn, liveHud);
        return;
      }

      scrollSteps++;
      scanFeed();

      const platform = getPlatform();
      const selector = platform === 'x' ? 'article[data-testid="tweet"]' : 'article[role="article"], div[data-pressable-container="true"]';
      const allPosts = document.querySelectorAll(selector);
      const outliers = document.querySelectorAll('.x-shield-outlier-post');

      hudStatus.textContent = `Đang quét: ${allPosts.length} bài • ${outliers.length} Outlier 🔥`;

      window.scrollBy({ top: 380, behavior: 'smooth' });
    }, 600);
  }

  function stopRealtimeScanning(triggerBtn, liveHud) {
    if (!isRealtimeScanning && !scanIntervalId) return;
    isRealtimeScanning = false;
    if (scanIntervalId) {
      clearInterval(scanIntervalId);
      scanIntervalId = null;
    }

    if (liveHud) liveHud.classList.add('hidden');
    if (triggerBtn) triggerBtn.classList.remove('hidden');

    const outliers = document.querySelectorAll('.x-shield-outlier-post');
    showShieldToast(`✓ Đã quét xong! Phát hiện ${outliers.length} bài Outlier đột biến.`);
  }

  // Scanner for Posts & Comments
  function scanFeed() {
    const platform = getPlatform();

    if (platform === 'threads') {
      const isActivity = window.location.pathname.includes('/activity');
      if (document.body) document.body.classList.toggle('is-activity-page', isActivity);

      if (isActivity) {
        document.querySelectorAll('.x-shield-outlier-post, .x-shield-threads-viral, .x-shield-threads-hook-btn, .x-shield-outlier-badge').forEach((el) => {
          el.classList.remove('x-shield-outlier-post', 'is-threads', 'x-shield-threads-viral');
          if (el.classList.contains('x-shield-threads-hook-btn') || el.classList.contains('x-shield-outlier-badge')) {
            el.remove();
          }
        });
      }

      // Cleanup any lingering badges mistakenly injected into header or navigation
      document.querySelectorAll('header .x-jev-badge-container, nav .x-jev-badge-container, [role="banner"] .x-jev-badge-container, [role="navigation"] .x-jev-badge-container, header .x-shield-outlier-badge, nav .x-shield-outlier-badge').forEach((b) => b.remove());

      const postContainers = new Set();
      document.querySelectorAll('div[data-pressable-container="true"], div[role="article"], article, div[data-testid*="post"], div[data-testid*="thread"]').forEach((el) => {
        if (!isHeaderOrNavigation(el)) {
          postContainers.add(el);
        }
      });
      document.querySelectorAll('a[href*="/post/"], a[href*="/t/"]').forEach((link) => {
        if (isHeaderOrNavigation(link)) return;
        let container = link.closest('article') || link.closest('div[data-pressable-container="true"]') || link.closest('div[role="article"]');
        if (!container) {
          let curr = link.parentElement;
          let depth = 0;
          while (curr && curr !== document.body && depth < 6) {
            if (isHeaderOrNavigation(curr)) break;
            if (curr.querySelector('span[dir="auto"], div[dir="auto"]') && curr.querySelectorAll('svg').length >= 1) {
              container = curr;
              break;
            }
            curr = curr.parentElement;
            depth++;
          }
        }
        if (container && !isHeaderOrNavigation(container)) {
          postContainers.add(container);
        }
      });

      // Filter to keep top-level containers (discard elements contained by another candidate)
      const candidateContainers = Array.from(postContainers).filter((el) => {
        if (isHeaderOrNavigation(el)) return false;
        return !Array.from(postContainers).some((other) => other !== el && other.contains(el));
      });

      candidateContainers.forEach((post) => {
        if (isHeaderOrNavigation(post)) return;

        // A valid Threads post must have an author handle/link or action bar or be an article
        const hasAuthor = !!post.querySelector('a[href*="/@"]');
        const hasActionBar = !!findThreadsActionBar(post);
        const isArticle = post.tagName === 'ARTICLE' || post.getAttribute('role') === 'article';
        if (!hasAuthor && !hasActionBar && !isArticle) return;
        const textEls = post.querySelectorAll('span[dir="auto"], div[dir="auto"]');
        const candidateEls = [];

        textEls.forEach((el) => {
          if (el.closest('button') || el.closest('time') || isProfileOnlyLink(el) || el.classList.contains('x-jev-badge') || el.closest('.x-jev-badge-container')) return;
          let t = el.innerText.trim();
          t = t.replace(/\s*(Translate|Xem bản dịch)$/i, '').trim();
          if (t.length < 2) return;
          if (/^\d+(\.\d+)?(k|m|b)?\s*(likes?|replies?|views?|lượt thích|câu trả lời|bình luận|chia sẻ)?$/i.test(t)) return;
          if (/^(\d+\s*(s|m|h|d|w|y|giây|phút|giờ|ngày|tuần|tháng|năm)|just now|vừa xong)$/i.test(t)) return;
          if (/^(translate|xem bản dịch|reply|trả lời|like|thích|share|chia sẻ|follow|theo dõi|following|đang theo dõi|edited|đã chỉnh sửa)$/i.test(t)) return;
          if (/^@?[\w\.]+(\s+and\s+\d+\s+others)?(\s+\d+[smhdw])?$/i.test(t)) return;

          if (el.children.length > 5) return;

          candidateEls.push({ el, text: t });
        });

        let targetItem = null;
        if (candidateEls.length > 0) {
          targetItem = candidateEls[candidateEls.length - 1];
          if (!window.location.pathname.includes('/activity')) {
            candidateEls.forEach((item) => {
              if (item.text.length > targetItem.text.length) targetItem = item;
            });
          }
        }

        const cleanText = targetItem ? targetItem.text : (post.innerText || '').slice(0, 300);

        // Threads Hook Vault & Jev AI Viral Scanner runs on visible posts, never on Activity notifications
        if (cleanText && !isActivity) {
          processThreadsHookAndViral(post, cleanText, targetItem ? targetItem.el : null);
        }

        // Only feed classification queue is guarded by data-jev-scanned
        if (!post.hasAttribute('data-jev-scanned')) {
          checkAndApplyMonkMode(post, post.innerText || '');

          if (targetItem && cleanText.length >= 2) {
            post.setAttribute('data-jev-scanned', 'true');
            scannedCount++;
            updatePill();

            if (textCache.has(cleanText)) {
              renderClassification({ postEl: post, text: cleanText, textEl: targetItem.el }, textCache.get(cleanText));
            } else {
              queue.push({ postEl: post, text: cleanText, textEl: targetItem.el });
            }
          }
        }
      });
    } else if (platform === 'facebook') {
      // 1. Scan Facebook Reels, Pop-up video player, and Feed Trays
      scanFacebookReels();

      // 2. Scan standard feed units
      document.querySelectorAll('div[data-pagelet^="FeedUnit_"]:not([data-jev-scanned]):not(:has([role="article"])), div[role="article"]:not([data-jev-scanned]), div[role="feed"] > div:not([data-jev-scanned]):not(:has([data-pagelet])):not(:has([role="article"]))').forEach((post) => {
        checkAndApplyMonkMode(post, post.innerText || '');

        const msgEl = post.querySelector('div[data-ad-rendering-role="story_message"], div[data-ad-preview="message"]') ||
                      Array.from(post.querySelectorAll('div[dir="auto"], span[dir="auto"]')).find((el) => el.innerText.trim().length >= 10);
        if (msgEl) {
          let text = msgEl.innerText.trim();
          text = text.replace(/\s*(Translate|Xem bản dịch)$/i, '').trim();
          if (text.length >= 2) {
            post.setAttribute('data-jev-scanned', 'true');
            scannedCount++;
            updatePill();
            if (textCache.has(text)) {
              renderClassification({ postEl: post, text, textEl: msgEl }, textCache.get(text));
            } else {
              queue.push({ postEl: post, text, textEl: msgEl });
            }
          }
        }
      });

      // Individual comments
      document.querySelectorAll('div[aria-label*="bình luận"]:not([data-jev-cmt-scanned]), div[aria-label*="Comment"]:not([data-jev-cmt-scanned]), ul > li div[dir="auto"]:not([data-jev-cmt-scanned])').forEach((cmt) => {
        if (cmt.closest('.x-jev-seeding-collapsed') || cmt.closest('.x-jev-scam-box') || cmt.closest('.x-jev-warning-box')) return;
        let t = cmt.innerText.trim();
        t = t.replace(/\s*(Translate|Xem bản dịch)$/i, '').trim();
        if (t.length >= 2 && t.length <= 600) {
          cmt.setAttribute('data-jev-cmt-scanned', 'true');
          scannedCount++;
          updatePill();
          if (textCache.has(t)) {
            renderClassification({ postEl: cmt, text: t, textEl: cmt }, textCache.get(t));
          } else {
            queue.push({ postEl: cmt, text: t, textEl: cmt });
          }
        }
      });
    } else if (platform === 'instagram') {
      scanInstagramReels();
    } else if (platform === 'youtube') {
      scanYouTubeShorts();
    } else if (platform === 'x') {
      document.querySelectorAll('article[data-testid="tweet"]').forEach((post) => {
        const textEl = post.querySelector('div[data-testid="tweetText"]');
        let text = textEl ? textEl.innerText.trim().replace(/\s*(Translate|Xem bản dịch)$/i, '').trim() : '';

        // Run Hook & Viral scanner on all visible tweets
        if (text) {
          processXTweetHookAndViral(post, text);
        }

        if (!post.hasAttribute('data-jev-scanned')) {
          checkAndApplyMonkMode(post, post.innerText || '');
          if (text && text.length >= 2) {
            post.setAttribute('data-jev-scanned', 'true');
            scannedCount++;
            updatePill();
            if (textCache.has(text)) {
              renderClassification({ postEl: post, text, textEl }, textCache.get(text));
            } else {
              queue.push({ postEl: post, text, textEl });
            }
          }
        }
      });
    }

    if (queue.length > 0) {
      console.log(`[Social Shield] 🔎 Tìm thấy ${queue.length} bài mới trên ${platform.toUpperCase()} cần gửi Jev.`);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flushQueue, config.batchDebounceMs);
    }
  }

  let scanTimer = null;
  function scheduleScan() {
    if (scanTimer) return;
    scanTimer = setTimeout(() => {
      scanFeed();
      scanTimer = null;
    }, 150);
  }

  const observer = new MutationObserver(() => scheduleScan());
  function initObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      scanFeed();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
        scanFeed();
      });
    }

    // Safety interval for Video/Reels/Shorts on Facebook, Instagram, YouTube
    if (['facebook', 'instagram', 'youtube'].includes(getPlatform())) {
      setInterval(() => {
        if (config.monkModeEnabled || config.blockReelsEnabled) {
          if (getPlatform() === 'facebook') scanFacebookReels();
          if (getPlatform() === 'instagram') scanInstagramReels();
          if (getPlatform() === 'youtube') scanYouTubeShorts();
        }
      }, 400);
    }

    window.addEventListener('popstate', () => {
      if (getPlatform() === 'facebook') scanFacebookReels();
      if (getPlatform() === 'instagram') scanInstagramReels();
      if (getPlatform() === 'youtube') scanYouTubeShorts();
    });

    if (getPlatform() === 'youtube') {
      window.addEventListener('yt-navigate-finish', () => scanYouTubeShorts());
    }

    // Safety heartbeat interval: keep pill alive against React hydration & catch missed feed updates
    setInterval(() => {
      initPill();
      initRealtimeScannerDock();
      scheduleScan();
    }, 1500);

    // Watch for SPA URL changes (Threads, X, Facebook)
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        scheduleScan();
      }
    }, 500);
  }

  initObserver();
  initRealtimeScannerDock();
  console.log(`[Social Shield + Monk Mode] Active on ${getPlatform().toUpperCase()} (${window.location.hostname}) 🛡️`);
})();
