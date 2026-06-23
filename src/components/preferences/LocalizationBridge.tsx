import { useEffect } from 'react';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';

const ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;

export function LocalizationBridge() {
  const { language } = usePreferences();

  useEffect(() => {
    if (language !== 'en-US') return;
    const originalText = new Map<Text, string>();
    const originalAttributes = new Map<Element, Map<string, string>>();
    const nativeAlert = window.alert;
    const nativeConfirm = window.confirm;
    window.alert = message => nativeAlert(translateUiText(String(message)));
    window.confirm = message => nativeConfirm(translateUiText(String(message)));

    const translateElement = (element: Element) => {
      if (element.matches('script, style, code, pre')) return;
      if (element.closest('[data-no-auto-translate="true"]')) return;

      element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
          const textNode = node as Text;
          if (!originalText.has(textNode)) originalText.set(textNode, textNode.textContent ?? '');
          const translated = translateUiText(node.textContent);
          if (translated !== node.textContent) node.textContent = translated;
        }
      });

      ATTRIBUTES.forEach(attribute => {
        const value = element.getAttribute(attribute);
        if (!value) return;
        if (!originalAttributes.has(element)) originalAttributes.set(element, new Map());
        const attributes = originalAttributes.get(element)!;
        if (!attributes.has(attribute)) attributes.set(attribute, value);
        const translated = translateUiText(value);
        if (translated !== value) element.setAttribute(attribute, translated);
      });
    };

    const translateTree = (root: ParentNode) => {
      if (root instanceof Element) translateElement(root);
      root.querySelectorAll('*').forEach(translateElement);
    };

    translateTree(document.body);

    const observer = new MutationObserver(mutations => {
      observer.disconnect();
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) translateTree(node);
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateElement(node.parentElement);
        });
        if (mutation.type === 'characterData' && mutation.target.parentElement) {
          translateElement(mutation.target.parentElement);
        }
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          translateElement(mutation.target);
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...ATTRIBUTES],
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    });

    return () => {
      observer.disconnect();
      window.alert = nativeAlert;
      window.confirm = nativeConfirm;
      originalText.forEach((value, node) => {
        if (node.isConnected) node.textContent = value;
      });
      originalAttributes.forEach((attributes, element) => {
        if (!element.isConnected) return;
        attributes.forEach((value, attribute) => element.setAttribute(attribute, value));
      });
    };
  }, [language]);

  return null;
}
