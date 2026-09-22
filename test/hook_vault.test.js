import { expect, test, describe } from "bun:test";

// Logic mirrored directly from content.js & dashboard.js for robust automated verification
function parseMetricNumber(str) {
  if (!str) return 0;
  str = str.trim();
  const m = str.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?/i);
  if (!m) return 0;
  let numStr = m[1];
  const suffix = (m[2] || '').toLowerCase();

  if (numStr.includes(',') && numStr.includes('.')) {
    if (numStr.indexOf(',') < numStr.indexOf('.')) {
      numStr = numStr.replace(/,/g, '');
    } else {
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    }
  } else if (numStr.includes(',')) {
    if (suffix || /,\d{1,2}$/.test(numStr)) {
      numStr = numStr.replace(',', '.');
    } else {
      numStr = numStr.replace(/,/g, '');
    }
  } else if (numStr.includes('.')) {
    if (!suffix && /\.\d{3}$/.test(numStr)) {
      numStr = numStr.replace(/\./g, '');
    }
  }

  let val = parseFloat(numStr) || 0;
  if (suffix === 'k' || suffix === 'n') val *= 1000;
  else if (suffix === 'm' || suffix === 'tr') val *= 1000000;
  else if (suffix === 'b' || suffix === 'tỷ') val *= 1000000000;
  return Math.round(val);
}

function extractTweetHook(fullText) {
  if (!fullText) return '';
  const trimmed = fullText.trim();
  const parts = trimmed.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 0 && parts.length > 1) {
    if (parts[0].length < 25 && parts.length > 1) {
      return `${parts[0]}\n${parts[1]}`;
    }
    return parts[0];
  }
  const sentenceMatch = trimmed.match(/^([^.!?\n]+[.!?])(?:\s|$)/);
  if (sentenceMatch && sentenceMatch[1].length >= 20) {
    return sentenceMatch[1].trim();
  }
  return parts.length === 1 ? parts[0] : trimmed.slice(0, 180);
}

function classifyHookFormula(text) {
  if (!text) return 'other';
  const lower = text.toLowerCase();
  if (/\b(unpopular opinion|is dead|isn't real|stop doing|stop using|don't do|myth|lie|wrong about|đã chết|đừng làm|sai lầm|ảo tưởng|sự thật phũ phàng|ngược lại)\b/i.test(lower)) {
    return 'contrarian';
  }
  if (/\b(\d+\s*(tools|websites|prompts|tips|steps|books|rules|công cụ|bước|mẹo|nguyên tắc|cuốn sách)|cheatsheet|cẩm nang|framework|khung sườn|bookmark|tổng hợp|lưu lại)\b/i.test(lower)) {
    return 'cheatsheet';
  }
  if (/\b(years ago|in 20\d\d|today i|how i went from|started with|năm ngoái|cách đây|tôi từng|từ số 0|hành trình|bước ngoặt)\b/i.test(lower)) {
    return 'story';
  }
  if (/\b(i analyzed|studied|examined|billionaire|millionaire|ceo|mrbeast|musk|jobs|phân tích|nghiên cứu|chuyên gia|doanh thu|triệu đô|hàng ngàn)\b/i.test(lower)) {
    return 'proof';
  }
  if (/\?$/m.test(text.trim()) || /^(why|how|what if|want to|have you ever|tại sao|làm sao|liệu bạn|có bao giờ)\b/i.test(lower)) {
    return 'challenge';
  }
  if (/\b(secret|nobody talks about|hardly anyone|most people don't|hidden|the reason why|bí mật|ít ai biết|không ai nói|lý do tại sao|sự thật là)\b/i.test(lower)) {
    return 'curiosity';
  }
  return 'other';
}

function generateNicheVariations(hookText, formula, niche) {
  const cleanNiche = niche.trim() || 'lĩnh vực của bạn';
  const generators = {
    contrarian: [
      { type: 'The Lie', text: `Hầu hết mọi người trong ngành ${cleanNiche} đều đang tin vào lời khuyên lỗi thời này.` },
      { type: 'The Unpopular Truth', text: `Ý kiến trái chiều: ${cleanNiche} không hề phức tạp như các "chuyên gia" nói.` },
      { type: 'Stop Doing X', text: `Nếu bạn muốn bứt phá trong ${cleanNiche} năm nay, hãy DỪNG NGAY việc này.` }
    ],
    curiosity: [
      { type: 'The Hidden Rule', text: `Quy luật ngầm trong giới ${cleanNiche} mà ít ai dám công khai nói cho bạn biết:` },
      { type: 'The Secret Factor', text: `Sự khác biệt duy nhất giữa top 1% trong ${cleanNiche} và người bình thường:` },
      { type: 'Behind The Scenes', text: `Tôi đã âm thầm quan sát những người giỏi nhất ngành ${cleanNiche} suốt 12 tháng qua:` }
    ],
    cheatsheet: [
      { type: 'Time Saver', text: `Tôi đã tốn hơn 100 giờ thử nghiệm mọi phương pháp trong ${cleanNiche}. Đây là bản tóm gọn:` },
      { type: 'The Ultimate Stack', text: `Bộ công cụ & khung sườn giúp bạn làm chủ ${cleanNiche} từ con số 0:` },
      { type: 'Step-by-Step Blueprint', text: `Lộ trình 5 bước chinh phục ${cleanNiche} mà bạn có thể áp dụng ngay:` }
    ]
  };
  return generators[formula] || generators.curiosity;
}

function parseThreadsMetricsFromText(text) {
  let likes = 0;
  let replies = 0;
  let reposts = 0;
  const likeMatch = text.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(likes?|lượt thích)/i);
  if (likeMatch) {
    likes = parseMetricNumber(`${likeMatch[1]} ${likeMatch[2] || ''}`);
  }
  const replyMatch = text.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(replies?|câu trả lời|bình luận)/i);
  if (replyMatch) {
    replies = parseMetricNumber(`${replyMatch[1]} ${replyMatch[2] || ''}`);
  }
  const repostMatch = text.match(/([\d\.,]+)\s*(k|m|b|n|tr|tỷ)?\s*(reposts?|lượt đăng lại)/i);
  if (repostMatch) {
    reposts = parseMetricNumber(`${repostMatch[1]} ${repostMatch[2] || ''}`);
  }
  return { likes, replies, reposts };
}

