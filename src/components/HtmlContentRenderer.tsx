'use strict';
'use client';

import React, { useEffect, useRef } from 'react';
import { prepareEmbeddedHtml, HTML_EMBED_SANDBOX, HTML_EMBED_RESIZE_MESSAGE } from '@/lib/html-embed';

interface Props {
  content: string;
  className?: string;
}

export default function HtmlContentRenderer({ content, className = 'detail-content' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    const container = containerRef.current;
    const iframes: HTMLIFrameElement[] = [];

    // 1. Check if the entire content is a standalone HTML document
    const trimmed = content.trim();
    const isFullHtmlDoc =
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html') ||
      (trimmed.includes('<head>') && trimmed.includes('<body>'));

    if (isFullHtmlDoc) {
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.className = 'custom-html-frame';
      iframe.title = 'محتوى المقال';
      iframe.style.cssText = [
        'display: block',
        'width: 100%',
        'border: none',
        'min-height: 450px',
        'border-radius: 12px',
        'overflow: hidden',
        'margin: 20px 0',
        'background: transparent',
      ].join(';');
      iframe.setAttribute('sandbox', HTML_EMBED_SANDBOX);
      iframe.srcdoc = prepareEmbeddedHtml(trimmed);

      container.appendChild(iframe);
      iframes.push(iframe);
    } else {
      // 2. Render normal HTML with embedded custom HTML blocks
      container.innerHTML = content;

      // Ensure all inline-btn links open safely in new tab
      container.querySelectorAll('a.inline-btn').forEach((a) => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });

      // Find all custom-html-block placeholders and transform them into responsive iframes
      container.querySelectorAll('div.custom-html-block[data-html-src]').forEach((div) => {
        try {
          const rawSrc = div.getAttribute('data-html-src') || '';
          let source = '';
          try {
            source = decodeURIComponent(escape(atob(rawSrc)));
          } catch {
            source = atob(rawSrc);
          }

          const html = prepareEmbeddedHtml(source);
          if (!html) return;

          const iframe = document.createElement('iframe');
          iframe.className = 'custom-html-frame';
          iframe.title = 'محتوى HTML مضمّن';
          iframe.style.cssText = [
            'display: block',
            'width: 100%',
            'border: none',
            'min-height: 350px',
            'border-radius: 12px',
            'overflow: hidden',
            'margin: 24px 0',
            'background: transparent',
          ].join(';');
          iframe.setAttribute('sandbox', HTML_EMBED_SANDBOX);
          iframe.srcdoc = html;

          div.parentNode?.replaceChild(iframe, div);
          iframes.push(iframe);
        } catch (e) {
          console.warn('Error rendering custom-html-block:', e);
        }
      });
    }

    // 3. Listen to height resize messages from embedded iframes
    function handleResizeMessage(e: MessageEvent) {
      if (e.data?.type === HTML_EMBED_RESIZE_MESSAGE && typeof e.data.height === 'number') {
        iframes.forEach((iframe) => {
          if (iframe.contentWindow === e.source) {
            iframe.style.height = `${e.data.height}px`;
          }
        });
      }
    }

    window.addEventListener('message', handleResizeMessage);

    return () => {
      window.removeEventListener('message', handleResizeMessage);
    };
  }, [content]);

  return <div ref={containerRef} className={className} />;
}
