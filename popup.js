// Popup Controller for Viral Outlier & Hook Vault
document.addEventListener('DOMContentLoaded', () => {
  const toggleAutoBlurRage = document.getElementById('toggleAutoBlurRage');
  const toggleOutlier = document.getElementById('toggleOutlier');
  const toggleKeywordBlur = document.getElementById('toggleKeywordBlur');
  const inputCustomKeyword = document.getElementById('inputCustomKeyword');
  const btnAddKeyword = document.getElementById('btnAddKeyword');
  const keywordChips = document.getElementById('keywordChips');
  const selectMultiplier = document.getElementById('selectMultiplier');
  const selectViewsFloor = document.getElementById('selectViewsFloor');
  const statSavedHooks = document.getElementById('statSavedHooks');
  const btnOpenDashboard = document.getElementById('btnOpenDashboard');

  let customMuteKeywords = [];
  let customKeywordBlurEnabled = true;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderKeywordChips() {
    if (!keywordChips) return;
    keywordChips.innerHTML = '';
    if (!customMuteKeywords || customMuteKeywords.length === 0) {
      keywordChips.innerHTML = '<div class="keyword-empty-hint">Chưa có từ khóa nào. Nhập và bấm Thêm để bắt đầu.</div>';
      return;
    }

    customMuteKeywords.forEach((kw, index) => {
      const chip = document.createElement('span');
      chip.className = 'kw-chip';
      chip.innerHTML = `<span>${escapeHtml(kw)}</span><button type="button" class="kw-chip-remove" title="Xóa từ khóa">&times;</button>`;
      chip.querySelector('.kw-chip-remove').addEventListener('click', () => {
        customMuteKeywords.splice(index, 1);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ customMuteKeywords });
        }
        renderKeywordChips();
      });
      keywordChips.appendChild(chip);
    });
  }

  function addKeyword() {
    if (!inputCustomKeyword) return;
    const val = inputCustomKeyword.value.trim();
    if (!val) return;

    if (!customMuteKeywords.some((k) => k.toLowerCase() === val.toLowerCase())) {
      customMuteKeywords.push(val);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ customMuteKeywords });
      }
      renderKeywordChips();
    }
    inputCustomKeyword.value = '';
    inputCustomKeyword.focus();
  }

  if (btnAddKeyword) {
    btnAddKeyword.addEventListener('click', addKeyword);
  }
  if (inputCustomKeyword) {
    inputCustomKeyword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addKeyword();
      }
    });
  }
  if (toggleKeywordBlur) {
    toggleKeywordBlur.addEventListener('change', () => {
      customKeywordBlurEnabled = toggleKeywordBlur.checked;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ customKeywordBlurEnabled });
      }
    });
  }

  // Custom Dropdown Popover Controller
  function initCustomDropdown(triggerId, menuId, hiddenSelectId) {
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);
    const hiddenSelect = document.getElementById(hiddenSelectId);
    if (!trigger || !menu || !hiddenSelect) return { syncUI: () => {} };

    const triggerText = trigger.querySelector('.trigger-text');
    const items = menu.querySelectorAll('.custom-select-item');

    function syncUI(val) {
      items.forEach((item) => {
        if (item.getAttribute('data-val') === String(val)) {
          item.classList.add('selected');
          if (triggerText) triggerText.textContent = item.querySelector('span')?.textContent || '';
        } else {
          item.classList.remove('selected');
        }
      });
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      document.querySelectorAll('.custom-select-menu').forEach((m) => m.classList.remove('open'));
      document.querySelectorAll('.custom-select-trigger').forEach((t) => {
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
        syncUI(val);
        hiddenSelect.value = val;
        hiddenSelect.dispatchEvent(new Event('change'));
        menu.classList.remove('open');
        trigger.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      });
    });

    return { syncUI };
  }

  const ddMultiplier = initCustomDropdown('triggerMultiplier', 'menuMultiplier', 'selectMultiplier');
  const ddViewsFloor = initCustomDropdown('triggerViewsFloor', 'menuViewsFloor', 'selectViewsFloor');

  // Close dropdowns on click outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-menu').forEach((m) => m.classList.remove('open'));
    document.querySelectorAll('.custom-select-trigger').forEach((t) => {
      t.classList.remove('open');
      t.setAttribute('aria-expanded', 'false');
    });
  });

  // Load existing settings
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
      ['autoBlurRageEnabled', 'outlierDetectionEnabled', 'outlierThresholdMultiplier', 'minViewsFloor', 'x_hook_vault_v1', 'customMuteKeywords', 'customKeywordBlurEnabled'],
      (res) => {
        if (toggleAutoBlurRage) {
          toggleAutoBlurRage.checked = typeof res.autoBlurRageEnabled === 'boolean' ? res.autoBlurRageEnabled : true;
        }
        if (typeof res.outlierDetectionEnabled === 'boolean') {
          toggleOutlier.checked = res.outlierDetectionEnabled;
        }
        if (typeof res.outlierThresholdMultiplier === 'number') {
          selectMultiplier.value = res.outlierThresholdMultiplier.toString();
          ddMultiplier.syncUI(res.outlierThresholdMultiplier);
        }
        if (typeof res.minViewsFloor === 'number') {
          selectViewsFloor.value = res.minViewsFloor.toString();
          ddViewsFloor.syncUI(res.minViewsFloor);
        }
        if (Array.isArray(res.x_hook_vault_v1)) {
          statSavedHooks.textContent = res.x_hook_vault_v1.length.toString();
        }
        if (toggleKeywordBlur && typeof res.customKeywordBlurEnabled === 'boolean') {
          toggleKeywordBlur.checked = res.customKeywordBlurEnabled;
        }
        if (Array.isArray(res.customMuteKeywords)) {
          customMuteKeywords = [...res.customMuteKeywords];
        }
        renderKeywordChips();
      }
    );
  }

  // Handle Negative Content Blur toggle
  if (toggleAutoBlurRage) {
    toggleAutoBlurRage.addEventListener('change', () => {
      chrome.storage.local.set({ autoBlurRageEnabled: toggleAutoBlurRage.checked });
    });
  }

  // Handle Outlier toggle
  toggleOutlier.addEventListener('change', () => {
    chrome.storage.local.set({ outlierDetectionEnabled: toggleOutlier.checked });
  });

  // Handle Multiplier select
  selectMultiplier.addEventListener('change', () => {
    const val = parseFloat(selectMultiplier.value) || 3.0;
    chrome.storage.local.set({ outlierThresholdMultiplier: val });
  });

  // Handle Views floor select
  selectViewsFloor.addEventListener('change', () => {
    const val = parseInt(selectViewsFloor.value, 10) || 1000;
    chrome.storage.local.set({ minViewsFloor: val });
  });

  // Open Dashboard
  btnOpenDashboard.addEventListener('click', () => {
    const dashboardUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
      ? chrome.runtime.getURL('dashboard.html')
      : 'dashboard.html';

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: dashboardUrl });
    } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' }, (res) => {
        if (chrome.runtime?.lastError || !res?.success) {
          window.open(dashboardUrl, '_blank');
        }
      });
    } else {
      window.open(dashboardUrl, '_blank');
    }
  });
});
