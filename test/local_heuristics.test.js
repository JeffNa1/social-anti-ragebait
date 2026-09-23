import { describe, expect, test } from "bun:test";

describe("Local Heuristic & Regex Classification Engine (0ms No-Jev Mode)", () => {
  const LOCAL_RAGEBAIT_REGEX = new RegExp(
    '(' +
    'đụ|đĩ|đcm|đclm|đmm|dkm|đkm|vcl|vcc|vđ|vl|vlon|đéo|lồn|cặc|buồi|chó đẻ|óc chó|súc vật|bần nông|ngu lồn|ngu vl|hãm lồn|thất học|vô học|rác rưởi|mất dạy|khốn nạn|hạ đẳng|chết mẹ mày đi|cút mẹ mày đi|bú fame|đú bẩn|mặt dày|đéo biết nhục|ngu như chó|ngu như bò|não tàn|đần độn|ngáo chó' +
    '|stfu|bitch|bastard|retard|idiot|moron|dumbass|asshole|bullshit|trash take|scumbag|pieces? of shit|kill yourself' +
    '|bắc kỳ|nam kỳ|pbvm|bake|namke|bò đỏ|ba que|3 que|đu càng|dlv|dư luận viên|ngạo nghễ|tự nhục|cali khát nước|khát nước|bọn vện|lũ mọi' +
    '|bóc phốt|hóng phốt|biến căng|drama cực căng|scandal chấn động|tẩy chay|con giáp thứ 13|tiểu tam|trà xanh giật chồng|đánh ghen|lột đồ|khoe hàng|chửi nhau|thứ dơ bẩn|mặt phụ khoa' +
    ')',
    'i'
  );

  const LOCAL_SCAM_REGEX = new RegExp(
    '(' +
    'tuyển\\s*(cộng tác viên|ctv)|việc\\s*nhẹ\\s*lương\\s*cao|thu\\s*nhập\\s*\\d+\\s*(k|tr|triệu|củ)\\s*/\\s*(ngày|tháng)|không\\s*cọc\\s*không\\s*vốn|làm\\s*tại\\s*nhà\\s*lương\\s*khủng|nhận\\s*việc\\s*ngay|ib\\s*nhận\\s*việc|công\\s*việc\\s*online\\s*uy\\s*tín' +
    '|tài\\s*xỉu|nổ\\s*hũ|bắn\\s*cá|đánh\\s*bài\\s*online|cổng\\s*game\\s*quốc\\s*tế|nhà\\s*cái\\s*uy\\s*tín|kubet|thabet|sunwin|go88|b52|rikvip|cá\\s*cược\\s*bóng\\s*đá|kèo\\s*nhà\\s*cái' +
    '|bao\\s*lỗ\\s*100%|cam\\s*kết\\s*lợi\\s*nhuận|kèo\\s*x\\d+|kéo\\s*về\\s*bờ|nhóm\\s*kéo\\s*vốn|phím\\s*lệnh\\s*chuẩn|room\\s*vip\\s*phím\\s*hàng|đầu\\s*tư\\s*sinh\\s*lời\\s*khủng|rút\\s*tiền\\s*trong\\s*ngày|lãi\\s*suất\\s*\\d+%/\\s*(ngày|tuần)|hoa\\s*hồng\\s*lên\\s*đến\\s*\\d+%' +
    '|t\\.me/[a-zA-Z0-9_\\+]+|zalo\\.me/g/[a-zA-Z0-9_]+|link\\s*rút\\s*gọn|nhận\\s*thưởng\\s*miễn\\s*phí|tặng\\s*code\\s*\\d+k' +
    ')',
    'i'
  );

  const LOCAL_SEEDING_REGEX = new RegExp(
    '(' +
    'link\\s*(mua|săn|sale|ở|trong)?\\s*(bio|cmt|comment|bình luận|bên dưới|dưới cmt)|mua\\s*(ở|tại)\\s*đây\\s*nha|săn\\s*sale\\s*(shopee|lazada|tiktok\\s*shop)|shope\\.ee/[a-zA-Z0-9]+|s\\.lazada\\.vn/[a-zA-Z0-9]+|vt\\.tiktok\\.com/[a-zA-Z0-9]+' +
    '|mình\\s*cũng\\s*từng\\s*bị\\s*và\\s*(đã\\s*khỏi|chữa\\s*khỏi|thành\\s*công)\\s*nhờ|ai\\s*cần\\s*(inbox|ib)\\s*(mình|em)|chấm\\s*(hóng|nhận)\\s*inbox|em\\s*chỉ\\s*cách\\s*kiếm\\s*tiền|quan\\s*tâm\\s*chấm\\s*em\\s*inbox|mình\\s*mua\\s*set\\s*này\\s*ở\\s*shop' +
    ')',
    'i'
  );

  const LOCAL_MEME_REGEX = /(?:haha+|hài\s*vcl|cười\s*ỉa|cười\s*vãi|lmao+|rofl|chúa\s*hề|meme\s*chất|bựa\s*vcl|🤣|😂|cười\s*sặc)/i;
  const LOCAL_WHOLESOME_REGEX = /(?:ấm\s*lòng|tuyệt\s*vời\s*quá|biết\s*ơn|đáng\s*yêu\s*vãi|tự\s*hào\s*quá|chúc\s*mừng|hạnh\s*phúc\s*quá|wholesome|tình\s*người|nghĩa\s*cử\s*cao\s*đẹp)/i;
  const LOCAL_MOTIVATIONAL_REGEX = /(?:nỗ\s*lực|kỷ\s*luật\s*bản\s*thân|thói\s*quen\s*tốt|vượt\s*qua\s*nghịch\s*cảnh|không\s*bao\s*giờ\s*bỏ\s*cuộc|thành\s*công\s*sẽ\s*đến|tư\s*duy\s*triệu\s*phú|bài\s*học\s*cuộc\s*sống|động\s*lực\s*mỗi\s*ngày)/i;

  function classifyWithLocalHeuristics(text) {
    if (!text || typeof text !== 'string') return null;
    const clean = text.trim();
    if (clean.length < 2) return null;

    const scores = {};
    let matched = false;

    if (LOCAL_SCAM_REGEX.test(clean)) {
      scores['scam / fraudulent scheme'] = 0.96;
      matched = true;
    }

    if (LOCAL_RAGEBAIT_REGEX.test(clean)) {
      scores['rage bait / toxic / hostile / dismissive negativity'] = 0.95;
      matched = true;
    }

    if (LOCAL_SEEDING_REGEX.test(clean)) {
      scores['bot seeding / affiliate spam / fake review'] = 0.94;
      matched = true;
    }

    if (LOCAL_MEME_REGEX.test(clean)) {
      scores['meme / humor / satire'] = 0.88;
      matched = true;
    }
    if (LOCAL_WHOLESOME_REGEX.test(clean)) {
      scores['wholesome / positive'] = 0.88;
      matched = true;
    }
    if (LOCAL_MOTIVATIONAL_REGEX.test(clean)) {
      scores['self-improvement / motivational'] = 0.88;
      matched = true;
    }

    return matched ? { scores } : null;
  }

  describe("Ragebait & Toxicity Detection", () => {
    test("Detects offensive slurs and severe cursing", () => {
      const sample1 = "Mẹ cái thằng ngu lồn này sủa bậy bạ";
      const res1 = classifyWithLocalHeuristics(sample1);
      expect(res1).not.toBeNull();
      expect(res1.scores['rage bait / toxic / hostile / dismissive negativity']).toBeGreaterThanOrEqual(0.9);

      const sample2 = "Biến căng cực đại bóc phốt tiểu tam giật chồng";
      const res2 = classifyWithLocalHeuristics(sample2);
      expect(res2).not.toBeNull();
      expect(res2.scores['rage bait / toxic / hostile / dismissive negativity']).toBeGreaterThanOrEqual(0.9);
    });

    test("Detects toxic regional conflict baiting", () => {
      const sample = "Bọn bắc kỳ ăn cá rô cây suốt ngày ngạo nghễ";
      const res = classifyWithLocalHeuristics(sample);
      expect(res).not.toBeNull();
      expect(res.scores['rage bait / toxic / hostile / dismissive negativity']).toBeGreaterThanOrEqual(0.9);
    });

    test("Detects English hostility", () => {
      const sample = "Shut up you absolute dumbass, trash take";
      const res = classifyWithLocalHeuristics(sample);
      expect(res).not.toBeNull();
      expect(res.scores['rage bait / toxic / hostile / dismissive negativity']).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe("Scam & Financial Fraud Detection", () => {
    test("Detects online job CTV scam templates", () => {
      const sample = "Tuyển CTV làm việc nhẹ lương cao không cọc không vốn ngày 500k";
      const res = classifyWithLocalHeuristics(sample);
      expect(res).not.toBeNull();
      expect(res.scores['scam / fraudulent scheme']).toBeGreaterThanOrEqual(0.95);
    });

    test("Detects online gambling & financial pump and dump", () => {
      const sample = "Cổng game tài xỉu nổ hũ uy tín số 1, vào room vip phím lệnh bao lỗ 100% t.me/vipcrypto";
      const res = classifyWithLocalHeuristics(sample);
      expect(res).not.toBeNull();
      expect(res.scores['scam / fraudulent scheme']).toBeGreaterThanOrEqual(0.95);
    });
  });

  describe("Bot Seeding & Affiliate Link Detection", () => {
    test("Detects affiliate link spam and bio redirection", () => {
      const sample = "Mọi người mua ở link bio nha, săn sale shopee shope.ee/abc1234";
      const res = classifyWithLocalHeuristics(sample);
      expect(res).not.toBeNull();
      expect(res.scores['bot seeding / affiliate spam / fake review']).toBeGreaterThanOrEqual(0.9);
    });

    test("Detects fake bot review seeding", () => {
      const sample = "Em cũng từng bị mụn nặng và đã chữa khỏi nhờ chị @lan, ai cần ib em chỉ cách";
      const res = classifyWithLocalHeuristics(sample);
      expect(res).not.toBeNull();
      expect(res.scores['bot seeding / affiliate spam / fake review']).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe("Positive & Casual Heuristic Tagging", () => {
    test("Tags meme and wholesome content correctly", () => {
      const memeSample = "Xem quả ảnh này cười ỉa haha lmaooo";
      const memeRes = classifyWithLocalHeuristics(memeSample);
      expect(memeRes).not.toBeNull();
      expect(memeRes.scores['meme / humor / satire']).toBe(0.88);

      const wholesomeSample = "Hình ảnh cụ già ấm lòng và tuyệt vời quá";
      const wholesomeRes = classifyWithLocalHeuristics(wholesomeSample);
      expect(wholesomeRes).not.toBeNull();
      expect(wholesomeRes.scores['wholesome / positive']).toBe(0.88);
    });

    test("Returns null for neutral casual text without false positives", () => {
      const neutral = "Hôm nay trời nhiều mây, chiều có thể mưa nhẹ ở quận 1";
      const res = classifyWithLocalHeuristics(neutral);
      expect(res).toBeNull();
    });
  });
});
