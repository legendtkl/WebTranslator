// Basic unit tests for translator.js extraction logic

function mockDOMWithText(textArray) {
  document.body.innerHTML = '';
  textArray.forEach(text => {
    const p = document.createElement('p');
    p.textContent = text;
    document.body.appendChild(p);
  });
  return document.body;
}

describe('translator content script', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('extractTextNodes should find only text nodes', () => {
    mockDOMWithText(['Hello', 'World']);
    const extractTextNodes = require('../src/content/translator').__test__.extractTextNodes;
    const nodes = extractTextNodes(document.body);
    expect(nodes.length).toBe(2);
    expect(nodes.map(n => n.nodeValue)).toEqual(['Hello', 'World']);
  });

  test('applyTranslations replaces text content', () => {
    const root = mockDOMWithText(['Hello']);
    const extractTextNodes = require('../src/content/translator').__test__.extractTextNodes;
    const applyTranslations = require('../src/content/translator').__test__.applyTranslations;
    const nodes = extractTextNodes(root);

    applyTranslations(nodes, ['你好']);
    expect(nodes[0].nodeValue).toBe('你好');
  });
});