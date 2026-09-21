// Background Service Worker for Social Anti-Ragebait
// Handles network requests to classifier.dev in extension background context,
// completely bypassing page Content Security Policy (CSP) on Threads, Facebook, and X.

const API_ENDPOINT = 'https://classifier.dev/';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Social Anti-Ragebait] Extension installed / updated.');
  // Set default confidence threshold in storage if not already set
  chrome.storage.local.get(['confidenceThreshold'], (res) => {
    if (typeof res.confidenceThreshold !== 'number') {
      chrome.storage.local.set({ confidenceThreshold: 0.30 });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CLASSIFY_BATCH') {
    const { inputs, labels, instructions } = request.payload || {};

    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      sendResponse({ success: true, results: [] });
      return false;
    }

    console.log(`[Anti-Ragebait Background] 📡 Đang gửi ${inputs.length} mẫu text lên Jev (classifier.dev)...`);

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labels: labels,
        inputs: inputs,
        instructions: instructions,
        multi: true,
        max_labels: 5,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Anti-Ragebait Background] Jev API HTTP Error ${response.status}:`, errText);
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(`[Anti-Ragebait Background] ✅ Jev đã trả về kết quả cho ${data.results?.length} items.`);
        sendResponse({ success: true, results: data.results || [] });
      })
      .catch((error) => {
        console.error('[Anti-Ragebait Background] Fetch error:', error);
        sendResponse({ success: false, error: error.message, results: [] });
      });

    // Return true to keep the message channel open for asynchronous sendResponse
    return true;
  }

  if (request.type === 'OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('dashboard.html');
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find((t) => t.url && t.url.startsWith(dashboardUrl));
      if (existingTab && existingTab.id) {
        chrome.tabs.update(existingTab.id, { active: true });
        if (existingTab.windowId) {
          chrome.windows.update(existingTab.windowId, { focused: true });
        }
        sendResponse({ success: true, tabId: existingTab.id });
      } else {
        chrome.tabs.create({ url: dashboardUrl }, (newTab) => {
          sendResponse({ success: true, tabId: newTab ? newTab.id : null });
        });
      }
    });
    return true;
  }

  if (request.type === 'ANALYZE_HOOK_JEV') {
    const { hookText, fullText } = request.payload || {};
    const textToAnalyze = (hookText || fullText || '').trim();

    if (!textToAnalyze) {
      sendResponse({ success: false, formula: 'other', confidence: 0.5 });
      return false;
    }

    const HOOK_LABELS = [
      'Curiosity Gap hook: creates intense mystery or withholds key information',
      'Contrarian / Hot Take hook: boldly challenges conventional wisdom or common belief',
      'Cheatsheet / Framework hook: curated list, tools, step-by-step blueprint, or bookmark-worthy tips',
      'Personal Story transformation hook: vulnerability, from zero to success, hard lessons learned',
      'Social Proof authority hook: big numbers, case study, expert credibility, or industry audit',
      'Direct Provocation challenge hook: tough wake-up call, sharp question, calling out audience inaction'
    ];

    const HOOK_INSTRUCTIONS =
      'Analyze the opening hook or message of this Threads post. Classify its primary hook formula, copywriting technique, and engagement mechanism into exactly one category.';

    console.log(`[Anti-Ragebait Background] 📡 Đang gửi Hook Threads lên Jev để phân tích: "${textToAnalyze.slice(0, 60)}..."`);

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labels: HOOK_LABELS,
        inputs: [textToAnalyze],
        instructions: HOOK_INSTRUCTIONS,
        multi: false,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Jev HTTP ${res.status}: ${errText}`);
        }
        return res.json();
      })
      .then((data) => {
        const item = data.results && data.results[0];
        let rawLabel = '';
        let score = 0.88;

        if (typeof item === 'string') {
          rawLabel = item;
        } else if (item && typeof item === 'object') {
          if (item.label) {
            rawLabel = item.label;
            score = typeof item.confidence === 'number' ? item.confidence : (typeof item.score === 'number' ? item.score : 0.88);
          } else if (Array.isArray(item.labels) && item.labels.length > 0) {
            rawLabel = item.labels[0];
            score = 0.90;
          }
        }

        let formula = 'other';
        const lower = rawLabel.toLowerCase();
        if (lower.includes('curiosity')) formula = 'curiosity';
        else if (lower.includes('contrarian')) formula = 'contrarian';
        else if (lower.includes('cheatsheet') || lower.includes('framework')) formula = 'cheatsheet';
        else if (lower.includes('story') || lower.includes('personal')) formula = 'story';
        else if (lower.includes('social proof') || lower.includes('authority')) formula = 'proof';
        else if (lower.includes('challenge') || lower.includes('provocation')) formula = 'challenge';

        console.log(`[Anti-Ragebait Background] ✅ Jev AI đã phân tích Hook Threads: "${formula}" (${Math.round(score * 100)}%)`);
        sendResponse({
          success: true,
          formula: formula,
          confidence: score,
          rawLabel: rawLabel,
        });
      })
      .catch((err) => {
        console.error('[Anti-Ragebait Background] Jev analyze hook error, falling back:', err);
        sendResponse({
          success: true,
          formula: 'curiosity',
          confidence: 0.75,
          rawLabel: 'Fallback heuristic',
          fallback: true,
        });
      });

    return true;
  }
});
