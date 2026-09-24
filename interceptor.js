// Social Shield - Main World Network Interceptor
// Runs in world: "MAIN" at document_start to capture X and Threads GraphQL metrics cleanly.
(function () {
  'use strict';

  if (window.__socialShieldInterceptorInjected) return;
  window.__socialShieldInterceptorInjected = true;

  console.log('[Social Shield] 🛡️ Main World GraphQL Interceptor active.');

  function extractUserDataRecursively(obj, usersMap, tweetsMap) {
    if (!obj || typeof obj !== 'object') return;

    // 1. Detect Twitter/X User Object
    if (obj.__typename === 'User' || (obj.legacy && typeof obj.legacy.followers_count === 'number')) {
      const legacy = obj.legacy || obj;
      const screenName = legacy.screen_name || obj.screen_name;
      const followers = typeof legacy.followers_count === 'number' ? legacy.followers_count : obj.followers_count;
      if (screenName && typeof followers === 'number') {
        usersMap[screenName.toLowerCase()] = {
          screenName,
          name: legacy.name || obj.name || '',
          followersCount: followers,
          verified: !!(legacy.verified || obj.is_blue_verified),
          avatar: legacy.profile_image_url_https || obj.avatar || ''
        };
      }
    }

    // 2. Detect Threads / Meta User Object
    const u = obj.user || obj.author || (obj.__typename === 'User' ? obj : null);
    const targetUser = u || (obj.username ? obj : null);
    if (targetUser && (targetUser.username || targetUser.pk || targetUser.id)) {
      const username = targetUser.username || (typeof targetUser.screen_name === 'string' ? targetUser.screen_name : null);
      let followerCount = null;
      if (typeof targetUser.follower_count === 'number') followerCount = targetUser.follower_count;
      else if (typeof targetUser.followers_count === 'number') followerCount = targetUser.followers_count;
      else if (targetUser.edge_followed_by && typeof targetUser.edge_followed_by.count === 'number') followerCount = targetUser.edge_followed_by.count;

      if (username && typeof followerCount === 'number') {
        usersMap[username.toLowerCase()] = {
          screenName: username,
          name: targetUser.full_name || targetUser.name || '',
          followersCount: followerCount,
          avatar: targetUser.profile_pic_url || targetUser.profile_image_url_https || ''
        };
      }
    }

    // 3. Detect Threads Post Object
    if ((obj.code || obj.pk || obj.id) && (typeof obj.like_count === 'number' || typeof obj.reply_count === 'number' || Array.isArray(obj.thread_items))) {
      const threadCode = obj.code || obj.id || obj.pk;
      const userObj = obj.user || obj.author || {};
      const authorUsername = userObj.username || '';
      const authorFollowers = typeof userObj.follower_count === 'number' ? userObj.follower_count : (typeof userObj.followers_count === 'number' ? userObj.followers_count : 0);
      const isRepost = !!(obj.reshared_post || obj.repost || obj.is_reshare || (obj.reshare_count && obj.is_repost) || obj.repost_context || obj.thread_header || obj.repost_header || obj.repost_user);
      
      if (threadCode) {
        const existing = tweetsMap[String(threadCode)];
        const finalIsRepost = isRepost || !!(existing && (existing.isRepost || existing.isRetweet));

        tweetsMap[String(threadCode)] = {
          tweetId: String(threadCode),
          authorHandle: authorUsername ? '@' + authorUsername : (existing?.authorHandle || ''),
          followersCount: authorFollowers || existing?.followersCount || 0,
          viewsCount: obj.view_count || obj.impression_count || existing?.viewsCount || 0,
          createdAt: obj.taken_at ? new Date(obj.taken_at * 1000).toISOString() : (existing?.createdAt || ''),
          likes: obj.like_count || existing?.likes || 0,
          retweets: obj.reshare_count || existing?.retweets || 0,
          replies: obj.reply_count || existing?.replies || 0,
          bookmarks: 0,
          isRepost: finalIsRepost,
          isRetweet: finalIsRepost
        };

        if (obj.reshared_post?.code) {
          tweetsMap[String(obj.reshared_post.code)] = {
            ...(tweetsMap[String(obj.reshared_post.code)] || {}),
            isRepost: true,
            isRetweet: true,
          };
        }
      }
    }

    // 4. Detect Twitter/X Tweet Object
    if (obj.__typename === 'Tweet' || (obj.legacy && obj.rest_id)) {
      const restId = obj.rest_id;
      const legacy = obj.legacy || {};
      const viewsObj = obj.views || {};
      let viewsCount = 0;
      if (typeof viewsObj.count === 'string') viewsCount = parseInt(viewsObj.count, 10) || 0;
      else if (typeof viewsObj.count === 'number') viewsCount = viewsObj.count;

      const userObj = obj.core?.user_results?.result?.legacy || {};
      const authorHandle = userObj.screen_name || legacy.screen_name || '';
      const authorFollowers = typeof userObj.followers_count === 'number' ? userObj.followers_count : 0;
      const isRetweet = !!(legacy.retweeted_status_result || legacy.retweeted_status_id_str || obj.retweeted_status_result);

      if (restId) {
        const existing = tweetsMap[restId];
        const finalIsRetweet = isRetweet || !!(existing && (existing.isRetweet || existing.isRepost));

        tweetsMap[restId] = {
          tweetId: restId,
          authorHandle: authorHandle || existing?.authorHandle || '',
          followersCount: authorFollowers || existing?.followersCount || 0,
          viewsCount: viewsCount || existing?.viewsCount || 0,
          createdAt: legacy.created_at || existing?.createdAt || '',
          likes: legacy.favorite_count || existing?.likes || 0,
          retweets: legacy.retweet_count || existing?.retweets || 0,
          replies: legacy.reply_count || existing?.replies || 0,
          bookmarks: legacy.bookmark_count || existing?.bookmarks || 0,
          isRetweet: finalIsRetweet,
          isRepost: finalIsRetweet
        };

        // If this tweet is a Retweet of an inner tweet, also mark the inner tweet's rest_id as a Retweet
        const innerRestId = legacy.retweeted_status_result?.result?.rest_id || legacy.retweeted_status_id_str;
        if (innerRestId) {
          tweetsMap[innerRestId] = {
            ...(tweetsMap[innerRestId] || {}),
            isRetweet: true,
            isRepost: true,
          };
        }
      }
    }

    // Traverse arrays and child objects
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        extractUserDataRecursively(obj[i], usersMap, tweetsMap);
      }
    } else {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k === '__reactFiber' || k === '__reactProps') continue;
        extractUserDataRecursively(obj[k], usersMap, tweetsMap);
      }
    }
  }

  function handleInterception(url, json) {
    if (!json || typeof json !== 'object') return;
    try {
      const usersMap = {};
      const tweetsMap = {};
      extractUserDataRecursively(json, usersMap, tweetsMap);

      const userKeys = Object.keys(usersMap);
      const tweetKeys = Object.keys(tweetsMap);

      if (userKeys.length > 0 || tweetKeys.length > 0) {
        window.dispatchEvent(
          new CustomEvent('SOCIAL_SHIELD_INTERCEPTED_DATA', {
            detail: {
              url,
              users: usersMap,
              tweets: tweetsMap,
              timestamp: Date.now()
            }
          })
        );
      }
    } catch (e) {
      // Fail silently to never perturb the host page
    }
  }

  function isTargetApiUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('graphql') ||
           lower.includes('threads.net') ||
           lower.includes('threads.com') ||
           lower.includes('instagram.com/api') ||
           lower.includes('/i/api/') ||
           lower.includes('twitter.com') ||
           lower.includes('x.com');
  }

  // Monkey-patch window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
      if (isTargetApiUrl(url)) {
        const clone = response.clone();
        clone.json().then((json) => {
          handleInterception(url, json);
        }).catch(() => {});
      }
    } catch (err) {}
    return response;
  };

  // Monkey-patch XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._socialShieldUrl = typeof url === 'string' ? url : '';
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        const url = this._socialShieldUrl || '';
        if (isTargetApiUrl(url)) {
          if (this.responseText) {
            const json = JSON.parse(this.responseText);
            handleInterception(url, json);
          }
        }
      } catch (e) {}
    });
    return originalSend.apply(this, args);
  };
})();
