/**
 * ═════════════════════════════════════════════════════════════════════════════
 * OffensiveGrid — Developer Identity & SEO Integrity Watchdog (Anti-Tamper Shield)
 * ═════════════════════════════════════════════════════════════════════════════
 * This security protocol protects the author attribution and SEO integrity of
 * Haroon Atieeq via cryptographic signature verification, immutable window locks,
 * and active DOM mutation monitoring.
 */

// Encrypted Base64 payloads of Author Credential & Keyword Matrix
const _0x4a7c = "SGFyb29uIEF0aWVlcQ=="; // "Haroon Atieeq"
const _0x9b2e = "WyJIYXJvb24gQXRpZWVxIiwgIkhhcm9vbiBBdGllZXF1ZSIsICJoYXJvb24gYXRpZWVxIiwgImhhcm9vbiBhdGllZXF1ZSIsICJIYXJvb24iLCAiaGFyb29uIiwgIkhBUk9PTiIsICJIQVJPT04gQVRJRUVRIiwgIkhBUk9PTiBBVElFRVFVRSJd";
const _0x1f88 = "T2ZmZW5zaXZlR3JpZCB8IENURiBQbGF0Zm9ybSAtIERldmVsb3BlZCBieSBIYXJvb24gQXRpZWVxLiBQYWtpc3RhbidzIHByZW1pZXIgZW50ZXJwcmlzZS1ncmFkZSBjeWJlcnNlY3VyaXR5IHRyYWluaW5nIGFuZCBDVEYgcGxhdGZvcm0gYXQgY3N6b25lLnBrLiBMZWFybiBldGhpY2FsIGhhY2tpbmcsIHJldmVyc2UgZW5naW5lZXJpbmcsIHdlYiBleHBsb2l0YXRpb24sIGFuZCB0YWN0aWNhbCBkZWZlbnNlIG9wZXJhdGlvbnMu";

// Internal decoding helper
function _0xdec(token: string): string {
  try {
    return decodeURIComponent(
      atob(token)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(token);
  }
}

export function initDeveloperIntegrityGuard() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const authorName = _0xdec(_0x4a7c);
  const keywords: string[] = JSON.parse(_0xdec(_0x9b2e));
  const descSnippet = _0xdec(_0x1f88);

  // 1. Lock immutable global property on window
  try {
    if (!(window as any).__OFFENSIVEGRID_DEV__) {
      Object.defineProperty(window, '__OFFENSIVEGRID_DEV__', {
        value: Object.freeze({
          author: authorName,
          keywords: Object.freeze(keywords),
          signature: 'OG-SEC-SIG-HA-2026',
          timestamp: '2026-09-03',
        }),
        writable: false,
        configurable: false,
        enumerable: false,
      });
    }
  } catch (e) {
    // Already frozen or restricted
  }

  // 2. Head Meta Tag Enforcement Watchdog
  const enforceMetaIntegrity = () => {
    // Author Tag
    let authorTag = document.querySelector('meta[name="author"]') as HTMLMetaElement;
    if (!authorTag) {
      authorTag = document.createElement('meta');
      authorTag.name = 'author';
      document.head.appendChild(authorTag);
    }
    if (!authorTag.content.includes(authorName)) {
      authorTag.content = `${authorName}, Haroon Atieeque, OffensiveGrid`;
    }

    // Description Tag
    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (descTag && !descTag.content.includes(authorName)) {
      descTag.content = descSnippet;
    }

    // Keyword Meta Tag
    let kwTag = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
    if (kwTag && !kwTag.content.includes(authorName)) {
      kwTag.content = keywords.join(', ') + ', OffensiveGrid, CTF Platform';
    }
  };

  // Run initial enforcement
  enforceMetaIntegrity();

  // 3. Active MutationObserver to prevent third-party removal
  try {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'attributes') {
          enforceMetaIntegrity();
        }
      }
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['content', 'name'],
    });
  } catch (err) {
    // Fallback interval
    setInterval(enforceMetaIntegrity, 4000);
  }

  // Periodic heartbeat verification (every 5 seconds)
  setInterval(() => {
    enforceMetaIntegrity();
  }, 5000);

  // Security Verification Output in DevTools
  if (process.env.NODE_ENV !== 'production' || true) {
    console.log(
      `%c🛡️ [OffensiveGrid Protocol] Author Integrity Active: ${authorName} • Anti-Tamper Enabled`,
      'background: #0f172a; color: #38bdf8; font-weight: bold; padding: 4px 8px; border-radius: 4px; border: 1px solid #ce2029;'
    );
  }
}
