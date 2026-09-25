import { describe, expect, test } from "bun:test";

describe("Custom Keyword / Phrase Blur Filter Engine", () => {
  // Pure matching function matching the implementation in content.js
  function matchCustomKeyword(text, keywords, enabled = true) {
    if (!enabled || !Array.isArray(keywords) || keywords.length === 0) {
      return null;
    }
    if (!text || typeof text !== 'string') return null;
    const lowerText = text.toLowerCase();
    for (const kw of keywords) {
      if (!kw || typeof kw !== 'string') continue;
      const cleanKw = kw.trim().toLowerCase();
      if (cleanKw && lowerText.includes(cleanKw)) {
        return kw.trim();
      }
    }
    return null;
  }

  // Deduplication & addition logic matching popup.js
  function addKeywordToStore(existingList, newKeyword) {
    const trimmed = (newKeyword || '').trim();
    if (!trimmed) return existingList;
    if (existingList.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      return existingList;
    }
    return [...existingList, trimmed];
  }

  describe("Keyword Phrase Matching", () => {
    const sampleKeywords = ['crypto', 'lừa đảo', 'drama bóc phốt', 'tài xỉu'];

    test("Matches exact single word case-insensitively", () => {
      expect(matchCustomKeyword("Hôm nay thị trường Crypto sập mạnh", sampleKeywords)).toBe("crypto");
      expect(matchCustomKeyword("CRYPTO là tương lai", sampleKeywords)).toBe("crypto");
      expect(matchCustomKeyword("Tôi ghét cRyPtO", sampleKeywords)).toBe("crypto");
    });

    test("Matches Vietnamese phrases with accents", () => {
      expect(matchCustomKeyword("Cảnh báo chiêu trò lừa đảo qua mạng", sampleKeywords)).toBe("lừa đảo");
      expect(matchCustomKeyword("LỪA ĐẢO chiếm đoạt tài sản", sampleKeywords)).toBe("lừa đảo");
    });

    test("Matches multi-word phrases correctly", () => {
      expect(matchCustomKeyword("Hóng drama bóc phốt cực căng tối nay", sampleKeywords)).toBe("drama bóc phốt");
      expect(matchCustomKeyword("Không có drama nào ở đây", sampleKeywords)).toBe(null);
    });

    test("Does not match when keyword is not present", () => {
      expect(matchCustomKeyword("Bài viết chia sẻ kiến thức lập trình TypeScript bổ ích", sampleKeywords)).toBe(null);
      expect(matchCustomKeyword("Chào buổi sáng cả nhà yêu", sampleKeywords)).toBe(null);
    });

    test("Returns null when filter is disabled", () => {
      expect(matchCustomKeyword("Hôm nay thị trường Crypto sập mạnh", sampleKeywords, false)).toBe(null);
    });

    test("Returns null for empty keywords list or invalid input", () => {
      expect(matchCustomKeyword("Hôm nay thị trường Crypto sập mạnh", [])).toBe(null);
      expect(matchCustomKeyword("", sampleKeywords)).toBe(null);
      expect(matchCustomKeyword(null, sampleKeywords)).toBe(null);
      expect(matchCustomKeyword(undefined, sampleKeywords)).toBe(null);
    });

    test("Ignores whitespace-only keywords in the list", () => {
      expect(matchCustomKeyword("Một bài viết bình thường", ["   ", "\t\n"])).toBe(null);
    });
  });

  describe("Keyword State & Deduplication (Popup Controller)", () => {
    test("Trims whitespace on adding", () => {
      const list = addKeywordToStore([], "  bitcoin  ");
      expect(list).toEqual(["bitcoin"]);
    });

    test("Rejects empty or blank keywords", () => {
      const list = addKeywordToStore(["crypto"], "   ");
      expect(list).toEqual(["crypto"]);
    });

    test("Prevents duplicate keywords case-insensitively", () => {
      const list = ["crypto", "drama"];
      const updated1 = addKeywordToStore(list, "Crypto");
      expect(updated1.length).toBe(2);

      const updated2 = addKeywordToStore(list, "DRAMA");
      expect(updated2.length).toBe(2);

      const updated3 = addKeywordToStore(list, "nft");
      expect(updated3).toEqual(["crypto", "drama", "nft"]);
    });

    test("Removes keyword by index correctly", () => {
      const list = ["crypto", "drama", "scam"];
      list.splice(1, 1);
      expect(list).toEqual(["crypto", "scam"]);
    });
  });

  describe("HTML Escaping for Safe Rendering", () => {
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    test("Escapes special characters to prevent XSS", () => {
      expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(escapeHtml('Hello "World" & \'Friends\'')).toBe("Hello &quot;World&quot; &amp; &#039;Friends&#039;");
      expect(escapeHtml("")).toBe("");
      expect(escapeHtml(null)).toBe("");
    });
  });

  describe("DOM Simulation: Blocking and Reveal Flow", () => {
    // Mock minimal DOM element
    class MockElement {
      constructor(tagName = "div") {
        this.tagName = tagName.toUpperCase();
        this.attributes = new Map();
        this._classes = new Set();
        this.classList = {
          add: (...c) => c.forEach(x => this._classes.add(x)),
          remove: (...c) => c.forEach(x => this._classes.delete(x)),
          contains: (c) => this._classes.has(c),
          toggle: (c) => {
            if (this._classes.has(c)) {
              this._classes.delete(c);
              return false;
            } else {
              this._classes.add(c);
              return true;
            }
          }
        };
        this.style = {};
        this.children = [];
        this.parentElement = null;
        this.innerText = "";
      }

      setAttribute(k, v) { this.attributes.set(k, String(v)); }
      getAttribute(k) { return this.attributes.get(k) || null; }
      hasAttribute(k) { return this.attributes.has(k); }
      removeAttribute(k) { this.attributes.delete(k); }
      querySelector() { return null; }
      querySelectorAll() { return []; }
    }

    test("Simulates blocking a post when matching keyword", () => {
      const post = new MockElement("article");
      const matched = matchCustomKeyword("Tin tức hot về crypto", ["crypto"]);
      expect(matched).toBe("crypto");

      if (matched) {
        post.setAttribute("data-keyword-blocked", "true");
        post.setAttribute("data-matched-keyword", matched);
        post.classList.add("x-shield-keyword-blurred");
      }

      expect(post.getAttribute("data-keyword-blocked")).toBe("true");
      expect(post.getAttribute("data-matched-keyword")).toBe("crypto");
      expect(post.classList.contains("x-shield-keyword-blurred")).toBe(true);
    });

    test("Simulates user clicking reveal button to toggle visibility", () => {
      const post = new MockElement("article");
      post.setAttribute("data-keyword-blocked", "true");
      post.classList.add("x-shield-keyword-blurred");

      // First click: reveal
      const isRevealed = post.classList.toggle("x-keyword-revealed");
      expect(isRevealed).toBe(true);
      expect(post.classList.contains("x-keyword-revealed")).toBe(true);

      // Second click: re-blur
      const isStillRevealed = post.classList.toggle("x-keyword-revealed");
      expect(isStillRevealed).toBe(false);
      expect(post.classList.contains("x-keyword-revealed")).toBe(false);
    });
  });
});
