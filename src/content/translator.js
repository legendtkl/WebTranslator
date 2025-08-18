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
    console.log('WebTranslator: [DEBUG] extractTranslatableElements called with context-aware logic');
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
          
          // Debug: Log first few elements being processed
          if (Math.random() < 0.01) { // Log 1% of elements to avoid spam
            console.log('WebTranslator: [DEBUG] Processing element:', { 
              tagName, 
              className: String(className).substring(0, 30) 
            });
          }
          
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
            
            // Debug: Log container evaluation
            if (Math.random() < 0.1) {
              console.log('WebTranslator: [DEBUG] Container evaluation:', {
                tag: tagName,
                hasDirectText,
                childrenCount: element.children.length,
                textLength: textContent.length,
                willAccept: hasDirectText && isSmallContainer && isReasonableSize
              });
            }
            
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
        console.log('WebTranslator: [DEBUG] Added element:', { 
          index: elements.length - 1,
          tag: currentElement.tagName,
          text: currentElement.textContent.trim().substring(0, 50) + '...'
        });
      } else if (walkerCount <= 20) { // Log first 20 skipped elements
        console.log('WebTranslator: [DEBUG] Skipped element:', {
          tag: currentElement.tagName,
          reason: skipReason,
          text: currentElement.textContent.substring(0, 30) + '...'
        });
      }
    }
    
    console.log('WebTranslator: [DEBUG] Raw elements extracted:', elements.length);
    
    console.log('WebTranslator: [DEBUG] Elements ready for single-element processing:', elements.length);
    
    return elements;
  }

  /**
   * Group related elements to preserve contextual relationships.
   */
  function groupRelatedElements(elements) {
    if (elements.length === 0) return elements;
    
    console.log('WebTranslator: [DEBUG] Grouping elements for context preservation');
    const grouped = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const nextElement = elements[i + 1];
      
      // Check if current and next elements are contextually related
      if (nextElement && areElementsRelated(element, nextElement)) {
        // Create a context group starting from current element
        const contextGroup = [element];
        let j = i + 1;
        
        // Continue adding related elements to the group
        while (j < elements.length && areElementsRelated(elements[j-1], elements[j])) {
          contextGroup.push(elements[j]);
          j++;
        }
        
        console.log('WebTranslator: [DEBUG] Created context group with', contextGroup.length, 'elements');
        
        // Special tracking for formula/explanation groups
        const hasFormulaContent = contextGroup.some(el => el.textContent.includes('It would be something like'));
        const hasExplanationContent = contextGroup.some(el => el.textContent.includes('In our case, you could'));
        
        if (hasFormulaContent || hasExplanationContent) {
          console.log('WebTranslator: [FORMULA/EXPLANATION] Context group created:', {
            size: contextGroup.length,
            hasFormula: hasFormulaContent,
            hasExplanation: hasExplanationContent,
            texts: contextGroup.map(el => el.textContent.trim())
          });
        } else {
          console.log('WebTranslator: [DEBUG] Group content preview:', contextGroup.map(el => el.textContent.substring(0, 30) + '...'));
        }
        
        // Add all grouped elements
        grouped.push(...contextGroup);
        
        // Skip the elements we just processed
        i = j - 1;
      } else {
        // Single element, no grouping needed
        grouped.push(element);
      }
    }
    
    return grouped;
  }

  /**
   * Check if two elements are contextually related and should stay together.
   */
  function areElementsRelated(element1, element2) {
    if (!element1 || !element2) return false;
    
    // Check DOM proximity - elements should be close in the DOM tree
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    
    // Elements should be vertically close (within 100px)
    const verticalDistance = Math.abs(rect2.top - (rect1.bottom || rect1.top));
    const areVerticallyClose = verticalDistance < 100;
    
    // Check if they're in the same container or adjacent containers
    const haveSameParent = element1.parentNode === element2.parentNode;
    const haveAdjacentParents = element1.parentNode && element2.parentNode && 
      element1.parentNode.parentNode === element2.parentNode.parentNode;
    
    // Content-based relationship checks
    const text1 = element1.textContent.trim().toLowerCase();
    const text2 = element2.textContent.trim().toLowerCase();
    
    // Check for mathematical or technical content that should stay together
    const hasMathContent = /[()[\]{}]|\d+[.,]\d+|[=+\-*/^]|formula|equation|calculation/.test(text1) || 
                          /[()[\]{}]|\d+[.,]\d+|[=+\-*/^]|formula|equation|calculation/.test(text2);
    
    // Check for sequential indicators - especially patterns like "It would be something like"
    const hasSequentialIndicators = /^(it would be something like|其中|where|then|next|after|so|thus|therefore|hence|consequently|依此|然后|接下来|因此|所以)/.test(text2) ||
                                   /\b(continue|follow|result|conclusion|结论|结果|继续|如下|and so on)\b/i.test(text2);
    
    // Check for list-like content
    const isListLike = /^\d+[.)] /.test(text1) && /^\d+[.)] /.test(text2); // numbered lists
    
    // Size similarity - related content often has similar text lengths
    const sizeDifference = Math.abs(text1.length - text2.length);
    const maxLength = Math.max(text1.length, text2.length);
    const areSimilarSize = maxLength > 0 && (sizeDifference / maxLength) < 0.8; // Within 80% size difference
    
    // Combine all relationship indicators
    const isRelated = areVerticallyClose && 
                     (haveSameParent || haveAdjacentParents) && 
                     (hasMathContent || hasSequentialIndicators || isListLike || areSimilarSize);
    
    // Special logging for English formula-explanation cases
    const isTargetPair = (
      text1.includes('in our case, you could') && text2.includes('it would be something like')
    );
    
    if (text2.startsWith('其中') || isTargetPair || text2.includes('it would be something like')) {
      console.log('WebTranslator: [FORMULA-EXPLANATION] Strong connector detected:', {
        text1: text1.substring(0, 60) + '...',
        text2: text2.substring(0, 60) + '...',
        isTargetPair,
        isRelated,
        verticalDistance,
        haveSameParent,
        haveAdjacentParents,
        factors: { hasMathContent, hasSequentialIndicators, isListLike, areSimilarSize }
      });
    }
    
    if (isRelated && Math.random() < 0.1) { // Debug log 10% of related pairs
      console.log('WebTranslator: [DEBUG] Related elements detected:', {
        text1: text1.substring(0, 30) + '...',
        text2: text2.substring(0, 30) + '...',
        verticalDistance,
        haveSameParent,
        haveAdjacentParents,
        hasMathContent,
        hasSequentialIndicators,
        isListLike,
        areSimilarSize
      });
    }
    
    return isRelated;
  }

  /**
   * Create context-aware batches that keep related elements together.
   */
  function createContextAwareBatches(texts, elements, maxBatchSize = 3) {
    if (texts.length !== elements.length) {
      console.error('WebTranslator: Mismatch between texts and elements length');
      return { textBatches: [texts], elementBatches: [elements] };
    }
    
    console.log('WebTranslator: [DEBUG] Creating context-aware batches, maxBatchSize:', maxBatchSize);
    
    const textBatches = [];
    const elementBatches = [];
    
    let currentTextBatch = [];
    let currentElementBatch = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const text = texts[i];
      
      // Check if adding this element would exceed batch size
      if (currentElementBatch.length >= maxBatchSize) {
        // Finalize current batch
        if (currentTextBatch.length > 0) {
          textBatches.push([...currentTextBatch]);
          elementBatches.push([...currentElementBatch]);
          console.log('WebTranslator: [DEBUG] Finalized batch with', currentElementBatch.length, 'elements (size limit)');
        }
        
        // Start new batch
        currentTextBatch = [];
        currentElementBatch = [];
      }
      
      // Add current element to batch
      currentTextBatch.push(text);
      currentElementBatch.push(element);
      
      // Check if the next element is NOT related (end of context group)
      const nextElement = elements[i + 1];
      const isEndOfContextGroup = !nextElement || !areElementsRelated(element, nextElement);
      
      // If we're at the end of a context group and have some elements, consider finalizing batch
      // Be very conservative - finalize even single-element batches to avoid breaking relationships
      if (isEndOfContextGroup && currentElementBatch.length >= 1) {
        // Finalize current batch to preserve context boundaries
        textBatches.push([...currentTextBatch]);
        elementBatches.push([...currentElementBatch]);
        
        // Special tracking for batches containing formula/explanation content
        const batchHasFormula = currentTextBatch.some(text => text.includes('It would be something like'));
        const batchHasExplanation = currentTextBatch.some(text => text.includes('In our case, you could'));
        
        if (batchHasFormula || batchHasExplanation) {
          console.log('WebTranslator: [FORMULA/EXPLANATION] Batch finalized:', {
            batchIndex: textBatches.length - 1,
            size: currentElementBatch.length,
            hasFormula: batchHasFormula,
            hasExplanation: batchHasExplanation,
            texts: currentTextBatch
          });
        } else {
          console.log('WebTranslator: [DEBUG] Finalized context-aware batch with', currentElementBatch.length, 'elements');
        }
        
        // Start new batch
        currentTextBatch = [];
        currentElementBatch = [];
      }
    }
    
    // Add remaining elements if any
    if (currentTextBatch.length > 0) {
      textBatches.push(currentTextBatch);
      elementBatches.push(currentElementBatch);
      console.log('WebTranslator: [DEBUG] Finalized final batch with', currentElementBatch.length, 'elements');
    }
    
    // Debug output
    console.log('WebTranslator: [DEBUG] Context-aware batching results:', {
      originalElements: elements.length,
      batchCount: textBatches.length,
      batchSizes: elementBatches.map(batch => batch.length),
      averageBatchSize: elementBatches.length > 0 ? elements.length / elementBatches.length : 0
    });
    
    return { textBatches, elementBatches };
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
    console.log('WebTranslator: Applying translations to', elements.length, 'elements');
    console.log('WebTranslator: Translation texts:', translatedTexts);
    
    elements.forEach((element, i) => {
      // Skip elements with null/empty translations (failed translations)
      if (!translatedTexts[i] || translatedTexts[i] === null) {
        console.log('WebTranslator: Skipping failed translation for element', i, element);
        // Add a subtle indicator for skipped translations (optional)
        element.classList.add('web-translator-skipped');
        return;
      }
      
      const originalText = getElementText(element);
      const translatedText = translatedTexts[i].trim();
      
      console.log('WebTranslator: Processing element', i, {
        tag: element.tagName,
        text: originalText.substring(0, 50) + '...',
        translation: translatedText.substring(0, 50) + '...',
        element: element
      });
      
      // Store original HTML for restoration
      element.setAttribute('data-original-html', element.innerHTML);
      
      const isHeading = isHeadingElement(element);
      const isSidebarNav = isSidebarNavigationElement(element);
      
      console.log('WebTranslator: Element classification', { isHeading, isSidebarNav });
      
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
    console.log('WebTranslator: Restoring original text');
    
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
    
    console.log('WebTranslator: Original text restored');
  }

  /**
   * Send texts to background script for translation.
   */
  async function translatePage(sourceLang = 'auto', targetLang = 'zh', displayMode = 'bilingual') {
    console.log('WebTranslator: Starting translation', { sourceLang, targetLang, displayMode });
    
    console.log('WebTranslator: [NEW VERSION] About to extract elements from DOM');
    const elements = extractTranslatableElements(document.body);
    console.log('WebTranslator: [UPDATED] Raw extracted elements count:', elements.length);
    
    const validElements = elements.filter(element => getElementText(element).length > 0);
    console.log('WebTranslator: Valid elements after filtering:', validElements.length);
    
    const texts = validElements.map(element => getElementText(element));
    
    console.log('WebTranslator: Extracted elements:', texts.length, texts.slice(0, 3));
    console.log('WebTranslator: First few elements:', validElements.slice(0, 3).map(el => ({
      tag: el.tagName,
      text: getElementText(el).substring(0, 100),
      className: el.className,
      id: el.id
    })));

    if (texts.length === 0) {
      console.log('WebTranslator: No text found to translate');
      return;
    }

    // Use single-element processing to avoid translation ordering issues
    const batches = texts.map(text => [text]); // Each element gets its own batch
    const elementBatches = validElements.map(element => [element]); // Each element gets its own batch
    
    console.log('WebTranslator: Created', batches.length, 'batches for progressive translation');

    try {
      // Process batches sequentially for progressive rendering
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const elementBatch = elementBatches[batchIndex];
        
        console.log(`WebTranslator: Processing single-element batch ${batchIndex + 1}/${batches.length}:`, {
          text: batch[0].substring(0, 60) + '...'
        });
        
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

        console.log(`WebTranslator: Received batch ${batchIndex + 1} response`, response);

        if (response && response.status === 'success' && response.translations) {
          console.log(`WebTranslator: Applying batch ${batchIndex + 1} translations`);
          
          // Remove loading indicator
          elementBatch.forEach(element => {
            element.classList.remove('web-translator-loading');
          });
          
          applyTranslations(elementBatch, response.translations, displayMode);
          
          console.log(`WebTranslator: Applied batch ${batchIndex + 1} translations to DOM`);
          
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
      
      console.log('WebTranslator: All batches processed successfully');
    } catch (error) {
      console.error('WebTranslator: Translation error:', error);
      throw error;
    }
  }

  // Listen for messages from background or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'translatePage') {
      console.log('WebTranslator: Received translatePage message', message);
      translatePage(message.sourceLang, message.targetLang, message.displayMode).then(() => {
        console.log('WebTranslator: Translation process completed');
        sendResponse({status: 'done'});
      }).catch(error => {
        console.error('WebTranslator: Translation failed', error);
        sendResponse({status: 'error', error: error.message});
      });
      return true; // keep channel open for async
    } else if (message.action === 'restoreOriginal') {
      console.log('WebTranslator: Received restoreOriginal message');
      restoreOriginalText();
      sendResponse({status: 'done'});
      return true;
    }
  });
})();