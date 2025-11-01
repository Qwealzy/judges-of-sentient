const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_ANALYSIS_TABLE || 'analysis_logs';
const SUPABASE_ON_CONFLICT = process.env.SUPABASE_ON_CONFLICT || 'username';
const SUPABASE_LEADERBOARD_LIMIT = Number.parseInt(
  process.env.SUPABASE_LEADERBOARD_LIMIT || '25',
  10
);

function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function logAnalysis(payload) {
  if (!isConfigured()) {
    return {
      stored: false,
      error: 'Supabase yapılandırması eksik. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlayın.'
    };
  }

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`);
    if (SUPABASE_ON_CONFLICT) {
      url.searchParams.set('on_conflict', SUPABASE_ON_CONFLICT);
    }
    url.searchParams.set(
      'select',
      'id,username,score,tweet_count,keywords,keyword_stats,raw_score,updated_at,created_at'
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify([
        {
          username: payload.username,
          score: payload.score,
          keywords: payload.keywords,
          keyword_stats: payload.keywordStats,
          tweet_count: payload.tweetCount,
          raw_score: payload.rawScore,
          twitter_error: payload.twitterError,
          updated_at: new Date().toISOString()
        }
      ])
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message || response.statusText;
      throw new Error(message);
    }

    const data = await response.json().catch(() => []);
    const entry = data?.[0]
      ? {
          id: data[0].id ?? null,
          username: data[0].username ?? payload.username,
          score: data[0].score ?? payload.score,
          tweetCount: data[0].tweet_count ?? payload.tweetCount,
          keywords: data[0].keywords ?? payload.keywords,
          keywordStats: data[0].keyword_stats ?? payload.keywordStats,
          rawScore: data[0].raw_score ?? payload.rawScore,
          updatedAt: data[0].updated_at ?? data[0].created_at ?? new Date().toISOString()
        }
      : null;
    return {
      stored: true,
      id: entry?.id ?? null,
      entry
    };
  } catch (error) {
    return {
      stored: false,
      error: error.message
    };
  }
}

async function fetchLeaderboard(limit = SUPABASE_LEADERBOARD_LIMIT) {
  if (!isConfigured()) {
    throw new Error('Supabase yapılandırması yapılmadı.');
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`);
  url.searchParams.set(
    'select',
    'username,score,tweet_count,keywords,keyword_stats,raw_score,updated_at,created_at'
  );
  url.searchParams.set('order', 'score.desc');
  if (Number.isFinite(limit) && limit > 0) {
    url.searchParams.set('limit', String(limit));
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.message || response.statusText;
    throw new Error(message);
  }

  const data = await response.json().catch(() => []);
  return data.map((entry) => ({
    username: entry.username,
    score: entry.score,
    tweetCount: entry.tweet_count,
    keywords: entry.keywords,
    keywordStats: entry.keyword_stats,
    rawScore: entry.raw_score,
    updatedAt: entry.updated_at || entry.created_at
  }));
}
module.exports = {
  logAnalysis,
  fetchLeaderboard,
  isConfigured
};
