// ==UserScript==
// @name         Social Shield All-in-One: Anti-Rage, Anti-Scam, Universal Reels & Monk Mode
// @namespace    https://classifier.dev/
// @version      2.3.0
// @description  Tự động làm mờ rage-bait, chặn bài lừa đảo, thu gọn seeding và kích hoạt Monk Mode chặn ảnh/video phụ nữ & Reels/Shorts trên Instagram, YouTube, Facebook, Threads, X
// @author       Antigravity
// @match        *://*.threads.com/*
// @match        *://threads.com/*
// @match        *://*.threads.net/*
// @match        *://threads.net/*
// @match        *://*.facebook.com/*
// @match        *://facebook.com/*
// @match        *://*.fb.com/*
// @match        *://*.instagram.com/*
// @match        *://instagram.com/*
// @match        *://*.youtube.com/*
// @match        *://youtube.com/*
// @match        *://*.x.com/*
// @match        *://x.com/*
// @match        *://*.twitter.com/*
// @match        *://twitter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      classifier.dev
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    apiEndpoint: 'https://classifier.dev',
    batchDebounceMs: 120,
    confidenceThreshold: 0.30,
    filterMotivationalEnabled: true,
    filterMemeEnabled: true,
    filterDeepDiveEnabled: true,
    filterWholesomeEnabled: true,
    filterDoomEnabled: true,
    filterFomoEnabled: true,
    filterCasualEnabled: true,
    customLabels: [],
    monkModeEnabled: true,
    blockReelsEnabled: true,
    autoBlurRageEnabled: true,
    blockScamsEnabled: true,
    collapseSeedingEnabled: true,
    focusModeEnabled: false,
    focusWhitelistTags: ['motivational', 'meme', 'deepdive', 'wholesome'],
    viralDetectionEnabled: true,
    outlierDetectionEnabled: true,
    outlierMinViews: 3000,
    outlierMinMultiplier: 3.0,
    outlierMaxAgeHours: 48,
    outlierThreadsMinLikes: 150,
    outlierThreadsMinMultiplier: 2.0,
    outlierThreadsMinViews: 2000,
  };

  try {
    const savedFocus = localStorage.getItem('social_shield_focus_mode');
    if (savedFocus !== null) CONFIG.focusModeEnabled = savedFocus === 'true';
    const savedTags = localStorage.getItem('social_shield_focus_tags');
    if (savedTags) CONFIG.focusWhitelistTags = JSON.parse(savedTags);
  } catch (e) {}

  let scannedCount = 0;
  let monkModeBlockedCount = 0;
  let blockedRageCount = 0;
  let blockedScamCount = 0;
  let cleanedSeedingCount = 0;
  let focusCollapsedCount = 0;
  let motivationalCount = 0;
  let memeCount = 0;
  let deepDiveCount = 0;
  let wholesomeCount = 0;
  let doomCount = 0;
  let fomoCount = 0;
  let casualCount = 0;
  let customCount = 0;

  function getPlatform() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('threads.net') || host.includes('threads.com')) return 'threads';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('youtube.com')) return 'youtube';
    return 'x';
  }

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

  const css = `
/* Universal Social Shield (Threads, X, Facebook) - Anti-Rage, Anti-Scam, Anti-Seeding, Monk Mode */
/* Redesigned to Impeccable Craft Floor & Shadcn Zinc Dark System */

:root {
  --jev-bg-canvas: #09090b;
  --jev-bg-surface: rgba(18, 18, 23, 0.94);
  --jev-bg-card: rgba(24, 24, 27, 0.75);
  --jev-border-subtle: rgba(255, 255, 255, 0.08);
  --jev-border-hover: rgba(255, 255, 255, 0.16);
  --jev-text-primary: #f4f4f5;
  --jev-text-muted: #a1a1aa;
  --jev-text-dim: #71717a;
  --jev-radius-sm: 4px;
  --jev-radius-md: 6px;
  --jev-radius-lg: 10px;
  --jev-radius-pill: 9999px;
  --jev-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
}

/* --- Badges & Multi-Badge Container --- */
.x-jev-badge-container {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 6px !important;
  margin: 6px 0 8px 0 !important;
  width: 100% !important;
  position: relative !important;
  z-index: 10 !important;
}

.x-jev-badge-container:empty,
.x-jev-badge-container:not(:has(.x-jev-badge:not(.x-jev-hidden))) {
  display: none !important;
}

.x-jev-badge-container .x-jev-badge {
  margin: 0 !important;
}

.x-jev-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 3px 9px !important;
  border-radius: var(--jev-radius-md, 6px) !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
  margin: 3px 0 6px 0 !important;
  border: 1px solid !important;
  width: fit-content !important;
  user-select: none !important;
  transition: transform 0.2s var(--jev-ease-spring), border-color 0.2s, box-shadow 0.2s !important;
  cursor: help !important;
  line-height: 1.3 !important;
  z-index: 10 !important;
  position: relative !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  backdrop-filter: blur(8px) !important;
  overflow: hidden !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

/* ReactBits Metallic Shimmer Sweep */
.x-jev-badge::after {
  content: "" !important;
  position: absolute !important;
  top: -50% !important;
  left: -120% !important;
  width: 80% !important;
  height: 200% !important;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%) !important;
  transform: rotate(30deg) !important;
  pointer-events: none !important;
  animation: jev-badge-shimmer 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite !important;
}

@keyframes jev-badge-shimmer {
  0% { left: -120%; }
  25%, 100% { left: 220%; }
}

.x-jev-badge svg {
  width: 12px !important;
  height: 12px !important;
  flex-shrink: 0 !important;
  display: inline-block !important;
  position: relative !important;
  z-index: 1 !important;
}

.x-jev-badge span {
  position: relative !important;
  z-index: 1 !important;
}

.x-jev-badge:hover {
  transform: translateY(-1.5px) scale(1.03) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), 0 0 14px currentColor, inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

.x-jev-badge.x-jev-hidden {
  display: none !important;
}

.x-jev-confidence {
  font-size: 9.5px !important;
  opacity: 0.75 !important;
  font-weight: 400 !important;
  margin-left: 2px !important;
}

/* --- Blur Targets for Rage Bait & Scams --- */
[data-jev-rage="true"]:not(.x-jev-revealed):not([data-jev-revealed="true"]) [data-jev-blur-item="true"],
[data-jev-scam="true"]:not(.x-jev-revealed):not([data-jev-revealed="true"]) [data-jev-blur-item="true"],
.x-jev-blurred-content {
  filter: blur(14px) !important;
  opacity: 0.15 !important;
  user-select: none !important;
  pointer-events: none !important;
  transition: filter 0.2s ease, opacity 0.2s ease !important;
}

/* Restored clean state when user clicks 'Reveal post' or disables blur */
[data-jev-rage="true"].x-jev-revealed [data-jev-blur-item="true"],
[data-jev-scam="true"].x-jev-revealed [data-jev-blur-item="true"],
.x-jev-revealed,
.x-jev-revealed[data-jev-blur-item="true"],
.x-jev-revealed [data-jev-blur-item="true"],
.x-jev-revealed.x-jev-blurred-content,
.x-jev-revealed .x-jev-blurred-content,
.x-jev-unblurred,
[data-jev-revealed="true"],
[data-jev-revealed="true"][data-jev-blur-item="true"],
[data-jev-revealed="true"] [data-jev-blur-item="true"],
[data-jev-revealed="true"] span,
[data-jev-revealed="true"] div,
[data-jev-revealed="true"] img,
[data-jev-revealed="true"] video {
  filter: none !important;
  opacity: 1 !important;
  user-select: auto !important;
  pointer-events: auto !important;
}

/* Global Unblur overrides when user disables blur in settings */
body.x-jev-no-rage-blur [data-jev-blur-item="true"],
body.x-jev-no-rage-blur [data-jev-rage="true"],
body.x-jev-no-rage-blur [data-jev-rage="true"] [data-jev-blur-item="true"],
body.x-jev-no-rage-blur [data-jev-rage="true"] span,
body.x-jev-no-rage-blur [data-jev-rage="true"] div,
body.x-jev-disable-all-blur [data-jev-blur-item="true"],
body.x-jev-disable-all-blur [data-jev-rage="true"] *,
body.x-jev-disable-all-blur .x-jev-blurred-content {
  filter: none !important;
  opacity: 1 !important;
  user-select: auto !important;
  pointer-events: auto !important;
}

body.x-jev-no-rage-blur .x-jev-warning-box,
body.x-jev-disable-all-blur .x-jev-warning-box {
  display: none !important;
}

/* --- Monk Mode: Hardcore Anti-Goonbait & Women Media Blocker --- */
[data-monk-blocked="true"]:not(.monk-revealed):not([data-monk-revealed="true"]) img:not([alt*="avatar"]):not([alt*="profile"]):not([src*="profile_images"]),
[data-monk-blocked="true"]:not(.monk-revealed):not([data-monk-revealed="true"]) video,
.monk-blur-media {
  filter: blur(28px) grayscale(60%) !important;
  opacity: 0.1 !important;
  user-select: none !important;
  pointer-events: none !important;
  transition: filter 0.25s ease, opacity 0.25s ease !important;
}

.monk-revealed,
.monk-revealed img,
.monk-revealed video,
.monk-revealed .monk-blur-media,
[data-monk-revealed="true"],
[data-monk-revealed="true"] img,
[data-monk-revealed="true"] video,
body.x-jev-no-monk-blur [data-monk-blocked="true"] img,
body.x-jev-no-monk-blur [data-monk-blocked="true"] video,
body.x-jev-no-monk-blur .monk-blur-media,
body.x-jev-disable-all-blur [data-monk-blocked="true"] img,
body.x-jev-disable-all-blur [data-monk-blocked="true"] video {
  filter: none !important;
  opacity: 1 !important;
  user-select: auto !important;
  pointer-events: auto !important;
}

body.x-jev-no-monk-blur .x-monk-warning-box,
body.x-jev-disable-all-blur .x-monk-warning-box {
  display: none !important;
}

.x-monk-warning-box {
  background: rgba(15, 23, 42, 0.9) !important;
  border: 1.5px solid #0ea5e9 !important;
  border-radius: 10px !important;
  padding: 8px 14px !important;
  margin: 6px 0 10px 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  font-size: 12px !important;
  color: #38bdf8 !important;
  backdrop-filter: blur(10px) !important;
  z-index: 99 !important;
  position: relative !important;
  width: 100% !important;
  box-sizing: border-box !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}

.x-monk-warning-text {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-weight: 600 !important;
  color: #38bdf8 !important;
  line-height: 1.3 !important;
}

.x-monk-reveal-btn {
  background: #0284c7 !important;
  border: none !important;
  color: #ffffff !important;
  padding: 5px 12px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  font-size: 11.5px !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
  transition: all 0.15s ease !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.x-monk-reveal-btn:hover {
  background: #0369a1 !important;
  transform: scale(1.04) !important;
}

/* --- Facebook Reels & Video Popups / Shelves (Monk Mode) --- */
[data-monk-reels-blocked="true"]:not(.monk-revealed) video,
[data-monk-reels-blocked="true"]:not(.monk-revealed) img,
[data-monk-tray-blocked="true"]:not(.monk-revealed) video,
[data-monk-tray-blocked="true"]:not(.monk-revealed) img {
  filter: blur(36px) grayscale(80%) !important;
  opacity: 0.05 !important;
  pointer-events: none !important;
  transition: filter 0.25s ease, opacity 0.25s ease !important;
}

[data-monk-reels-blocked="true"].monk-revealed video,
[data-monk-reels-blocked="true"].monk-revealed img,
[data-monk-tray-blocked="true"].monk-revealed video,
[data-monk-tray-blocked="true"].monk-revealed img {
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

/* High-z-index Reels Modal / Pop-up Center Overlay */
.x-monk-reels-overlay {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 240px !important;
  background: rgba(9, 13, 22, 0.94) !important;
  backdrop-filter: blur(25px) !important;
  -webkit-backdrop-filter: blur(25px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 999999 !important;
  padding: 24px !important;
  box-sizing: border-box !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

[data-monk-reels-blocked="true"].monk-revealed .x-monk-reels-overlay {
  display: none !important;
}

.x-monk-reels-card {
  max-width: 360px !important;
  background: rgba(15, 23, 42, 0.96) !important;
  border: 1.5px solid rgba(56, 189, 248, 0.5) !important;
  border-radius: 16px !important;
  padding: 22px 20px !important;
  text-align: center !important;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7) !important;
  color: #f8fafc !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}

.x-monk-reels-icon {
  font-size: 38px !important;
  margin-bottom: 10px !important;
  line-height: 1 !important;
}

.x-monk-reels-title {
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #38bdf8 !important;
  margin-bottom: 6px !important;
}

.x-monk-reels-desc {
  font-size: 12px !important;
  color: #94a3b8 !important;
  line-height: 1.45 !important;
  margin-bottom: 16px !important;
}

.x-monk-reels-actions {
  display: flex !important;
  gap: 10px !important;
  justify-content: center !important;
}

.x-monk-btn-reveal {
  background: #0284c7 !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-size: 12.5px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}
.x-monk-btn-reveal:hover {
  background: #0369a1 !important;
  transform: scale(1.03) !important;
}

.x-monk-btn-close {
  background: rgba(239, 68, 68, 0.18) !important;
  color: #fca5a5 !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-size: 12.5px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}
.x-monk-btn-close:hover {
  background: rgba(239, 68, 68, 0.3) !important;
  transform: scale(1.03) !important;
}

.x-monk-btn-home {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-size: 12.5px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}
.x-monk-btn-home:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  transform: scale(1.03) !important;
}

/* YouTube Shorts & Instagram Reels Blurs */
ytd-shorts[data-monk-reels-blocked="true"]:not(.monk-revealed) video,
#shorts-container[data-monk-reels-blocked="true"]:not(.monk-revealed) video,
ytd-reel-video-renderer[data-monk-reels-blocked="true"]:not(.monk-revealed) video,
ytd-rich-shelf-renderer[is-shorts][data-monk-tray-blocked="true"]:not(.monk-revealed) #contents,
ytd-reel-shelf-renderer[data-monk-tray-blocked="true"]:not(.monk-revealed) #contents,
main[data-monk-reels-blocked="true"]:not(.monk-revealed) video {
  filter: blur(36px) grayscale(80%) !important;
  opacity: 0.05 !important;
  pointer-events: none !important;
  transition: filter 0.25s ease, opacity 0.25s ease !important;
}

/* Floating re-blur toggle button when video revealed */
.x-monk-re-blur-floating {
  position: absolute !important;
  top: 14px !important;
  left: 14px !important;
  z-index: 999999 !important;
  background: rgba(15, 23, 42, 0.88) !important;
  border: 1px solid rgba(56, 189, 248, 0.6) !important;
  color: #38bdf8 !important;
  padding: 6px 12px !important;
  border-radius: 20px !important;
  font-size: 11.5px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  backdrop-filter: blur(8px) !important;
  display: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
}
.x-monk-re-blur-floating:hover {
  background: #0284c7 !important;
  color: #ffffff !important;
}
[data-monk-reels-blocked="true"].monk-revealed .x-monk-re-blur-floating {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

/* Reels Tray Banner in Feed */
.x-monk-tray-banner {
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 58, 138, 0.9) 100%) !important;
  border: 1.5px solid rgba(56, 189, 248, 0.4) !important;
  border-radius: 10px !important;
  padding: 10px 14px !important;
  margin: 10px 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  color: #f8fafc !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  z-index: 10 !important;
  position: relative !important;
  box-sizing: border-box !important;
  width: 100% !important;
}

.x-monk-tray-content {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-size: 12.5px !important;
}

.x-monk-tray-toggle {
  background: #0284c7 !important;
  color: #fff !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 6px 14px !important;
  font-size: 11.5px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
  transition: all 0.15s ease !important;
}
.x-monk-tray-toggle:hover {
  background: #0369a1 !important;
  transform: scale(1.04) !important;
}

/* --- Rage Bait Warning Box (Dynamic Ambient Neon Glow) --- */
.x-jev-warning-box {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(24, 24, 27, 0.94) 100%) !important;
  border: 1px solid rgba(239, 68, 68, 0.45) !important;
  border-radius: var(--jev-radius-lg, 10px) !important;
  padding: 10px 14px !important;
  margin: 6px 0 10px 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  font-size: 12px !important;
  color: #f87171 !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  z-index: 99 !important;
  position: relative !important;
  width: 100% !important;
  box-sizing: border-box !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5), 0 0 25px rgba(239, 68, 68, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s !important;
}

.x-jev-warning-box:hover {
  border-color: rgba(239, 68, 68, 0.7) !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 35px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

.x-jev-warning-text {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-weight: 500 !important;
  color: #fca5a5 !important;
  line-height: 1.35 !important;
}

.x-jev-warning-text svg {
  width: 16px !important;
  height: 16px !important;
  color: #ef4444 !important;
  filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.6)) !important;
  flex-shrink: 0 !important;
}

/* --- Scam & Fraud Warning Box (Dynamic Ambient Neon Glow) --- */
.x-jev-scam-box {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(24, 24, 27, 0.95) 100%) !important;
  border: 1px solid rgba(220, 38, 38, 0.5) !important;
  border-radius: var(--jev-radius-lg, 10px) !important;
  padding: 10px 14px !important;
  margin: 6px 0 10px 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  font-size: 12px !important;
  color: #f87171 !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  z-index: 99 !important;
  position: relative !important;
  width: 100% !important;
  box-sizing: border-box !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55), 0 0 28px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s !important;
}

.x-jev-scam-box:hover {
  border-color: rgba(239, 68, 68, 0.75) !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 38px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

.x-jev-scam-text {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-weight: 500 !important;
  color: #fca5a5 !important;
  line-height: 1.35 !important;
}

.x-jev-scam-text svg {
  width: 16px !important;
  height: 16px !important;
  color: #ef4444 !important;
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.7)) !important;
  flex-shrink: 0 !important;
}

.x-jev-reveal-btn {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%) !important;
  border: 1px solid rgba(239, 68, 68, 0.45) !important;
  color: #fca5a5 !important;
  padding: 5px 13px !important;
  border-radius: var(--jev-radius-md, 6px) !important;
  cursor: pointer !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  white-space: nowrap !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  z-index: 100 !important;
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.25) !important;
}

.x-jev-reveal-btn:hover {
  background: #ef4444 !important;
  color: #ffffff !important;
  border-color: #ef4444 !important;
  transform: translateY(-1.5px) scale(1.03) !important;
  box-shadow: 0 4px 18px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.5) !important;
}

/* --- Collapsed Seeding Comment Bar (Shadcn Accordion Strip with Neon Glow) --- */
.x-jev-seeding-collapsed {
  background: rgba(24, 24, 27, 0.75) !important;
  border: 1px solid rgba(168, 85, 247, 0.3) !important;
  border-radius: var(--jev-radius-md, 6px) !important;
  padding: 6px 12px !important;
  margin: 4px 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: 11px !important;
  color: #c084fc !important;
  cursor: pointer !important;
  user-select: none !important;
  transition: all 0.2s var(--jev-ease-spring) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25) !important;
}

.x-jev-seeding-collapsed:hover {
  background: rgba(168, 85, 247, 0.16) !important;
  border-color: rgba(168, 85, 247, 0.6) !important;
  color: #f3e8ff !important;
  transform: translateX(3px) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 18px rgba(168, 85, 247, 0.28) !important;
}

.x-jev-seeding-label {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-weight: 500 !important;
}

.x-jev-seeding-label svg {
  width: 13px !important;
  height: 13px !important;
  color: #c084fc !important;
  filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.5)) !important;
  flex-shrink: 0 !important;
}

.x-jev-expand-icon {
  font-size: 10.5px !important;
  font-weight: 600 !important;
  color: #e9d5ff !important;
  background: rgba(168, 85, 247, 0.2) !important;
  border: 1px solid rgba(168, 85, 247, 0.35) !important;
  padding: 2px 7px !important;
  border-radius: var(--jev-radius-sm, 4px) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.2) !important;
}

.x-jev-expand-icon svg {
  width: 11px !important;
  height: 11px !important;
  transition: transform 0.2s var(--jev-ease-spring) !important;
}

.x-jev-collapsed-body {
  display: none !important;
}

/* --- Focus Feed Mode: Collapsed Bar for Off-Topic Posts with Cyan Glow --- */
.x-jev-focus-bar {
  background: rgba(24, 24, 27, 0.75) !important;
  border: 1px solid var(--jev-border-subtle, rgba(255, 255, 255, 0.08)) !important;
  border-radius: var(--jev-radius-md, 6px) !important;
  padding: 6px 12px !important;
  margin: 4px 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: 11px !important;
  color: #94a3b8 !important;
  cursor: pointer !important;
  user-select: none !important;
  transition: all 0.2s var(--jev-ease-spring) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25) !important;
}

.x-jev-focus-bar:hover {
  background: rgba(30, 41, 59, 0.85) !important;
  border-color: rgba(56, 189, 248, 0.55) !important;
  color: #f1f5f9 !important;
  transform: translateX(3px) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 18px rgba(56, 189, 248, 0.28) !important;
}

.x-jev-focus-info {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-weight: 500 !important;
}

.x-jev-focus-info svg {
  width: 13px !important;
  height: 13px !important;
  color: #38bdf8 !important;
  filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.5)) !important;
  flex-shrink: 0 !important;
}

.x-jev-focus-action {
  font-size: 10.5px !important;
  font-weight: 600 !important;
  color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.14) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  padding: 2px 7px !important;
  border-radius: var(--jev-radius-sm, 4px) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.2) !important;
  transition: background 0.15s ease, box-shadow 0.15s ease !important;
}

.x-jev-focus-action svg {
  width: 11px !important;
  height: 11px !important;
  transition: transform 0.2s var(--jev-ease-spring) !important;
}

.x-jev-focus-expanded .x-jev-focus-action svg {
  transform: rotate(180deg) !important;
}

.x-jev-focus-bar:hover .x-jev-focus-action {
  background: rgba(56, 189, 248, 0.22) !important;
}

.x-jev-focus-collapsed-content {
  display: none !important;
}

.x-jev-focus-expanded .x-jev-focus-collapsed-content {
  display: block !important;
}

body.x-jev-no-focus .x-jev-focus-bar {
  display: none !important;
}

body.x-jev-no-focus .x-jev-focus-collapsed-content {
  display: revert !important;
}

/* --- Dynamic Island / Radar Status Widget (ReactBits Border Beam & Specular 3D Glass) --- */
@keyframes jev-radar-ping {
  0% { transform: scale(1); opacity: 0.8; }
  80%, 100% { transform: scale(2.4); opacity: 0; }
}

@keyframes jev-beam-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.x-jev-floating-pill {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  z-index: 999999 !important;
  background: transparent !important;
  color: #e2e8f0 !important;
  padding: 5px 9px 5px 11px !important;
  border-radius: var(--jev-radius-pill, 9999px) !important;
  font-size: 11.5px !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(34, 197, 94, 0.25) !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  cursor: pointer !important;
  user-select: none !important;
  transition: all 0.25s var(--jev-ease-spring) !important;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

body.x-jev-hide-pill .x-jev-floating-pill,
.x-jev-floating-pill.x-jev-pill-hidden,
.x-jev-floating-pill[data-hidden="true"],
.x-jev-pill-hidden {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
}

/* ReactBits Border Beam Container */
.x-jev-pill-beam {
  position: absolute !important;
  inset: 0 !important;
  border-radius: inherit !important;
  overflow: hidden !important;
  pointer-events: none !important;
  z-index: 0 !important;
}

/* Conic Laser Beam Rotating */
.x-jev-pill-beam::before {
  content: "" !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 350% !important;
  height: 350% !important;
  background: conic-gradient(from 0deg, transparent 0 260deg, rgba(34, 197, 94, 0.2) 290deg, #4ade80 340deg, #22c55e 360deg) !important;
  transform: translate(-50%, -50%) rotate(0deg) !important;
  animation: jev-beam-spin 3.2s linear infinite !important;
}

/* Specular 3D Glass Inner Face */
.x-jev-pill-beam::after {
  content: "" !important;
  position: absolute !important;
  inset: 1px !important;
  border-radius: inherit !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 45%, rgba(0, 0, 0, 0.4) 100%), rgba(15, 15, 20, 0.94) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 1px rgba(0, 0, 0, 0.5) !important;
}

/* Threat Alert Glow Mode */
.x-jev-floating-pill[data-alert="true"] {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), 0 0 28px rgba(239, 68, 68, 0.45) !important;
}
.x-jev-floating-pill[data-alert="true"] .x-jev-pill-beam::before {
  background: conic-gradient(from 0deg, transparent 0 260deg, rgba(239, 68, 68, 0.2) 290deg, #f87171 340deg, #ef4444 360deg) !important;
  animation-duration: 2.2s !important;
}

.x-jev-floating-pill:hover {
  transform: translateY(-2.5px) scale(1.02) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 32px rgba(34, 197, 94, 0.45) !important;
}
.x-jev-floating-pill[data-alert="true"]:hover {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 38px rgba(239, 68, 68, 0.6) !important;
}

/* Multi-Ring Radar Indicator Dot */
.x-jev-radar-dot {
  position: relative !important;
  display: inline-flex !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background-color: #4ade80 !important;
  box-shadow: 0 0 10px #22c55e, 0 0 18px #22c55e !important;
  flex-shrink: 0 !important;
  z-index: 2 !important;
}

.x-jev-floating-pill[data-alert="true"] .x-jev-radar-dot {
  background-color: #f87171 !important;
  box-shadow: 0 0 10px #ef4444, 0 0 18px #ef4444 !important;
}

.x-jev-radar-ping {
  position: absolute !important;
  inset: -1px !important;
  border-radius: 50% !important;
  background-color: #4ade80 !important;
  animation: jev-radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite !important;
}

.x-jev-floating-pill[data-alert="true"] .x-jev-radar-ping {
  background-color: #ef4444 !important;
}

.x-jev-pill-platform {
  font-weight: 700 !important;
  font-size: 10px !important;
  letter-spacing: 0.05em !important;
  color: #f1f5f9 !important;
  text-transform: uppercase !important;
  position: relative !important;
  z-index: 2 !important;
}

.x-jev-pill-badge-count {
  display: inline-flex !important;
  align-items: center !important;
  padding: 1px 7px !important;
  border-radius: var(--jev-radius-pill, 9999px) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #e2e8f0 !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  position: relative !important;
  z-index: 2 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
}

.x-jev-pill-toggle {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #94a3b8 !important;
  transition: transform 0.2s var(--jev-ease-spring) !important;
  position: relative !important;
  z-index: 2 !important;
}

.x-jev-floating-pill.x-jev-expanded .x-jev-pill-toggle svg {
  transform: rotate(180deg) !important;
}

.x-jev-pill-close {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-left: 2px !important;
  padding: 3px !important;
  width: 17px !important;
  height: 17px !important;
  color: #71717a !important;
  cursor: pointer !important;
  border-radius: 50% !important;
  background: transparent !important;
  transition: all 0.15s ease !important;
  user-select: none !important;
  z-index: 1000000 !important;
  pointer-events: auto !important;
  position: relative !important;
}

.x-jev-pill-close svg {
  width: 11px !important;
  height: 11px !important;
}

.x-jev-pill-close:hover {
  color: #ffffff !important;
  background: rgba(239, 68, 68, 0.8) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.6) !important;
}

/* Dynamic Island Expandable Flyout Panel with Specular Glass & Ambient Neon */
.x-jev-pill-flyout {
  position: absolute !important;
  bottom: calc(100% + 10px) !important;
  right: 0 !important;
  width: 255px !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 35%, rgba(0, 0, 0, 0.3) 100%), rgba(16, 16, 22, 0.96) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: var(--jev-radius-lg, 10px) !important;
  padding: 14px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  display: none !important;
  flex-direction: column !important;
  gap: 9px !important;
  cursor: default !important;
  transform-origin: bottom right !important;
  animation: jev-flyout-in 0.2s var(--jev-ease-spring) !important;
  z-index: 10 !important;
}

@keyframes jev-flyout-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.x-jev-floating-pill.x-jev-expanded .x-jev-pill-flyout {
  display: flex !important;
}

.x-jev-flyout-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important;
  padding-bottom: 8px !important;
}

.x-jev-flyout-title {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  color: #cbd5e1 !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.x-jev-flyout-title svg {
  width: 13px !important;
  height: 13px !important;
  color: #38bdf8 !important;
  filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.6)) !important;
}

.x-jev-flyout-status {
  font-size: 10px !important;
  font-weight: 600 !important;
  padding: 1.5px 7px !important;
  border-radius: 4px !important;
  background: rgba(34, 197, 94, 0.18) !important;
  color: #4ade80 !important;
  border: 1px solid rgba(34, 197, 94, 0.35) !important;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.2) !important;
}

.x-jev-flyout-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 6px !important;
}

.x-jev-metric-card {
  background: rgba(255, 255, 255, 0.035) !important;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  border-radius: var(--jev-radius-md, 6px) !important;
  padding: 7px 9px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
  transition: all 0.2s var(--jev-ease-spring) !important;
}

.x-jev-metric-card:hover {
  background: rgba(255, 255, 255, 0.07) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 12px rgba(255, 255, 255, 0.08) !important;
}

.x-jev-metric-label {
  font-size: 10px !important;
  color: #94a3b8 !important;
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.x-jev-metric-label svg {
  width: 11px !important;
  height: 11px !important;
}

.x-jev-metric-val {
  font-size: 13.5px !important;
  font-weight: 700 !important;
  color: #f8fafc !important;
  letter-spacing: -0.01em !important;
}

/* Luxury Glowing Cyber-Glass Outlier Post Highlight on X and Threads */
article.x-shield-outlier-post, div.x-shield-outlier-post,
article.x-shield-viral-post, div.x-shield-viral-post {
  border: 1px solid rgba(251, 191, 36, 0.45) !important;
  border-left: 4px solid #fbbf24 !important;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.02) 100%) !important;
  box-shadow: 0 0 26px -3px rgba(245, 158, 11, 0.35), inset 0 0 16px -3px rgba(245, 158, 11, 0.12) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

article.x-shield-outlier-post:hover, div.x-shield-outlier-post:hover {
  border-color: rgba(251, 191, 36, 0.65) !important;
  box-shadow: 0 0 32px 0 rgba(245, 158, 11, 0.45), inset 0 0 20px -2px rgba(245, 158, 11, 0.16) !important;
}

/* Threads Luxury Violet Amethyst Glow */
article.x-shield-outlier-post.is-threads, div.x-shield-outlier-post.is-threads,
article.x-shield-threads-viral, div.x-shield-threads-viral {
  border: 1px solid rgba(192, 132, 252, 0.45) !important;
  border-left: 4px solid #c084fc !important;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(147, 51, 234, 0.02) 100%) !important;
  box-shadow: 0 0 26px -3px rgba(168, 85, 247, 0.38), inset 0 0 16px -3px rgba(168, 85, 247, 0.12) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

article.x-shield-outlier-post.is-threads:hover, div.x-shield-outlier-post.is-threads:hover,
article.x-shield-threads-viral:hover, div.x-shield-threads-viral:hover {
  border-color: rgba(192, 132, 252, 0.65) !important;
  box-shadow: 0 0 32px 0 rgba(168, 85, 247, 0.48), inset 0 0 20px -2px rgba(168, 85, 247, 0.18) !important;
}

body.is-activity-page .x-shield-outlier-post,
body.is-activity-page .x-shield-threads-viral,
body.is-activity-page .x-shield-threads-hook-btn {
  border: none !important;
  border-left: none !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Luxury Glassmorphic Outlier Badge */
.x-shield-outlier-badge, .x-shield-viral-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 7px !important;
  background: rgba(18, 18, 22, 0.85) !important;
  border: 1px solid rgba(251, 191, 36, 0.4) !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 14px -2px rgba(245, 158, 11, 0.25) !important;
  border-radius: 9999px !important;
  padding: 4px 10px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #fbbf24 !important;
  margin: 6px 0 8px 0 !important;
  width: fit-content !important;
  letter-spacing: -0.01em !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  transition: all 0.2s ease !important;
}

.x-shield-outlier-badge:hover, .x-shield-viral-badge:hover {
  border-color: rgba(251, 191, 36, 0.65) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 20px 0 rgba(245, 158, 11, 0.4) !important;
  transform: translateY(-1px) !important;
}

.x-shield-outlier-badge.is-threads {
  color: #f0abfc !important;
  border-color: rgba(192, 132, 252, 0.4) !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 14px -2px rgba(168, 85, 247, 0.28) !important;
}

.x-shield-outlier-badge.is-threads:hover {
  border-color: rgba(192, 132, 252, 0.7) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 22px 0 rgba(168, 85, 247, 0.45) !important;
}

.x-shield-outlier-badge .outlier-fire {
  font-size: 12px !important;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6)) !important;
}

.x-shield-outlier-badge.is-threads .outlier-fire {
  filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.7)) !important;
}

.x-shield-outlier-badge .outlier-mult {
  font-weight: 700 !important;
  letter-spacing: -0.02em !important;
}

.x-shield-outlier-badge .outlier-sep {
  color: rgba(255, 255, 255, 0.25) !important;
  font-size: 9px !important;
}

.x-shield-outlier-badge .outlier-stats {
  color: #e4e4e7 !important;
  font-weight: 500 !important;
}

.x-shield-outlier-badge .outlier-time {
  color: #a1a1aa !important;
  font-size: 10.5px !important;
}

/* Threads & X Hook Button */
.x-shield-threads-hook-btn, .x-shield-hook-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-radius: 9999px !important;
  padding: 3px 9px !important;
  color: #a1a1aa !important;
  font-size: 11.5px !important;
  font-weight: 500 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  margin-left: 6px !important;
  user-select: none !important;
  line-height: 1 !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  height: 28px !important;
  box-sizing: border-box !important;
  outline: none !important;
}

.x-shield-threads-hook-btn:hover, .x-shield-hook-btn:hover {
  background: rgba(168, 85, 247, 0.12) !important;
  border-color: rgba(168, 85, 247, 0.4) !important;
  color: #c084fc !important;
}

.x-shield-threads-hook-btn.is-saved, .x-shield-hook-btn.is-saved {
  background: rgba(34, 197, 94, 0.12) !important;
  border-color: rgba(34, 197, 94, 0.35) !important;
  color: #4ade80 !important;
}

.x-shield-threads-hook-btn.is-loading, .x-shield-hook-btn.is-loading {
  opacity: 0.8 !important;
  cursor: wait !important;
}

.x-shield-threads-hook-btn svg, .x-shield-hook-btn svg {
  width: 14px !important;
  height: 14px !important;
  max-width: 14px !important;
  max-height: 14px !important;
  flex-shrink: 0 !important;
  display: inline-block !important;
  fill: currentColor !important;
}

.x-shield-threads-hook-btn span, .x-shield-hook-btn span {
  white-space: nowrap !important;
  line-height: 1 !important;
  display: inline-block !important;
}

.x-shield-threads-action-fallback {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 4px 0 !important;
  margin-top: 4px !important;
  width: 100% !important;
}

/* Floating Toast Notification */
.x-shield-page-toast {
  position: fixed !important;
  bottom: 24px !important;
  left: 24px !important;
  background: #18181b !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #f4f4f5 !important;
  padding: 8px 14px !important;
  border-radius: 8px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
  z-index: 9999999 !important;
  pointer-events: none !important;
  animation: x-shield-toast-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

@keyframes x-shield-toast-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.x-shield-page-toast svg {
  width: 14px !important;
  height: 14px !important;
  color: #38bdf8 !important;
  flex-shrink: 0 !important;
}

/* Realtime Live Scanner Dock & HUD */
.x-shield-scanner-dock {
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 999998 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}

.x-shield-scanner-dock .scanner-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 7px !important;
  padding: 7px 14px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #f4f4f5 !important;
  background: rgba(9, 9, 11, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 9999px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  outline: none !important;
}

.x-shield-scanner-dock .scanner-btn:hover {
  background: #18181b !important;
  border-color: #f59e0b !important;
  color: #fbbf24 !important;
  transform: translateY(-1px) !important;
}

.x-shield-scanner-dock .scanner-btn svg {
  width: 14px !important;
  height: 14px !important;
}

.x-shield-scanner-dock .scanner-live-hud {
  display: inline-flex !important;
  align-items: center !important;
  gap: 9px !important;
  padding: 6px 14px !important;
  background: rgba(9, 9, 11, 0.94) !important;
  border: 1px solid #f59e0b !important;
  border-radius: 9999px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.18) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #f4f4f5 !important;
}

.x-shield-scanner-dock .btn-scanner-stop {
  padding: 3px 8px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #fca5a5 !important;
  background: rgba(239, 68, 68, 0.18) !important;
  border: 1px solid rgba(239, 68, 68, 0.35) !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  margin-left: 4px !important;
}

.x-shield-scanner-dock .btn-scanner-stop:hover {
  background: rgba(239, 68, 68, 0.32) !important;
  color: #ffffff !important;
}

.x-shield-scanner-dock .hud-pulse {
  width: 7px !important;
  height: 7px !important;
  border-radius: 50% !important;
  background: #f59e0b !important;
  animation: x-pulse-dot 1s infinite alternate !important;
}

@keyframes x-pulse-dot {
  from { transform: scale(0.8); opacity: 0.5; }
  to { transform: scale(1.3); opacity: 1; }
}
  `;

  if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(css);
  } else {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  const CACHE_KEY = `social_shield_userjs_cache_v4_${getPlatform()}`;
  const textCache = new Map();
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => textCache.set(k, v));
    }
  } catch (e) {}

  function saveCache() {
    try {
      const obj = {};
      const entries = Array.from(textCache.entries()).slice(-300);
      entries.forEach(([k, v]) => (obj[k] = v));
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  const countedTexts = new Set();

  const REVEALED_KEY = `social_shield_revealed_v1_${getPlatform()}`;
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
      instruction: 'exaggerated financial hype, crypto shill, urgency to buy, get-rich-quick, fear of missing out.',
      badge: {
        text: '⚡ FOMO / Hype',
        desc: 'Sensationalized hype, crypto shill, or fear of missing out (Thổi phồng, lùa gà fomo)',
        bg: 'rgba(234, 179, 8, 0.18)',
        border: '#eab308',
        color: '#fde047',
      },
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

  let hideFloatingPill = false;
  try {
    hideFloatingPill = localStorage.getItem('social_shield_hide_pill') === 'true';
  } catch (e) {}

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
  pillClose.title = 'Ẩn thanh trạng thái (bật lại trong cài đặt)';
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
    <div style="font-size:9.5px;color:#71717a;text-align:center;margin-top:2px;">Nhấn đúp vào thanh để Bật/Tắt chế độ bảo vệ</div>
  `;

  pill.appendChild(radarDot);
  pill.appendChild(pillPlatform);
  pill.appendChild(pillBadgeCount);
  pill.appendChild(pillToggle);
  pill.appendChild(pillClose);
  pill.appendChild(flyout);

  // Fast capture phase listener on document ensures clicks/taps on close button are never swallowed
  const handlePillClose = (e) => {
    const target = e.target;
    if (target && (target.classList?.contains('x-jev-pill-close') || target.closest?.('.x-jev-pill-close'))) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      hideFloatingPill = true;
      document.body?.classList.add('x-jev-hide-pill');
      try { localStorage.setItem('social_shield_hide_pill', 'true'); } catch (err) {}
      initPill();
    }
  };
  document.addEventListener('pointerdown', handlePillClose, { capture: true, passive: false });
  document.addEventListener('click', handlePillClose, { capture: true, passive: false });

  function initPill() {
    if (hideFloatingPill) {
      document.body?.classList.add('x-jev-hide-pill');
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

    document.body?.classList.remove('x-jev-hide-pill');
    pill.removeAttribute('data-hidden');
    pill.classList.remove('x-jev-pill-hidden');
    pill.style.setProperty('display', 'flex', 'important');
    if (document.body && !document.contains(pill)) {
      document.body.appendChild(pill);
    }
  }

  function updatePill() {
    if (hideFloatingPill) {
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

    const allOn = CONFIG.monkModeEnabled || CONFIG.autoBlurRageEnabled || CONFIG.blockScamsEnabled || CONFIG.collapseSeedingEnabled;
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
    const allOn = CONFIG.monkModeEnabled || CONFIG.autoBlurRageEnabled || CONFIG.blockScamsEnabled || CONFIG.collapseSeedingEnabled;
    CONFIG.monkModeEnabled = !allOn;
    CONFIG.autoBlurRageEnabled = !allOn;
    CONFIG.blockScamsEnabled = !allOn;
    CONFIG.collapseSeedingEnabled = !allOn;
    updatePill();
    applyStateToDOM();
    scanFeed();
  });

  if (document.body) {
    initPill();
  } else {
    document.addEventListener('DOMContentLoaded', initPill);
  }

  function applyStateToDOM() {
    if (document.body) {
      document.body.classList.toggle('x-jev-no-rage-blur', !CONFIG.autoBlurRageEnabled);
      document.body.classList.toggle('x-jev-no-monk-blur', !CONFIG.monkModeEnabled);
      document.body.classList.toggle('x-jev-no-scam-blur', !CONFIG.blockScamsEnabled);
      document.body.classList.toggle('x-jev-hide-pill', !!hideFloatingPill);
      document.body.classList.toggle('x-jev-no-focus', !CONFIG.focusModeEnabled);
      const disableAll = !CONFIG.autoBlurRageEnabled && !CONFIG.monkModeEnabled && !CONFIG.blockScamsEnabled;
      document.body.classList.toggle('x-jev-disable-all-blur', disableAll);
    }

    // 0. Facebook Reels & Video Popups State
    document.querySelectorAll('[data-monk-reels-blocked="true"]').forEach((dialog) => {
      const overlay = dialog.querySelector('.x-monk-reels-overlay');
      if (CONFIG.monkModeEnabled || CONFIG.blockReelsEnabled) {
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
      if (CONFIG.monkModeEnabled || CONFIG.blockReelsEnabled) {
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
      if (CONFIG.monkModeEnabled) {
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
      if (CONFIG.autoBlurRageEnabled) {
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
      if (CONFIG.blockScamsEnabled) {
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

    // 7. Focus Feed Mode: Re-evaluate state on all classified posts
    let currentFocusCount = 0;
    document.querySelectorAll('[data-jev-assigned-label]').forEach((post) => {
      const assignedLabel = post.getAttribute('data-jev-assigned-label');
      const matchesFocus = isPostMatchingFocus(assignedLabel);
      const bar = post.querySelector('.x-jev-focus-bar');
      const textEl = post.querySelector('[data-jev-tracked-text="true"]') || post.querySelector('span[dir="auto"], div[dir="auto"]');

      if (CONFIG.focusModeEnabled && !matchesFocus) {
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

    if (CONFIG.focusModeEnabled) {
      focusCollapsedCount = currentFocusCount;
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
    if (Array.isArray(CONFIG.customLabels)) {
      const isCustom = CONFIG.customLabels.some(
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
    if (!CONFIG.focusModeEnabled) return true;
    const allowedTags = Array.isArray(CONFIG.focusWhitelistTags) ? CONFIG.focusWhitelistTags : [];
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
    if (CONFIG.focusModeEnabled && !isPostMatchingFocus(labels)) {
      postEl.setAttribute('data-jev-focus-offtag', 'true');
      textEl.classList.add('x-jev-focus-collapsed-content');
      postEl.querySelectorAll('img, video, .x-jev-badge, .x-jev-badge-container, .x-jev-warning-box, .x-jev-scam-box, .x-monk-warning-box, .x-jev-seeding-collapsed').forEach((m) => {
        if (!m.closest('a[href*="/@"]')) m.classList.add('x-jev-focus-collapsed-content');
      });
      createFocusBar(postEl, textEl, labels);
      focusCollapsedCount++;
      updatePill();
    }
  }

  function checkAndApplyMonkMode(postEl, text) {
    if (!CONFIG.monkModeEnabled) return false;
    if (postEl.hasAttribute('data-monk-blocked')) return true;

    const mediaList = postEl.querySelectorAll('img, video');
    if (mediaList.length === 0) return false;

    let hasWomenMedia = false;
    let detectedReason = '';

    mediaList.forEach((media) => {
      const isAvatar = (media.closest('a[href*="/@"]') && (media.width < 50 || media.height < 50)) ||
                       media.alt?.toLowerCase().includes('avatar') ||
                       media.alt?.toLowerCase().includes('profile');
      if (isAvatar) return;

      const altText = (media.alt || '') + ' ' + (media.getAttribute('aria-label') || '') + ' ' + (media.title || '');
      if (WOMEN_OR_GOONBAIT_REGEX.test(altText)) {
        hasWomenMedia = true;
        detectedReason = 'Ảnh/Video phụ nữ (Meta AI Alt-Tag)';
      }
    });

    if (!hasWomenMedia && WOMEN_OR_GOONBAIT_REGEX.test(text)) {
      hasWomenMedia = true;
      detectedReason = 'Goon-baiting / Thirst trap';
    }

    if (hasWomenMedia) {
      postEl.setAttribute('data-monk-blocked', 'true');
      monkModeBlockedCount++;
      updatePill();

      if (!postEl.querySelector('.x-monk-warning-box')) {
        const box = document.createElement('div');
        box.className = 'x-monk-warning-box';
        box.innerHTML = `
          <div>
            <b>🧘 Monk Mode: Đã che ảnh/video để giữ tập trung tuyệt đối.</b>
            <div style="font-size:10.5px;opacity:0.9;">${detectedReason}</div>
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
            btn.innerHTML = `${ICONS.scan} <span>Ẩn lại</span>`;
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

  function callJevBatch(inputs) {
    return new Promise((resolve) => {
      const taxonomy = getActiveTaxonomy(CONFIG);
      if (!taxonomy.labels || taxonomy.labels.length <= 1) {
        resolve(inputs.map(() => ({ label: CATCH_ALL_LABEL, confidence: 1 })));
        return;
      }

      const sendReq =
        typeof GM_xmlhttpRequest !== 'undefined'
          ? GM_xmlhttpRequest
          : function (opts) {
              fetch(opts.url, {
                method: opts.method,
                headers: opts.headers,
                body: opts.data,
              })
                .then((r) => r.json())
                .then((d) => opts.onload({ responseText: JSON.stringify(d) }))
                .catch((e) => opts.onerror(e));
            };

      sendReq({
        method: 'POST',
        url: CONFIG.apiEndpoint,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'social-shield-userjs/2.1',
        },
        data: JSON.stringify({
          labels: taxonomy.labels,
          inputs: inputs,
          instructions: taxonomy.instructions,
          multi: true,
          max_labels: 5,
        }),
        onload: function (res) {
          try {
            const data = JSON.parse(res.responseText);
            resolve(data.results || []);
          } catch (e) {
            resolve([]);
          }
        },
        onerror: function () {
          resolve([]);
        },
      });
    });
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

  function renderClassification(item, res) {
    const { postEl, textEl } = item;
    if (!textEl || !textEl.parentElement) return;

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

    // 1. SCAM
    const rawScam = scores['scam / fraudulent scheme'];
    const scamScore = typeof rawScam === 'number' && Number.isFinite(rawScam) ? rawScam : 0;
    if (scamScore >= CONFIG.confidenceThreshold) {
      postEl.setAttribute('data-jev-handled', 'true');
      postEl.setAttribute('data-jev-scam', 'true');
      blockedScamCount++;
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
      } else if (CONFIG.blockScamsEnabled) {
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

    // 2. RAGE BAIT / TOXIC NEGATIVITY
    const rawRage =
      scores['rage bait / toxic / hostile / dismissive negativity'] || scores['rage bait / outrage'];
    const rageScore = typeof rawRage === 'number' && Number.isFinite(rawRage) ? rawRage : 0;
    if (rageScore >= CONFIG.confidenceThreshold) {
      postEl.setAttribute('data-jev-handled', 'true');
      postEl.setAttribute('data-jev-rage', 'true');
      blockedRageCount++;
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
      postEl.querySelectorAll('a').forEach((m) => {
        if (!isProfileOnlyLink(m)) m.setAttribute('data-jev-blur-item', 'true');
      });

      if (!postEl.querySelector('.x-jev-warning-box')) {
        const warning = document.createElement('div');
        warning.className = 'x-jev-warning-box';
        const pct = Math.round(rageScore * 100);
        warning.innerHTML = `
          <div class="x-jev-warning-text">
            ${ICONS.flame}
            <div>
              <b>Đã che nội dung Toxic / Rage-bait (${pct}%):</b>
              <div style="font-size:11px;font-weight:400;opacity:0.85;margin-top:2px;">Nội dung có thể gây khó chịu, bực tức hoặc kích động tranh cãi.</div>
            </div>
          </div>
        `;

        const btn = document.createElement('button');
        btn.className = 'x-jev-reveal-btn';
        btn.innerHTML = `${ICONS.scan} <span>Hiện nội dung</span>`;
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
            btn.textContent = 'Hiện nội dung';
          }
        };

        warning.appendChild(btn);
        parentContainer.insertBefore(warning, textEl);
      }

      const isRageRevealedByUser = revealedTexts.has(item.text);
      if (isRageRevealedByUser) {
        postEl.classList.add('x-jev-revealed');
        postEl.setAttribute('data-jev-revealed', 'true');
        postEl.setAttribute('data-user-revealed', 'true');
        applyInlineUnblur(postEl, true);
        const rBtn = postEl.querySelector('.x-jev-warning-box .x-jev-reveal-btn');
        if (rBtn) rBtn.textContent = 'Ẩn lại';
      } else if (CONFIG.autoBlurRageEnabled) {
        postEl.classList.remove('x-jev-revealed');
        postEl.removeAttribute('data-jev-revealed');
        postEl.removeAttribute('data-user-revealed');
        applyInlineUnblur(postEl, false);
        const rBtn = postEl.querySelector('.x-jev-warning-box .x-jev-reveal-btn');
        if (rBtn) rBtn.textContent = 'Hiện nội dung';
      } else {
        postEl.classList.add('x-jev-revealed');
        postEl.setAttribute('data-jev-revealed', 'true');
        applyInlineUnblur(postEl, true);
      }
      checkAndApplyFocusCollapse(postEl, textEl, 'rage bait / toxic / hostile / dismissive negativity');
      return;
    }

    // 3. BOT SEEDING / AFFILIATE SPAM
    const rawSeeding =
      scores['bot seeding / affiliate spam / fake review'] || scores['bot seeding / affiliate spam'];
    const seedingScore = typeof rawSeeding === 'number' && Number.isFinite(rawSeeding) ? rawSeeding : 0;
    if (seedingScore >= CONFIG.confidenceThreshold) {
      postEl.setAttribute('data-jev-handled', 'true');
      postEl.setAttribute('data-jev-seeding', 'true');
      cleanedSeedingCount++;
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
        if (CONFIG.collapseSeedingEnabled) {
          textEl.classList.add('x-jev-collapsed-body');
        }
      }
      checkAndApplyFocusCollapse(postEl, textEl, 'bot seeding / affiliate spam / fake review');
      return;
    }

    // 4. MULTI-TAG CONTENT BADGES
    const isActivity = window.location.pathname.includes('/activity');
    const eligibleBadges = [];

    Object.entries(scores).forEach(([candidateLabel, score]) => {
      if (typeof score !== 'number' || !Number.isFinite(score) || score < CONFIG.confidenceThreshold) return;
      if (
        candidateLabel === 'scam / fraudulent scheme' ||
        candidateLabel === 'rage bait / toxic / hostile / dismissive negativity' ||
        candidateLabel === 'rage bait / outrage' ||
        candidateLabel === 'bot seeding / affiliate spam / fake review' ||
        candidateLabel === 'bot seeding / affiliate spam'
      ) {
        return;
      }
      if (candidateLabel === 'other / casual discussion' && (CONFIG.filterCasualEnabled === false || isActivity)) {
        return;
      }

      const def = TAXONOMY_CATALOG[candidateLabel];
      if (def && CONFIG[def.configKey] === false) {
        return;
      }

      let isCustom = false;
      let customMeta = null;
      if (Array.isArray(CONFIG.customLabels)) {
        const customFound = CONFIG.customLabels.find(
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

    eligibleBadges.sort((a, b) => b.score - a.score);
    const selectedBadges = eligibleBadges.slice(0, 4);

    if (selectedBadges.length > 0) {
      if (!countedTexts.has(item.text)) {
        countedTexts.add(item.text);
        postEl.setAttribute('data-jev-counted', 'true');
        selectedBadges.forEach(({ label, isCustom }) => {
          if (label === 'self-improvement / motivational') motivationalCount++;
          else if (label === 'meme / humor / satire') memeCount++;
          else if (label === 'deep dive / technical breakdown / industry insider') deepDiveCount++;
          else if (label === 'wholesome / positive') wholesomeCount++;
          else if (label === 'fearmongering / doom') doomCount++;
          else if (label === 'fomo / hype') fomoCount++;
          else if (label === 'other / casual discussion') casualCount++;
          else if (isCustom) customCount++;
        });
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

    const taxonomy = getActiveTaxonomy(CONFIG);
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
        saveCache();
      } else {
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

  // --- FACEBOOK REELS & POPUP SCANNER ---
  function scanFacebookReels() {
    if (getPlatform() !== 'facebook') return;
    if (!CONFIG.monkModeEnabled) return;

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
    if (!CONFIG.monkModeEnabled && !CONFIG.blockReelsEnabled) return;

    if (window.location.pathname.includes('/reel')) {
      const mainEl = document.querySelector('main[role="main"]') || document.body;
      const videos = mainEl.querySelectorAll('video');
      if (videos.length > 0) {
        mainEl.setAttribute('data-monk-reels-blocked', 'true');
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

    const dialogs = document.querySelectorAll('div[role="dialog"]');
    dialogs.forEach((dialog) => {
      const hasReel = dialog.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
                      window.location.pathname.includes('/reel') ||
                      dialog.querySelector('video');
      const videos = dialog.querySelectorAll('video');
      if (hasReel && videos.length > 0) {
        if (!dialog.hasAttribute('data-monk-reels-blocked')) {
          dialog.setAttribute('data-monk-reels-blocked', 'true');
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

    document.querySelectorAll('article:not([data-monk-reels-handled])').forEach((article) => {
      const hasReel = article.querySelector('a[href*="/reel/"], a[href*="/reels/"]');
      const videos = article.querySelectorAll('video');
      if (hasReel && videos.length > 0) {
        article.setAttribute('data-monk-reels-handled', 'true');
        article.setAttribute('data-monk-reels-blocked', 'true');

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
    if (!CONFIG.monkModeEnabled && !CONFIG.blockReelsEnabled) return;

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

    const shelves = document.querySelectorAll(
      'ytd-rich-shelf-renderer[is-shorts]:not([data-monk-tray-handled]), ytd-reel-shelf-renderer:not([data-monk-tray-handled]), ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]):not([data-monk-tray-handled])'
    );

    shelves.forEach((shelf) => {
      shelf.setAttribute('data-monk-tray-handled', 'true');
      shelf.setAttribute('data-monk-tray-blocked', 'true');

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

  // --- Followers & Post Cache (Userscript Interceptor) ---
  const authorFollowerCache = new Map();
  const tweetDataCache = new Map();

  try {
    const saved = sessionStorage.getItem('social_shield_fols_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
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

  // Network Interceptor for Userscript (Threads & X GraphQL)
  (function initUserscriptInterceptor() {
    try {
      const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
      if (win.__socialShieldUserscriptIntercepted) return;
      win.__socialShieldUserscriptIntercepted = true;

      function extractUserData(obj) {
        if (!obj || typeof obj !== 'object') return;
        const u = obj.user || obj.author || (obj.__typename === 'User' ? obj : null);
        const targetUser = u || (obj.username ? obj : null);
        if (targetUser && (targetUser.username || targetUser.pk || targetUser.id)) {
          const username = targetUser.username || targetUser.screen_name;
          let fCount = typeof targetUser.follower_count === 'number' ? targetUser.follower_count :
                       (typeof targetUser.followers_count === 'number' ? targetUser.followers_count :
                       (targetUser.edge_followed_by?.count));
          if (username && typeof fCount === 'number') {
            authorFollowerCache.set(username.toLowerCase().replace('@', ''), fCount);
            saveFollowersCache();
          }
        }
        if (obj.legacy && typeof obj.legacy.followers_count === 'number') {
          const handle = obj.legacy.screen_name;
          if (handle) {
            authorFollowerCache.set(handle.toLowerCase().replace('@', ''), obj.legacy.followers_count);
            saveFollowersCache();
          }
        }
        if ((obj.code || obj.pk || obj.id) && (typeof obj.like_count === 'number' || typeof obj.reply_count === 'number')) {
          const code = String(obj.code || obj.pk || obj.id);
          const isRepost = !!(obj.reshared_post || obj.repost || obj.is_reshare || (obj.reshare_count && obj.is_repost));
          tweetDataCache.set(code, {
            likes: obj.like_count || 0,
            replies: obj.reply_count || 0,
            retweets: obj.reshare_count || 0,
            viewsCount: obj.view_count || obj.impression_count || 0,
            isRepost: isRepost,
            isRetweet: isRepost
          });
        }
        if (obj.__typename === 'Tweet' || (obj.legacy && obj.rest_id)) {
          const restId = String(obj.rest_id || obj.id || '');
          const isRetweet = !!(obj.legacy?.retweeted_status_result || obj.legacy?.retweeted_status_id_str || obj.retweeted_status_result);
          if (restId) {
            tweetDataCache.set(restId, {
              isRetweet: isRetweet,
              isRepost: isRetweet,
              likes: obj.legacy?.favorite_count || 0,
              viewsCount: obj.views?.count ? parseInt(obj.views.count, 10) || 0 : 0
            });
          }
        }
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) extractUserData(obj[i]);
        } else {
          const keys = Object.keys(obj);
          for (let i = 0; i < keys.length; i++) {
            if (keys[i] === '__reactFiber' || keys[i] === '__reactProps') continue;
            extractUserData(obj[keys[i]]);
          }
        }
      }

      function isApiUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const l = url.toLowerCase();
        return l.includes('graphql') || l.includes('threads.net') || l.includes('threads.com') || l.includes('x.com') || l.includes('twitter.com');
      }

      const origFetch = win.fetch;
      win.fetch = async function (...args) {
        const res = await origFetch.apply(this, args);
        try {
          const u = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          if (isApiUrl(u)) {
            res.clone().json().then(extractUserData).catch(() => {});
          }
        } catch (e) {}
        return res;
      };
    } catch (e) {}
  })();

  function parseMetricNumber(raw) {
    if (!raw) return 0;
    const clean = raw.toString().trim().toLowerCase().replace(/,/g, '.');
    const match = clean.match(/^([\d\.]+)\s*(k|m|b|n|tr|tỷ)?$/i);
    if (!match) return 0;
    let num = parseFloat(match[1]) || 0;
    const unit = (match[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'n') num *= 1000;
    else if (unit === 'm' || unit === 'tr') num *= 1000000;
    else if (unit === 'b' || unit === 'tỷ') num *= 1000000000;
    return Math.round(num);
  }

  function formatMetricNumber(num) {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return Number(num).toLocaleString('vi-VN');
  }

  function extractTweetHook(fullText) {
    if (!fullText) return '';
    const clean = fullText.trim();
    const doubleBreak = clean.indexOf('\n\n');
    if (doubleBreak > 10) {
      const p1 = clean.slice(0, doubleBreak).trim();
      if (p1.length <= 45 && clean.length > doubleBreak + 2) {
        const p2Start = doubleBreak + 2;
        const nextBreak = clean.indexOf('\n\n', p2Start);
        return (p1 + ' ' + (nextBreak !== -1 ? clean.slice(p2Start, nextBreak) : clean.slice(p2Start))).slice(0, 280).trim();
      }
      return p1.slice(0, 280);
    }
    const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2 && lines[0].length < 60) {
      return (lines[0] + ' ' + lines[1]).slice(0, 280);
    }
    const matchSentence = clean.match(/^.*?[.?!](\s|$)/);
    if (matchSentence && matchSentence[0].length >= 20) {
      return matchSentence[0].trim();
    }
    return clean.slice(0, 160).trim();
  }

  function classifyHookFormula(text) {
    const lower = text.toLowerCase();
    if (/\b(unpopular opinion|stop doing|most people are wrong|nobody wants to hear|truth is|sai lầm|ngừng ngay|sự thật mất lòng)\b/i.test(lower)) {
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

  function getPostAgeHours(postEl) {
    const timeEl = postEl.querySelector('time');
    if (timeEl) {
      const datetime = timeEl.getAttribute('datetime');
      if (datetime) {
        const diffMs = Date.now() - new Date(datetime).getTime();
        if (!isNaN(diffMs) && diffMs >= 0) return diffMs / (1000 * 60 * 60);
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
    const maxAge = CONFIG.outlierMaxAgeHours || 48;
    const isRecent = ageHours <= maxAge;
    const cleanHandle = (authorHandle || '').toLowerCase().replace('@', '');
    const followers = authorFollowerCache.get(cleanHandle) || 0;

    if (!isRecent) {
      return { isOutlier: false, multiplier: 0, followers, reach: platform === 'x' ? metrics.views : metrics.likes, ageHours, reason: 'too_old' };
    }

    if (platform === 'x') {
      const views = metrics.views || 0;
      const minViews = CONFIG.outlierMinViews || 3000;
      const minMultiplier = CONFIG.outlierMinMultiplier || 3.0;

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
      const minMultiplier = CONFIG.outlierThreadsMinMultiplier || 2.0;

      if (views > 0) {
        const minViews = CONFIG.outlierThreadsMinViews || 2000;
        if (followers > 0) {
          const multiplier = views / followers;
          const isOutlier = multiplier >= minMultiplier && views >= minViews;
          return { isOutlier, multiplier, followers, reach: views, ageHours };
        }
        const isOutlierFallback = views >= 10000;
        return { isOutlier: isOutlierFallback, multiplier: 0, followers: 0, reach: views, ageHours, isEstimated: true };
      }

      const minLikes = CONFIG.outlierThreadsMinLikes || 150;
      if (followers > 0) {
        const multiplier = (likes * 15) / followers;
        const isOutlier = multiplier >= minMultiplier && likes >= minLikes;
        return { isOutlier, multiplier, followers, reach: likes, ageHours };
      }

      const isOutlierFallback = likes >= 250;
      return { isOutlier: isOutlierFallback, multiplier: 0, followers: 0, reach: likes, ageHours, isEstimated: true };
    }
  }

  function saveHookToVaultUserscript(itemToSave, hookBtn, confidence) {
    try {
      const raw = localStorage.getItem('x_hook_vault_v1');
      let vault = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(vault)) vault = [];
      vault = vault.filter((item) => item.id !== itemToSave.id);
      vault.unshift(itemToSave);
      localStorage.setItem('x_hook_vault_v1', JSON.stringify(vault));
      hookBtn.classList.add('is-saved');
      hookBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> <span>Saved!</span>`;
      showShieldToast(`✓ Đã lưu Hook Outlier của ${itemToSave.authorHandle || itemToSave.authorName || 'bài viết'} vào Vault!`);
    } catch (e) {
      hookBtn.classList.add('is-saved');
      hookBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> <span>Saved!</span>`;
      showShieldToast('✓ Đã lưu Hook vào Vault!');
    }
  }

  // --- Threads Hook & Outlier Engine ---
  function extractThreadsMetrics(postEl) {
    let likes = 0;
    let replies = 0;
    let reposts = 0;
    let views = 0;

    if (isHeaderOrNavigation(postEl)) {
      return { views: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0 };
    }

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

    const candidates = postEl.querySelectorAll('span[dir="auto"], a[href*="/post/"], a[href*="/t/"], div[dir="auto"]');
    candidates.forEach((el) => {
      const t = (el.innerText || '').trim();
      if (!t) return;
      const likeMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:likes?|lượt thích)/i);
      if (likeMatch) likes = Math.max(likes, parseMetricNumber(`${likeMatch[1]} ${likeMatch[2] || ''}`));
      const replyMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:replies?|câu trả lời|bình luận)/i);
      if (replyMatch) replies = Math.max(replies, parseMetricNumber(`${replyMatch[1]} ${replyMatch[2] || ''}`));
      const repostMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:reposts?|lượt đăng lại)/i);
      if (repostMatch) reposts = Math.max(reposts, parseMetricNumber(`${repostMatch[1]} ${repostMatch[2] || ''}`));
      const viewMatch = t.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(?:views?|lượt xem)/i);
      if (viewMatch) views = Math.max(views, parseMetricNumber(`${viewMatch[1]} ${viewMatch[2] || ''}`));
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
      authorHandle = match ? '@' + match[1] : raw.replace('/', '');
      const nameSpan = handleLink.querySelector('span') || postEl.querySelector('span[dir="auto"]');
      authorName = nameSpan ? nameSpan.innerText.trim() : authorHandle;
    }

    const avatarImg = postEl.querySelector('img[alt*="ảnh đại diện"], img[alt*="profile"], img[src*="cdninstagram.com"], img[src*="threads.net"]');
    if (avatarImg) authorAvatar = avatarImg.src || '';

    const postLink = postEl.querySelector('a[href*="/post/"], a[href*="/t/"]');
    if (postLink && postLink.href) permalink = postLink.href;

    return { authorName: authorName || 'Threads Creator', authorHandle, authorAvatar, permalink };
  }

  function findThreadsActionBar(postEl) {
    if (!postEl) return null;

    const actionButtons = Array.from(postEl.querySelectorAll('div[role="button"], button')).filter((btn) => {
      if (btn.closest('video') || btn.querySelector('video')) return false;
      if (btn.closest('a[href*="/@"]') || btn.querySelector('a[href*="/@"]')) return false;
      if (btn.closest('time') || btn.querySelector('time')) return false;

      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (label.includes('more') || label.includes('thêm') || label.includes('menu') || label.includes('tùy chọn')) return false;
      if (label.includes('follow') || label.includes('theo dõi')) return false;

      return !!btn.querySelector('svg');
    });

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
            if (svgs.length >= 2 && svgs.length <= 8) return curr;
          }
          curr = curr.parentElement;
        }
      }
    }

    for (const btn of actionButtons) {
      let curr = btn.parentElement;
      for (let depth = 0; depth < 4; depth++) {
        if (!curr || curr === postEl || curr === document.body) break;
        if (!curr.querySelector('a[href*="/@"]') && !curr.querySelector('time')) {
          const svgs = curr.querySelectorAll('svg');
          const textLen = (curr.innerText || '').trim().length;
          if (svgs.length >= 3 && svgs.length <= 8 && textLen < 80) return curr;
        }
        curr = curr.parentElement;
      }
    }

    return null;
  }

  function processThreadsHookAndViral(post, fullText, contentEl) {
    if (!CONFIG.viralDetectionEnabled && !CONFIG.outlierDetectionEnabled) return;
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

    const isViral = !!(CONFIG.viralDetectionEnabled && (metrics.likes >= 500 || metrics.replies >= 50));

    if (outlier.isOutlier || isViral) {
      post.classList.add('x-shield-outlier-post', 'is-threads');
      if (isViral && !outlier.isOutlier) {
        post.classList.add('x-shield-threads-viral');
      }
      let badge = post.querySelector('.x-shield-outlier-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'x-shield-outlier-badge is-threads';
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

    if (!actionBar) return;

    const hookBtn = document.createElement('button');
    hookBtn.type = 'button';
    hookBtn.className = 'x-shield-threads-hook-btn';
    hookBtn.setAttribute('title', 'Lưu Hook Outlier này vào Vault để học hỏi & phân tích');
    hookBtn.innerHTML = `${ICONS.zap}<span>Save Hook</span>`;

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
        postAgeHours: Math.round(outlier.ageHours),
        hook: hookText,
        fullText: fullText,
        metrics: metrics,
        formula: formula,
        url: authorInfo.permalink,
        savedAt: new Date().toISOString(),
      };

      saveHookToVaultUserscript(itemToSave, hookBtn);
    });

    actionBar.appendChild(hookBtn);
  }

  // --- X (Twitter) Hook & Outlier Engine ---
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

  function extractXTweetMetrics(post) {
    let views = 0, likes = 0, retweets = 0, replies = 0, bookmarks = 0;
    const analyticsLink = post.querySelector('a[href*="/analytics"]');
    if (analyticsLink) views = parseMetricNumber(analyticsLink.innerText || analyticsLink.getAttribute('aria-label') || '');
    const likeBtn = post.querySelector('button[data-testid="like"], button[data-testid="unlike"]');
    if (likeBtn) likes = parseMetricNumber(likeBtn.innerText || likeBtn.getAttribute('aria-label') || '');
    const retweetBtn = post.querySelector('button[data-testid="retweet"]');
    if (retweetBtn) retweets = parseMetricNumber(retweetBtn.innerText || retweetBtn.getAttribute('aria-label') || '');
    const replyBtn = post.querySelector('button[data-testid="reply"]');
    if (replyBtn) replies = parseMetricNumber(replyBtn.innerText || replyBtn.getAttribute('aria-label') || '');
    const bookmarkBtn = post.querySelector('button[data-testid="bookmark"]');
    if (bookmarkBtn) bookmarks = parseMetricNumber(bookmarkBtn.innerText || bookmarkBtn.getAttribute('aria-label') || '');
    return { views, likes, retweets, replies, bookmarks };
  }

  function findXTweetActionBar(post) {
    const likeBtn = post.querySelector('button[data-testid="like"], button[data-testid="unlike"]');
    if (!likeBtn) return null;
    let curr = likeBtn.parentElement;
    for (let i = 0; i < 4; i++) {
      if (!curr) break;
      if (curr.getAttribute('role') === 'group' || curr.querySelectorAll('button').length >= 3) return curr;
      curr = curr.parentElement;
    }
    return likeBtn.closest('[role="group"]') || likeBtn.parentElement;
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
    if (!CONFIG.viralDetectionEnabled && !CONFIG.outlierDetectionEnabled) return;
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

    const metrics = extractXTweetMetrics(post);
    const author = extractXTweetAuthor(post);
    const outlier = evaluateOutlierStatus(metrics, author.authorHandle, post, 'x');

    if (outlier.isOutlier) {
      post.classList.add('x-shield-outlier-post');
      let badge = post.querySelector('.x-shield-outlier-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'x-shield-outlier-badge';
        const tweetTextEl = post.querySelector('div[data-testid="tweetText"]');
        if (tweetTextEl && tweetTextEl.parentElement) tweetTextEl.parentElement.insertBefore(badge, tweetTextEl);
      }
      const multStr = outlier.multiplier > 0 ? `${outlier.multiplier.toFixed(1)}x Outlier` : 'Breakout Outlier';
      const folsStr = outlier.followers > 0 ? `${formatMetricNumber(outlier.followers)} fols → ` : '';
      const reachStr = `${formatMetricNumber(metrics.views)} views`;
      const timeStr = outlier.ageHours < 1 ? '<1h trước' : `${Math.round(outlier.ageHours)}h trước`;
      badge.innerHTML = `<span class="outlier-fire">🔥</span> <span class="outlier-mult">${multStr}</span> <span class="outlier-sep">•</span> <span class="outlier-stats">${folsStr}${reachStr}</span> <span class="outlier-sep">•</span> <span class="outlier-time">${timeStr}</span>`;
    } else {
      post.classList.remove('x-shield-outlier-post', 'x-shield-viral-post');
      const oldBadge = post.querySelector('.x-shield-outlier-badge, .x-shield-viral-badge');
      if (oldBadge) oldBadge.remove();
    }

    if (post.querySelector('.x-shield-hook-btn')) return;
    const group = findXTweetActionBar(post);
    if (!group) return;

    const hookBtn = document.createElement('button');
    hookBtn.type = 'button';
    hookBtn.className = 'x-shield-hook-btn';
    hookBtn.setAttribute('title', 'Lưu Hook Outlier này vào Vault để học hỏi & phân tích');
    hookBtn.innerHTML = `${ICONS.zap} <span>Save Hook</span>`;

    hookBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (hookBtn.classList.contains('is-saved')) return;

      const hookText = extractTweetHook(fullText);
      const permalinkEl = post.querySelector('a[href*="/status/"]');
      const tweetIdMatch = permalinkEl ? permalinkEl.href.match(/status\/(\d+)/) : null;
      const tweetId = tweetIdMatch ? tweetIdMatch[1] : 'x-' + Date.now();

      const baseItem = {
        id: tweetId,
        platform: 'x',
        authorName: author.authorName,
        authorHandle: author.authorHandle,
        authorAvatar: author.authorAvatar,
        authorFollowers: outlier.followers || 0,
        outlierMultiplier: outlier.multiplier || 0,
        postAgeHours: Math.round(outlier.ageHours),
        hook: hookText,
        fullText: fullText,
        metrics: metrics,
        formula: classifyHookFormula(hookText),
        jevConfidence: 0.88,
        jevLabel: 'Heuristic',
        url: permalinkEl ? permalinkEl.href : window.location.href,
        savedAt: new Date().toISOString(),
      };

      hookBtn.classList.remove('is-loading');
      saveHookToVaultUserscript(baseItem, hookBtn, 0.88);
    });

    group.appendChild(hookBtn);
  }

  // --- Real-time Live Scanner Engine ---
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

  function scanFeed() {
    // 0. Synchronize active taxonomy & restore bypassed elements
    const activeTaxonomy = getActiveTaxonomy(CONFIG);
    if (activeTaxonomy.labels && activeTaxonomy.labels.length > 1) {
      document.querySelectorAll('[data-jev-bypassed="true"]').forEach((post) => {
        post.removeAttribute('data-jev-bypassed');
        post.removeAttribute('data-jev-scanned');
        post.removeAttribute('data-jev-cmt-scanned');
        post.removeAttribute('data-jev-handled');
      });
    }

    // Synchronize badge visibility
    document.querySelectorAll('.x-jev-badge').forEach((badge) => {
      const cat = badge.getAttribute('data-jev-badge-category');
      const def = TAXONOMY_CATALOG[cat];
      let isHidden = false;
      if ((def && CONFIG[def.configKey] === false) || (cat === 'other / casual discussion' && window.location.pathname.includes('/activity'))) {
        isHidden = true;
      } else if (Array.isArray(CONFIG.customLabels)) {
        const customFound = CONFIG.customLabels.find(
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
        if (container && !isHeaderOrNavigation(container)) postContainers.add(container);
      });

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

        if (cleanText && !isActivity) {
          processThreadsHookAndViral(post, cleanText, targetItem ? targetItem.el : null);
        }

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
      scanFacebookReels();
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
    } else if (platform === 'instagram') {
      scanInstagramReels();
    } else if (platform === 'youtube') {
      scanYouTubeShorts();
    } else if (platform === 'x') {
      document.querySelectorAll('article[data-testid="tweet"]').forEach((post) => {
        const textEl = post.querySelector('div[data-testid="tweetText"]');
        let text = textEl ? textEl.innerText.trim().replace(/\s*(Translate|Xem bản dịch)$/i, '').trim() : '';

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
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flushQueue, CONFIG.batchDebounceMs);
    }
  }

  const observer = new MutationObserver(() => scanFeed());
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    scanFeed();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
      scanFeed();
    });
  }

  // Safety interval for Facebook, Instagram, YouTube
  if (['facebook', 'instagram', 'youtube'].includes(getPlatform())) {
    setInterval(() => {
      if (CONFIG.monkModeEnabled || CONFIG.blockReelsEnabled) {
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

  // Safety heartbeat interval: keep pill alive & catch dynamic SPA updates
  setInterval(() => {
    initPill();
    initRealtimeScannerDock();
    scanFeed();
  }, 1500);

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      scanFeed();
    }
  }, 500);

  initRealtimeScannerDock();
})();
