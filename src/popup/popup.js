document.addEventListener('DOMContentLoaded', async () => {
  const sourceLangSelect = document.getElementById('source-lang');
  const targetLangSelect = document.getElementById('target-lang');
  const translateBtn = document.getElementById('translate-btn');
  const restoreBtn = document.getElementById('restore-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');
  const retryBtn = document.getElementById('retry-btn');

  // Load saved settings
  await loadSettings();

  // Event listeners
  translateBtn.addEventListener('click', handleTranslate);
  restoreBtn.addEventListener('click', handleRestore);
  settingsBtn.addEventListener('click', openSettings);
  retryBtn.addEventListener('click', handleTranslate);
  sourceLangSelect.addEventListener('change', saveSettings);
  targetLangSelect.addEventListener('change', saveSettings);

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      const settings = result.settings || {};
      
      sourceLangSelect.value = settings.defaultSourceLang || 'auto';
      targetLangSelect.value = settings.defaultTargetLang || 'zh';
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function saveSettings() {
    try {
      const settings = {
        defaultSourceLang: sourceLangSelect.value,
        defaultTargetLang: targetLangSelect.value
      };
      
      await chrome.storage.sync.set({ settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async function handleTranslate() {
    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;

    if (sourceLang === targetLang && sourceLang !== 'auto') {
      showError('Source and target languages cannot be the same');
      return;
    }

    try {
      await saveSettings();
      showStatus('Initializing translation...');
      
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Ensure content script is injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/translator.js']
        });
        // Small delay to ensure script is ready
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (injectionError) {
        // Content script might already be injected, ignore error
        console.log('Content script injection (might already exist):', injectionError.message);
      }

      // Send message to content script with retry logic
      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await chrome.tabs.sendMessage(tab.id, {
            action: 'translatePage',
            sourceLang,
            targetLang,
            displayMode: 'bilingual'
          });
          break; // Success, exit retry loop
        } catch (msgError) {
          retries--;
          if (retries === 0) {
            throw new Error('Could not communicate with page content. Please refresh the page and try again.');
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (response && response.status === 'done') {
        showSuccess('Translation completed!');
        setTimeout(hideStatus, 2000);
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      showError(error.message || 'Translation failed. Please try again.');
    }
  }

  async function handleRestore() {
    try {
      showStatus('Restoring original text...');
      
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Ensure content script is injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/translator.js']
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (injectionError) {
        console.log('Content script injection (might already exist):', injectionError.message);
      }

      // Send restore message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'restoreOriginal'
      });

      if (response && response.status === 'done') {
        showSuccess('Original text restored!');
        setTimeout(hideStatus, 2000);
      } else {
        throw new Error('Restore failed');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showError(error.message || 'Restore failed. Please try again.');
    }
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  function showStatus(message) {
    hideError();
    statusDiv.querySelector('.status-text').textContent = message;
    statusDiv.classList.remove('hidden');
    translateBtn.disabled = true;
    document.body.classList.add('loading');
    
    // Animate progress bar
    const progressFill = statusDiv.querySelector('.progress-fill');
    progressFill.style.width = '0%';
    setTimeout(() => {
      progressFill.style.width = '100%';
    }, 100);
  }

  function showSuccess(message) {
    statusDiv.querySelector('.status-text').textContent = message;
    const progressFill = statusDiv.querySelector('.progress-fill');
    progressFill.style.width = '100%';
    progressFill.style.background = '#28a745';
    translateBtn.disabled = false;
    document.body.classList.remove('loading');
  }

  function hideStatus() {
    statusDiv.classList.add('hidden');
    translateBtn.disabled = false;
    document.body.classList.remove('loading');
  }

  function showError(message) {
    hideStatus();
    errorDiv.querySelector('.error-text').textContent = message;
    errorDiv.classList.remove('hidden');
  }

  function hideError() {
    errorDiv.classList.add('hidden');
  }
});