const { fetchTwitterProfile } = require('./twitter');
const { logAnalysis, fetchLeaderboard, isConfigured: isSupabaseConfigured } = require('./supabase');

const SHARE_REFERENCE_URL =
  process.env.SHARE_REFERENCE_URL || 'https://twitter.com/sentientlabs/status/0000000000000000000';
const LEADERBOARD_FALLBACK_LIMIT = 25;

const KEYWORD_GROUPS = [
  { weight: 6, keywords: ['sentient', 'sentience', 'sentiyent', 'sentientism'] },
  { weight: 5, keywords: ['sentient labs', 'sentient ai', 'sentient project'] },
  { weight: 4, keywords: ['artificial intelligence', 'ai', 'yapay zeka', 'machine learning', 'ml'] },
  { weight: 4, keywords: ['consciousness', 'bilinç', 'self-aware', 'awareness'] },
  { weight: 3, keywords: ['alignment', 'ai safety', 'etik', 'ethics'] },
  { weight: 3, keywords: ['philosophy', 'felsefe', 'mind', 'zihin'] },
  { weight: 2, keywords: ['robot', 'android', 'otonom', 'autonomous'] },
  { weight: 2, keywords: ['emergence', 'qualia', 'sentinel', 'sapience'] }
];

const MAX_OCCURRENCES_PER_GROUP = 5;
const MAX_RAW_SCORE =
  KEYWORD_GROUPS.reduce((total, group) => total + group.weight * MAX_OCCURRENCES_PER_GROUP, 0) + 25;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normaliseScore(rawScore) {
  const score = Math.round((rawScore / MAX_RAW_SCORE) * 100);
  return Math.min(100, Math.max(0, score));
}

function analyseTextSegments(segments) {
  const joined = segments.filter(Boolean).join('\n').toLowerCase();
  let rawScore = 0;
  const matchedKeywords = new Set();
  const keywordMatches = [];

  KEYWORD_GROUPS.forEach((group) => {
    let groupCount = 0;
    group.keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, 'g');
      const occurrences = joined.match(regex)?.length ?? 0;
      if (occurrences > 0) {
        matchedKeywords.add(keyword.toLowerCase());
        groupCount += Math.min(occurrences, MAX_OCCURRENCES_PER_GROUP);
        keywordMatches.push({ keyword, occurrences, weight: group.weight });
      }
    });
    if (groupCount > 0) {
      rawScore += group.weight * Math.min(groupCount, MAX_OCCURRENCES_PER_GROUP);
    }
  });

  const diversityBonus = Math.min(matchedKeywords.size, 12) * 1.5;
  rawScore += diversityBonus;

  const keywordStats = keywordMatches
    .map((entry) => ({
      keyword: entry.keyword,
      occurrences: entry.occurrences,
      weight: entry.weight
    }))
    .sort((a, b) => {
      if (b.occurrences !== a.occurrences) {
        return b.occurrences - a.occurrences;
      }
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }
      return a.keyword.localeCompare(b.keyword);
    });

  return {
    rawScore,
    score: normaliseScore(rawScore),
    keywords: Array.from(matchedKeywords).sort(),
    keywordStats
  };
}

function generateComment(score, context) {
  if (!context.tweets || context.tweets.length === 0) {
    return 'Kullanıcının herkese açık tweet verisi bulunamadı. Daha doğru sonuçlar için hesabın tweet paylaşıyor olması gerekir.';
  }

  if (score >= 75) {
    return 'Tweetlerin büyük bir kısmı Sentient, yapay zeka ve bilinç temaları etrafında dönüyor. Kullanıcı ciddi anlamda Sentient topluluğuna odaklanmış görünüyor.';
  }
  if (score >= 50) {
    return 'Sentient ve yapay zeka konuları düzenli olarak konuşuluyor; ancak içerikte farklı temalar da yer alıyor. Kullanıcı topluluğa aşina görünüyor.';
  }
  if (score >= 30) {
    return 'Ara sıra Sentient veya yapay zeka ile ilgili paylaşımlar var fakat odak noktası bu değil. Daha fazla içerik gerekli.';
  }
  return 'Sentient konseptine dair güçlü bir sinyal bulunamadı. Kullanıcı farklı temalara ağırlık veriyor olabilir.';
}

