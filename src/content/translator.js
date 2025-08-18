(() => {
  // Prevent multiple injections
  if (window.webTranslatorInjected) {
    return;
  }
  window.webTranslatorInjected = true;

  // Inject CSS styles
  function injectStyles() {
    if (document.getElementById('web-translator-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'web-translator-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/content/styles.css');
    document.head.appendChild(link);
  }
  
  // Inject styles when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  /**
   * Extract translatable elements while preserving contextual relationships.
   */
  function extractTranslatableElements(root) {
    const elements = [];
    
    // Find text-containing elements that should be translated
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(element) {
          const tagName = element.nodeName.toLowerCase();
          const className = element.className || '';
          const id = element.id || '';
          
          
          // Skip script, style, noscript tags completely
          if (/^(script|style|noscript|meta|link|title)$/.test(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip code blocks
          if (/^(code|pre|kbd|samp|var)$/.test(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip elements with code-related classes
          if (/code|highlight|syntax|lang-|language-/.test(className)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip main navigation elements (but allow sidebar)
          if (/^nav$/.test(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          if (/nav|menu|breadcrumb|toc|table-of-contents/.test(className) && !/sidebar/.test(className)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          if (/nav|menu|breadcrumb|toc|table-of-contents/.test(id) && !/sidebar/.test(id)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Prioritize specific content elements over generic containers
          const isContentElement = /^(p|h[1-6]|li|td|th|blockquote|dd|dt|span|a)$/.test(tagName);
          const isContainerElement = /^(div|section|article)$/.test(tagName);
          const textContent = element.textContent.trim();
          const hasSubstantialText = textContent.length > 10;
          
          // For content elements, be more permissive
          if (isContentElement && hasSubstantialText) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          // For container elements, be more selective
          if (isContainerElement && hasSubstantialText) {
            // Only accept containers with direct text content and few children
            const hasDirectText = Array.from(element.childNodes).some(node => 
              node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 5
            );
            
            // Avoid large containers that contain many other elements
            const isSmallContainer = element.children.length <= 3;
            const isReasonableSize = textContent.length <= 500; // Avoid very large containers
            
            
            if (hasDirectText && isSmallContainer && isReasonableSize) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          
          return NodeFilter.FILTER_SKIP;
        }
      },
      false
    );

    let currentElement;
    let walkerCount = 0;
    while ((currentElement = walker.nextNode())) {
      walkerCount++;
      
      // Quick ancestor check for code/navigation context
      let shouldSkip = false;
      let skipReason = '';
      let ancestor = currentElement.parentNode;
      
      // Check up to 5 levels up for problematic ancestors
      let levels = 0;
      while (ancestor && ancestor !== document.body && levels < 5) {
        const ancestorTag = ancestor.nodeName.toLowerCase();
        const ancestorClass = ancestor.className || '';
        
        if (/^(script|style|noscript|code|pre|nav)$/.test(ancestorTag)) {
          shouldSkip = true;
          skipReason = `ancestor ${ancestorTag}`;
          break;
        }
        
        if (/code|highlight|syntax|lang-|language-|nav|menu/.test(ancestorClass)) {
          shouldSkip = true;
          skipReason = `ancestor class ${ancestorClass}`;
          break;
        }
        
        ancestor = ancestor.parentNode;
        levels++;
      }
      
      // Avoid overlapping elements - don't select child if parent is already selected
      const isChildOfSelected = elements.some(selected => selected.contains(currentElement));
      if (isChildOfSelected) {
        shouldSkip = true;
        skipReason = 'child of selected';
      }
      
      if (!shouldSkip) {
        elements.push(currentElement);
      }
    }
    
    
    return elements;
  }


  /**
   * Get the combined text content of an element.
   */
  function getElementText(element) {
    return element.textContent.trim();
  }

  /**
   * Apply translations while preserving original text (bilingual display).
   */
  function isHeadingElement(element) {
    if (!element) return false;
    const tagName = element.nodeName.toLowerCase();
    
    // Check for heading tags
    if (/^h[1-6]$/.test(tagName)) return true;
    
    // Check for elements with heading-like classes or roles
    const className = element.className || '';
    const role = element.getAttribute('role') || '';
    
    if (/title|heading|header/.test(className) || role === 'heading') {
      return true;
    }
    
    // Check parent elements for heading context
    let parent = element.parentNode;
    while (parent && parent !== document.body) {
      const parentTag = parent.nodeName.toLowerCase();
      const parentClass = parent.className || '';
      
      if (/^h[1-6]$/.test(parentTag)) return true;
      if (/title|heading|header/.test(parentClass)) return true;
      
      parent = parent.parentNode;
    }
    
    return false;
  }
  
  function isSidebarNavigationElement(element) {
    if (!element) return false;
    
    // Check element and its ancestors for sidebar context
    let current = element;
    while (current && current !== document.body) {
      const className = current.className || '';
      const id = current.id || '';
      const tagName = current.nodeName.toLowerCase();
      
      // Sidebar indicators
      if (/sidebar|aside|nav/.test(className) || /sidebar|aside|nav/.test(id) || tagName === 'aside') {
        return true;
      }
      
      // Table of contents indicators
      if (/toc|table-of-contents|contents/.test(className) || /toc|table-of-contents|contents/.test(id)) {
        return true;
      }
      
      current = current.parentNode;
    }
    
    return false;
  }

  function applyTranslations(elements, translatedTexts, displayMode = 'bilingual') {
    
    elements.forEach((element, i) => {
      // Skip elements with null/empty translations (failed translations)
      if (!translatedTexts[i] || translatedTexts[i] === null) {
        element.classList.add('web-translator-skipped');
        return;
      }
      
      const originalText = getElementText(element);
      const translatedText = translatedTexts[i].trim();
      
      // Store original HTML for restoration
      element.setAttribute('data-original-html', element.innerHTML);
      
      const isHeading = isHeadingElement(element);
      const isSidebarNav = isSidebarNavigationElement(element);
      
      if (displayMode === 'bilingual') {
        if (isHeading) {
          // For headings: add translation in parentheses
          const translationSpan = document.createElement('span');
          translationSpan.className = 'web-translator-heading-translation';
          translationSpan.textContent = ` (${translatedText})`;
          element.appendChild(translationSpan);
        } else if (isSidebarNav) {
          // For sidebar navigation: inline format with space
          const translationSpan = document.createElement('span');
          translationSpan.className = 'web-translator-sidebar-translation';
          translationSpan.textContent = ` ${translatedText}`;
          element.appendChild(translationSpan);
        } else {
          // For content: add translation below
          const translationDiv = document.createElement('div');
          translationDiv.className = 'web-translator-content-translation';
          translationDiv.textContent = translatedText;
          element.appendChild(translationDiv);
        }
      } else if (displayMode === 'replace') {
        // Replace completely with translated text
        element.textContent = translatedText;
      }
      
      // Mark as translated for restoration
      element.classList.add('web-translator-translated');
      element.setAttribute('data-translated', 'true');
    });
  }

  /**
   * Restore original text content.
   */
  function restoreOriginalText() {
    
    const translatedElements = document.querySelectorAll('[data-translated="true"]');
    translatedElements.forEach(element => {
      const originalHTML = element.getAttribute('data-original-html');
      if (originalHTML) {
        element.innerHTML = originalHTML;
      }
      
      // Remove translation markers
      element.classList.remove('web-translator-translated', 'web-translator-loading', 'web-translator-error', 'web-translator-skipped');
      element.removeAttribute('data-translated');
      element.removeAttribute('data-original-html');
    });
    
    // Also clean up any orphaned error indicators or loading states
    const errorElements = document.querySelectorAll('.web-translator-error');
    errorElements.forEach(element => {
      element.classList.remove('web-translator-error', 'web-translator-loading', 'web-translator-skipped');
      // Remove error indicators
      const errorIndicators = element.querySelectorAll('.web-translator-error-indicator');
      errorIndicators.forEach(indicator => indicator.remove());
    });
    
    const loadingElements = document.querySelectorAll('.web-translator-loading');
    loadingElements.forEach(element => {
      element.classList.remove('web-translator-loading');
    });
  }

  /**
   * Send texts to background script for translation.
   */
  async function translatePage(sourceLang = 'auto', targetLang = 'zh', displayMode = 'bilingual') {
    const elements = extractTranslatableElements(document.body);
    const validElements = elements.filter(element => getElementText(element).length > 0);
    const texts = validElements.map(element => getElementText(element));

    if (texts.length === 0) {
      console.warn('WebTranslator: No translatable text found on this page');
      return;
    }

    // Use single-element processing to avoid translation ordering issues
    const batches = texts.map(text => [text]); // Each element gets its own batch
    const elementBatches = validElements.map(element => [element]); // Each element gets its own batch
    

    try {
      // Process batches sequentially for progressive rendering
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const elementBatch = elementBatches[batchIndex];
        
        
        // Add loading indicator to current batch
        elementBatch.forEach(element => {
          element.classList.add('web-translator-loading');
        });
        
        const response = await chrome.runtime.sendMessage({
          action: 'translate',
          texts: batch,
          sourceLang,
          targetLang
        });

        if (response && response.status === 'success' && response.translations) {
          
          // Remove loading indicator
          elementBatch.forEach(element => {
            element.classList.remove('web-translator-loading');
          });
          
          applyTranslations(elementBatch, response.translations, displayMode);
          
          // Small delay between batches for better UX
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else if (response && response.status === 'error') {
          console.error(`WebTranslator: Batch ${batchIndex + 1} failed:`, response.error);
          
          // Remove loading indicator on error and show fallback message
          elementBatch.forEach((element) => {
            element.classList.remove('web-translator-loading');
            element.classList.add('web-translator-error');
            
            // Add a subtle error indicator without disrupting the original content
            if (!element.querySelector('.web-translator-error-indicator')) {
              const errorIndicator = document.createElement('span');
              errorIndicator.className = 'web-translator-error-indicator';
              errorIndicator.style.cssText = `
                color: #dc3545; 
                font-size: 11px; 
                opacity: 0.7; 
                margin-left: 5px; 
                cursor: help;
              `;
              errorIndicator.title = 'Translation failed - please try again';
              errorIndicator.textContent = '⚠️';
              element.appendChild(errorIndicator);
            }
          });
          
          // Continue with next batch instead of failing completely
          continue;
        }
      }
    } catch (error) {
      console.error('WebTranslator: Translation error:', error);
      throw error;
    }
  }

  // Listen for messages from background or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'translatePage') {
      translatePage(message.sourceLang, message.targetLang, message.displayMode).then(() => {
        sendResponse({status: 'done'});
      }).catch(error => {
        console.error('WebTranslator: Translation failed', error);
        sendResponse({status: 'error', error: error.message});
      });
      return true; // keep channel open for async
    } else if (message.action === 'restoreOriginal') {
      restoreOriginalText();
      sendResponse({status: 'done'});
      return true;
    }
  });
})();