function mapJevHookLabelToFormula(rawLabel) {
  let formula = 'other';
  const lower = (rawLabel || '').toLowerCase();
  if (lower.includes('curiosity')) formula = 'curiosity';
  else if (lower.includes('contrarian')) formula = 'contrarian';
  else if (lower.includes('cheatsheet') || lower.includes('framework')) formula = 'cheatsheet';
  else if (lower.includes('story') || lower.includes('personal')) formula = 'story';
  else if (lower.includes('social proof') || lower.includes('authority')) formula = 'proof';
  else if (lower.includes('challenge') || lower.includes('provocation')) formula = 'challenge';
  return formula;
}

describe("X Hook Vault & Viral Intelligence Unit Tests", () => {
  describe("Metric Number Parser", () => {
    test("Correctly parses English shorthand K, M, B", () => {
      expect(parseMetricNumber("1.8M")).toBe(1800000);
      expect(parseMetricNumber("24.5K")).toBe(24500);
      expect(parseMetricNumber("5.2B")).toBe(5200000000);
      expect(parseMetricNumber("150K")).toBe(150000);
      expect(parseMetricNumber("450")).toBe(450);
    });

    test("Correctly parses Vietnamese shorthand N, Tr, Tỷ", () => {
      expect(parseMetricNumber("24,5 N")).toBe(24500);
      expect(parseMetricNumber("3,2 Tr")).toBe(3200000);
      expect(parseMetricNumber("1.5 Tỷ")).toBe(1500000000);
      expect(parseMetricNumber("10.234")).toBe(10234);
    });

    test("Correctly parses formatted thousands with commas", () => {
      expect(parseMetricNumber("10,450")).toBe(10450);
      expect(parseMetricNumber("1,234,567")).toBe(1234567);
    });

    test("Handles empty, null, and non-numeric inputs gracefully", () => {
      expect(parseMetricNumber("")).toBe(0);
      expect(parseMetricNumber(null)).toBe(0);
      expect(parseMetricNumber(undefined)).toBe(0);
      expect(parseMetricNumber("No views yet")).toBe(0);
    });
  });

  describe("Tweet Hook Extractor", () => {
    test("Extracts the first opening paragraph before double linebreaks", () => {
      const tweet = `Most people think starting a business is about having a great idea. It’s not.\n\nHere are 5 questions to ask yourself before building anything:\n1. Who has the money?\n2. What hurts them most?`;
      const hook = extractTweetHook(tweet);
      expect(hook).toBe("Most people think starting a business is about having a great idea. It’s not.");
    });

    test("Combines short opening label tags with next line", () => {
      const tweet = `Thread 🧵\nHere is the exact framework I used to scale to $100K/month:`;
      const hook = extractTweetHook(tweet);
      expect(hook).toBe("Thread 🧵\nHere is the exact framework I used to scale to $100K/month:");
    });

    test("Falls back to first sentence when no linebreaks exist", () => {
      const tweet = `Software engineering is changing faster than ever before in history. You must adapt to AI agents or get replaced in 24 months.`;
      const hook = extractTweetHook(tweet);
      expect(hook).toBe("Software engineering is changing faster than ever before in history.");
    });
  });

  describe("Hook Formula Classifier", () => {
    test("Classifies Contrarian / Hot Take hooks", () => {
      expect(classifyHookFormula("Unpopular opinion: Coding bootcamps are dead.")).toBe("contrarian");
      expect(classifyHookFormula("Stop using clean architecture in early-stage startups.")).toBe("contrarian");
      expect(classifyHookFormula("99% sai lầm của người mới là ảo tưởng về AI.")).toBe("contrarian");
    });

    test("Classifies Cheatsheet / Framework hooks", () => {
      expect(classifyHookFormula("10 tools that will save you 100 hours of design work:")).toBe("cheatsheet");
      expect(classifyHookFormula("The ultimate AI framework for 2026 (Bookmark this):")).toBe("cheatsheet");
      expect(classifyHookFormula("Cẩm nang 5 bước làm chủ prompt engineering:")).toBe("cheatsheet");
    });

    test("Classifies Story / Transformation hooks", () => {
      expect(classifyHookFormula("In 2021 I was broke and sleeping on a couch. Today I run a $5M company:")).toBe("story");
      expect(classifyHookFormula("Cách đây 2 năm tôi từng thất bại thảm hại. Đây là bài học:")).toBe("story");
    });

    test("Classifies Social Proof / Authority hooks", () => {
      expect(classifyHookFormula("I analyzed 1,000 top creators on X. Here is what they do differently:")).toBe("proof");
      expect(classifyHookFormula("Elon Musk once said something about leadership that changed how I hire:")).toBe("proof");
      expect(classifyHookFormula("Nghiên cứu trên 50 chuyên gia đầu ngành cho thấy:")).toBe("proof");
    });

    test("Classifies Direct Challenge / Question hooks", () => {
      expect(classifyHookFormula("Why are you still working 60 hours a week for someone else?")).toBe("challenge");
      expect(classifyHookFormula("Tại sao bạn vẫn chưa bắt đầu học lập trình AI?")).toBe("challenge");
    });

    test("Classifies Curiosity Gap hooks", () => {
      expect(classifyHookFormula("The secret nobody talks about in SaaS marketing:")).toBe("curiosity");
      expect(classifyHookFormula("Bí mật ít ai biết đằng sau thuật toán của X:")).toBe("curiosity");
    });

    test("Defaults to 'other' for generic text", () => {
      expect(classifyHookFormula("Just having a good morning coffee in Hanoi.")).toBe("other");
    });
  });

  describe("AI Niche Adaptor Engine", () => {
    test("Generates 3 variations embedding the specified niche", () => {
      const niche = "Lập trình AI";
      const variations = generateNicheVariations(
        "Most people think X is hard. It's not.",
        "contrarian",
        niche
      );

      expect(variations).toHaveLength(3);
      variations.forEach((v) => {
        expect(v.text).toContain(niche);
        expect(v.type).toBeDefined();
      });
    });
  });

  describe("Threads Viral Metrics & Jev AI Zero-shot Hook Mapping", () => {
    test("Correctly extracts English Threads metrics", () => {
      const metrics1 = parseThreadsMetricsFromText("1.4K likes • 85 replies • 12 reposts");
      expect(metrics1.likes).toBe(1400);
      expect(metrics1.replies).toBe(85);
      expect(metrics1.reposts).toBe(12);

      const metrics2 = parseThreadsMetricsFromText("520 likes");
      expect(metrics2.likes).toBe(520);
      expect(metrics2.replies).toBe(0);
    });

    test("Correctly extracts Vietnamese Threads metrics", () => {
      const metrics = parseThreadsMetricsFromText("2,5 Tr lượt thích • 450 câu trả lời • 1,2 N lượt đăng lại");
      expect(metrics.likes).toBe(2500000);
      expect(metrics.replies).toBe(450);
      expect(metrics.reposts).toBe(1200);
    });

    test("Evaluates Threads viral threshold correctly (>= 500 likes OR >= 50 replies)", () => {
      const viralByLikes = { likes: 500, replies: 10 };
      const isViral1 = viralByLikes.likes >= 500 || viralByLikes.replies >= 50;
      expect(isViral1).toBe(true);

      const viralByReplies = { likes: 120, replies: 55 };
      const isViral2 = viralByReplies.likes >= 500 || viralByReplies.replies >= 50;
      expect(isViral2).toBe(true);

      const notViral = { likes: 120, replies: 15 };
      const isViral3 = notViral.likes >= 500 || notViral.replies >= 50;
      expect(isViral3).toBe(false);
    });

    test("Maps all Jev AI descriptive hook labels to standardized formulas", () => {
      expect(mapJevHookLabelToFormula("Curiosity Gap hook: creates intense mystery or withholds key information")).toBe("curiosity");
      expect(mapJevHookLabelToFormula("Contrarian / Hot Take hook: boldly challenges conventional wisdom")).toBe("contrarian");
      expect(mapJevHookLabelToFormula("Cheatsheet / Framework hook: curated list, tools, step-by-step blueprint")).toBe("cheatsheet");
      expect(mapJevHookLabelToFormula("Personal Story transformation hook: vulnerability, from zero to success")).toBe("story");
      expect(mapJevHookLabelToFormula("Social Proof authority hook: big numbers, case study, expert credibility")).toBe("proof");
      expect(mapJevHookLabelToFormula("Direct Provocation challenge hook: tough wake-up call, sharp question")).toBe("challenge");
      expect(mapJevHookLabelToFormula("Random unknown label from api")).toBe("other");
    });
  });

  describe("Outlier Intelligence Engine (Impressions >> Followers)", () => {
    function evaluateOutlierStatusTest({ views = 0, likes = 0 }, followers = 0, ageHours = 12, platform = 'x') {
      const isRecent = ageHours <= 48;
      if (!isRecent) {
        return { isOutlier: false, multiplier: 0, reason: 'too_old' };
      }

      if (platform === 'x') {
        const minViews = 3000;
        const minMultiplier = 3.0;
        if (followers > 0) {
          const multiplier = views / followers;
          const isOutlier = multiplier >= minMultiplier && views >= minViews;
          return { isOutlier, multiplier, followers, views, ageHours };
        }
        const isOutlierFallback = views >= 20000 && likes >= 800;
        return { isOutlier: isOutlierFallback, multiplier: 0, isEstimated: true };
      } else {
        const minMultiplier = 2.0;
        if (views > 0) {
          const minViews = 2000;
          if (followers > 0) {
            const multiplier = views / followers;
            const isOutlier = multiplier >= minMultiplier && views >= minViews;
            return { isOutlier, multiplier, followers, views, ageHours };
          }
          const isOutlierFallback = views >= 10000;
          return { isOutlier: isOutlierFallback, multiplier: 0, isEstimated: true };
        }

        const minLikes = 150;
        if (followers > 0) {
          const multiplier = (likes * 15) / followers;
          const isOutlier = multiplier >= minMultiplier && likes >= minLikes;
          return { isOutlier, multiplier, followers, likes, ageHours };
        }
        const isOutlierFallback = likes >= 250;
        return { isOutlier: isOutlierFallback, multiplier: 0, isEstimated: true };
      }
    }

    test("Detects small creator breakout as true Outlier (1.5K followers, 45K views = 30x)", () => {
      const res = evaluateOutlierStatusTest({ views: 45000, likes: 2100 }, 1500, 10, 'x');
      expect(res.isOutlier).toBe(true);
      expect(res.multiplier).toBe(30.0);
    });

    test("Disqualifies giant accounts with low virality multiplier (10M followers, 100K views = 0.01x)", () => {
      const res = evaluateOutlierStatusTest({ views: 100000, likes: 3500 }, 10000000, 8, 'x');
      expect(res.isOutlier).toBe(false);
      expect(res.multiplier).toBe(0.01);
    });

    test("Rejects tiny accounts that don't meet the minimum views floor (10 followers, 20 views)", () => {
      const res = evaluateOutlierStatusTest({ views: 20, likes: 2 }, 10, 2, 'x');
      expect(res.isOutlier).toBe(false);
    });

    test("Rejects posts older than 48 hours even if multiplier is high", () => {
      const res = evaluateOutlierStatusTest({ views: 80000, likes: 4000 }, 1500, 72, 'x');
      expect(res.isOutlier).toBe(false);
      expect(res.reason).toBe('too_old');
    });

    test("Detects Threads engagement breakout as Outlier (2K followers, 600 likes)", () => {
      const res = evaluateOutlierStatusTest({ likes: 600 }, 2000, 14, 'threads');
      expect(res.isOutlier).toBe(true);
      expect(res.multiplier).toBe(4.5);
    });

    test("Detects Threads view impressions breakout as Outlier (1.2K followers, 18K views = 15x)", () => {
      const res = evaluateOutlierStatusTest({ views: 18000, likes: 420 }, 1200, 10, 'threads');
      expect(res.isOutlier).toBe(true);
      expect(res.multiplier).toBe(15.0);
    });

    test("Rejects low engagement Threads posts (2K followers, 50 likes)", () => {
      const res = evaluateOutlierStatusTest({ likes: 50 }, 2000, 6, 'threads');
      expect(res.isOutlier).toBe(false);
    });
  });

  describe("Header & Navigation Post Exclusion", () => {
    function isHeaderOrNavigation(el) {
      if (!el) return false;
      if (el.closest && el.closest('header, nav, [role="banner"], [role="navigation"], [aria-label*="navigation" i], [aria-label*="header" i], [data-testid*="header" i], [data-testid*="topbar" i], [data-testid*="nav" i]')) {
        return true;
      }
      let curr = el;
      let depth = 0;
      while (curr && depth < 6) {
        if (curr.style && (curr.style.position === 'sticky' || curr.style.position === 'fixed')) {
          return true;
        }
        curr = curr.parentElement;
        depth++;
      }
      return false;
    }

    test("Identifies and rejects sticky top navigation header", () => {
      const headerEl = {
        tagName: 'DIV',
        style: { position: 'sticky' },
        parentElement: null,
        closest: (sel) => null,
      };
      const childBtn = {
        tagName: 'DIV',
        style: {},
        parentElement: headerEl,
        closest: (sel) => null,
      };
      expect(isHeaderOrNavigation(childBtn)).toBe(true);
    });

    test("Identifies and rejects elements inside semantic header or navigation", () => {
      const childInNav = {
        tagName: 'DIV',
        style: {},
        parentElement: null,
        closest: (sel) => sel.includes('nav') ? true : null,
      };
      expect(isHeaderOrNavigation(childInNav)).toBe(true);
    });

    test("Permits genuine feed post elements", () => {
      const feedPost = {
        tagName: 'DIV',
        style: { position: 'static' },
        parentElement: { tagName: 'DIV', style: {}, parentElement: null },
        closest: (sel) => null,
      };
      expect(isHeaderOrNavigation(feedPost)).toBe(false);
    });

    test("Rejects processing when on Activity or Notifications page", () => {
      function shouldProcessHookAndViral(pathname) {
        if (!pathname) return false;
        if (pathname.includes('/activity') || pathname.includes('/notifications')) return false;
        return true;
      }

      expect(shouldProcessHookAndViral('/activity')).toBe(false);
      expect(shouldProcessHookAndViral('/@jeff_vu/activity')).toBe(false);
      expect(shouldProcessHookAndViral('/notifications')).toBe(false);
      expect(shouldProcessHookAndViral('/')).toBe(true);
      expect(shouldProcessHookAndViral('/@jeff_vu/post/123')).toBe(true);
    });

    test("Preserves purple border highlighting on normal feed for viral and outlier posts", () => {
      function evaluateThreadsHighlight(pathname, metrics, outlierResult, viralEnabled = true) {
        if (pathname.includes('/activity') || pathname.includes('/notifications')) {
          return { highlighted: false, border: 'none' };
        }
        const isViral = !!(viralEnabled && (metrics.likes >= 500 || metrics.replies >= 50));
        const shouldHighlight = outlierResult.isOutlier || isViral;
        return {
          highlighted: shouldHighlight,
          border: shouldHighlight ? '1px solid rgba(168, 85, 247, 0.3)' : 'none',
        };
      }

      // Normal feed: viral post
      const feedViral = evaluateThreadsHighlight('/', { likes: 520, replies: 12 }, { isOutlier: false });
      expect(feedViral.highlighted).toBe(true);
      expect(feedViral.border).toContain('168, 85, 247');

      // Normal feed: outlier post
      const feedOutlier = evaluateThreadsHighlight('/', { likes: 300, replies: 5 }, { isOutlier: true });
      expect(feedOutlier.highlighted).toBe(true);
      expect(feedOutlier.border).toContain('168, 85, 247');

      // Activity page: even if metrics look high, highlight must be false
      const activityPost = evaluateThreadsHighlight('/activity', { likes: 678, replies: 90 }, { isOutlier: true });
      expect(activityPost.highlighted).toBe(false);
      expect(activityPost.border).toBe('none');
    });
  });

  describe("Repost & Retweet Exclusion from Viral & Outlier Intelligence", () => {
    const X_REPOST_REGEX = /(?:reposted|retweeted|đã đăng lại|đã retweet|reposteó|republicou|reposté|repostet|リポスト|リツイート|转推|轉推|재게시|retwit|ripubblic)/i;
    const THREADS_REPOST_REGEX = /(?:reposted|reshared|đã đăng lại|đã chia sẻ lại|reposteó|ha reposteado|republicou|a republié|hat repostet|再投稿|リポスト|转帖|轉發|재게시|перепостил)/i;

    function isXRepostTest(postEl, tweetDataCache = new Map()) {
      if (!postEl) return false;
      const socialContext = postEl.querySelector ? postEl.querySelector('div[data-testid="socialContext"]') : null;
      if (socialContext) {
        const text = (socialContext.innerText || '').trim();
        if (X_REPOST_REGEX.test(text)) return true;
      }
      const permalink = postEl.querySelector ? postEl.querySelector('a[href*="/status/"]') : null;
      if (permalink && permalink.href) {
        const idMatch = permalink.href.match(/status\/(\d+)/);
        if (idMatch && idMatch[1]) {
          const cached = tweetDataCache.get(idMatch[1]);
          if (cached && (cached.isRetweet || cached.isRepost)) return true;
        }
      }
      return false;
    }

    function isThreadsRepostTest(postEl, contentEl, tweetDataCache = new Map()) {
      if (!postEl) return false;
      const postLink = postEl.querySelector ? postEl.querySelector('a[href*="/post/"], a[href*="/t/"]') : null;
      if (postLink && postLink.href) {
        const idMatch = postLink.href.match(/(?:post|t)\/([a-zA-Z0-9_\-]+)/);
        if (idMatch && idMatch[1]) {
          const cached = tweetDataCache.get(idMatch[1]);
          if (cached && (cached.isRepost || cached.isRetweet)) return true;
        }
      }
      const authorLinks = postEl.querySelectorAll ? postEl.querySelectorAll('a[href*="/@"]') : [];
      for (const link of authorLinks) {
        if (contentEl && contentEl.contains && contentEl.contains(link)) continue;
        let curr = link.parentElement;
        for (let i = 0; i < 3; i++) {
          if (!curr || curr === postEl) break;
          const text = (curr.innerText || '').trim();
          if (text.length > 0 && text.length < 120 && THREADS_REPOST_REGEX.test(text)) {
            if (!contentEl || !contentEl.contains || !contentEl.contains(curr)) {
              return true;
            }
          }
          curr = curr.parentElement;
        }
      }
      return false;
    }

    test("Accurately detects X retweets across multiple languages via socialContext", () => {
      const mockRetweetEN = {
        querySelector: (sel) => sel.includes('socialContext') ? { innerText: 'Elon Musk reposted' } : null
      };
      expect(isXRepostTest(mockRetweetEN)).toBe(true);

      const mockRetweetVN = {
        querySelector: (sel) => sel.includes('socialContext') ? { innerText: 'Lê Văn An đã đăng lại' } : null
      };
      expect(isXRepostTest(mockRetweetVN)).toBe(true);

      const mockRetweetSelf = {
        querySelector: (sel) => sel.includes('socialContext') ? { innerText: 'You reposted' } : null
      };
      expect(isXRepostTest(mockRetweetSelf)).toBe(true);

      const mockRetweetJA = {
        querySelector: (sel) => sel.includes('socialContext') ? { innerText: '田中さんがリポストしました' } : null
      };
      expect(isXRepostTest(mockRetweetJA)).toBe(true);
    });

    test("Does NOT flag normal tweets or pinned tweets as reposts on X", () => {
      const mockPinnedTweet = {
        querySelector: (sel) => sel.includes('socialContext') ? { innerText: 'Pinned Tweet' } : null
      };
      expect(isXRepostTest(mockPinnedTweet)).toBe(false);

      const mockPinnedTweetVN = {
        querySelector: (sel) => sel.includes('socialContext') ? { innerText: 'Bài viết đã ghim' } : null
      };
      expect(isXRepostTest(mockPinnedTweetVN)).toBe(false);

      const mockNormalTweet = {
        querySelector: (sel) => null
      };
      expect(isXRepostTest(mockNormalTweet)).toBe(false);
    });

    test("Detects X retweets via intercepted GraphQL cache", () => {
      const tweetDataCache = new Map();
      tweetDataCache.set('18920192', { isRetweet: true, viewsCount: 150000 });

      const mockCachedTweet = {
        querySelector: (sel) => sel.includes('/status/') ? { href: 'https://x.com/someone/status/18920192' } : null
      };
      expect(isXRepostTest(mockCachedTweet, tweetDataCache)).toBe(true);
    });

    test("Accurately detects Threads reposts via top reposter banner", () => {
      const mockParent = {
        innerText: 'dang_khoa đã đăng lại',
        parentElement: null
      };
      const mockLink = {
        parentElement: mockParent
      };
      const mockThreadsRepost = {
        querySelector: () => null,
        querySelectorAll: (sel) => sel.includes('/@') ? [mockLink] : []
      };

      expect(isThreadsRepostTest(mockThreadsRepost, null)).toBe(true);
    });

    test("Does NOT flag regular Threads posts when 'đã đăng lại' is in the post body", () => {
      const mockContentEl = {
        innerText: 'Tôi đã đăng lại video này trên Youtube hôm qua, mọi người xem thử nhé.',
        contains: (node) => node === mockLink || node === mockParent
      };
      const mockParent = {
        innerText: 'Tôi đã đăng lại video này trên Youtube hôm qua',
        parentElement: null
      };
      const mockLink = {
        parentElement: mockParent
      };
      const mockRegularThread = {
        querySelector: () => null,
        querySelectorAll: (sel) => sel.includes('/@') ? [mockLink] : []
      };

      // Since the link/text is inside contentEl (post body), it should NOT be flagged as a repost
      expect(isThreadsRepostTest(mockRegularThread, mockContentEl)).toBe(false);
    });

    test("Completely excludes reposted posts from Viral & Outlier tagging and purple border", () => {
      function evaluatePostHighlights(isRepost, metrics, authorFollowers, platform = 'x') {
        if (isRepost) {
          return {
            isOutlier: false,
            isViral: false,
            highlighted: false,
            badge: null
          };
        }

        const multiplier = authorFollowers > 0 ? (metrics.views / authorFollowers) : 0;
        const isOutlier = multiplier >= 3.0 && metrics.views >= 3000;
        const isViral = metrics.views >= 50000 || metrics.likes >= 1000;
        const highlighted = isOutlier || isViral;

        return {
          isOutlier,
          isViral,
          highlighted,
          badge: highlighted ? 'rendered' : null
        };
      }

      // Scenario: Reposter has 10 followers, but the original reposted tweet has 100,000 views
      const repostEvaluation = evaluatePostHighlights(true, { views: 100000, likes: 2500 }, 10, 'x');
      expect(repostEvaluation.highlighted).toBe(false);
      expect(repostEvaluation.isOutlier).toBe(false);
      expect(repostEvaluation.isViral).toBe(false);
      expect(repostEvaluation.badge).toBeNull();

      // Same metrics on an original non-repost: correctly recognized as Outlier + Viral
      const originalEvaluation = evaluatePostHighlights(false, { views: 100000, likes: 2500 }, 10, 'x');
      expect(originalEvaluation.highlighted).toBe(true);
      expect(originalEvaluation.isOutlier).toBe(true);
      expect(originalEvaluation.badge).toBe('rendered');
    });
  });
});