async function analyzeSentientAffinity(username) {
  const twitterData = await fetchTwitterProfile(username);

  const tweets = twitterData.tweets ?? [];
  const segments = [
    twitterData.user?.description ?? '',
    ...tweets.map((tweet) => tweet.text ?? '')
  ];

  const { score, rawScore, keywords, keywordStats } = analyseTextSegments(segments);
  const comment = twitterData.success
    ? generateComment(score, { tweets })
    : twitterData.error || 'Twitter verilerine erişilemedi.';

  const payload = {
    username: twitterData.username ?? username,
    score,
    rawScore,
    comment,
    tweetCount: twitterData.tweetCount ?? tweets.length,
    lastTweet: twitterData.lastTweet ?? null,
    keywords,
    keywordStats,
    twitterError: twitterData.success ? null : twitterData.error
  };

  const supabaseLog = await logAnalysis({
    username: payload.username,
    score: payload.score,
    keywords: payload.keywords,
    keywordStats: payload.keywordStats,
    tweetCount: payload.tweetCount,
    rawScore: payload.rawScore,
    twitterError: payload.twitterError
  });

  let leaderboard = [];
  let leaderboardError = null;
  if (isSupabaseConfigured()) {
    try {
      leaderboard = await fetchLeaderboard();
    } catch (error) {
      leaderboardError = error.message;
    }
  }

  const normalizedUsername = (payload.username || username).toLowerCase();
  const leaderboardEntries = Array.isArray(leaderboard) ? [...leaderboard] : [];

  if (supabaseLog?.entry) {
    const existingIndex = leaderboardEntries.findIndex(
      (entry) => (entry.username || '').toLowerCase() === normalizedUsername
    );
    if (existingIndex >= 0) {
      leaderboardEntries[existingIndex] = {
        ...leaderboardEntries[existingIndex],
        ...supabaseLog.entry
      };
    } else {
      leaderboardEntries.push(supabaseLog.entry);
    }
  } else if (
    !leaderboardEntries.some((entry) => (entry.username || '').toLowerCase() === normalizedUsername)
  ) {
    leaderboardEntries.push({
      username: payload.username,
      score: payload.score,
      tweetCount: payload.tweetCount,
      keywords: payload.keywords,
      keywordStats: payload.keywordStats,
      rawScore: payload.rawScore,
      updatedAt: new Date().toISOString()
    });
  }

  leaderboardEntries.sort((a, b) => {
    const scoreA = Number.isFinite(Number(a.score)) ? Number(a.score) : 0;
    const scoreB = Number.isFinite(Number(b.score)) ? Number(b.score) : 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return updatedA - updatedB;
  });

  const overallRankIndex = leaderboardEntries.findIndex(
    (entry) => (entry.username || '').toLowerCase() === normalizedUsername
  );
  const rank = overallRankIndex >= 0 ? overallRankIndex + 1 : null;

  let trimmedLeaderboard = leaderboardEntries.slice(0, LEADERBOARD_FALLBACK_LIMIT);
  if (
    overallRankIndex >= LEADERBOARD_FALLBACK_LIMIT &&
    LEADERBOARD_FALLBACK_LIMIT > 0 &&
    leaderboardEntries[overallRankIndex]
  ) {
    trimmedLeaderboard = [
      ...trimmedLeaderboard.slice(0, Math.max(LEADERBOARD_FALLBACK_LIMIT - 1, 0)),
      leaderboardEntries[overallRankIndex]
    ];
  } else if (LEADERBOARD_FALLBACK_LIMIT <= 0 && overallRankIndex >= 0) {
    trimmedLeaderboard = [leaderboardEntries[overallRankIndex]];
  }

  const formattedLeaderboard = trimmedLeaderboard.map((entry) => {
    const entryRank =
      leaderboardEntries.findIndex(
        (candidate) => (candidate.username || '').toLowerCase() === (entry.username || '').toLowerCase()
      ) + 1;

    return {
      rank: entryRank > 0 ? entryRank : null,
      username: entry.username,
      score: entry.score,
      tweetCount: entry.tweetCount,
      keywords: entry.keywords,
      keywordStats: entry.keywordStats,
      rawScore: entry.rawScore,
      updatedAt: entry.updatedAt
    };
  });

  const roundedScore = Math.round(payload.score);
  const shareText = `Sentient uyumluluk skorum %${roundedScore}${
    rank ? ` (${rank}. sıradayım)` : ''
  }! Sen de kendi skorunu öğren.`;
  const shareIntentUrl = new URL('https://twitter.com/intent/tweet');
  shareIntentUrl.searchParams.set('text', shareText);
  if (SHARE_REFERENCE_URL) {
    shareIntentUrl.searchParams.set('url', SHARE_REFERENCE_URL);
  }

  return {
    ...payload,
    supabaseLog,
    leaderboard: formattedLeaderboard,
    leaderboardError,
    rank,
    shareIntent: {
      text: shareText,
      url: shareIntentUrl.toString(),
      referenceUrl: SHARE_REFERENCE_URL
    }
  };
}

module.exports = {
  analyzeSentientAffinity,
  KEYWORD_GROUPS
};
