const form = document.getElementById('analyze-form');
const usernameInput = document.getElementById('username');
const submitButton = document.getElementById('submit-button');
const resultSection = document.getElementById('result');
const scoreIndicator = document.getElementById('score-indicator');
const scoreValue = document.getElementById('score-value');
const resultUsername = document.getElementById('result-username');
const resultTweetCount = document.getElementById('result-tweet-count');
const resultLastTweet = document.getElementById('result-last-tweet');
const resultComment = document.getElementById('result-comment');
const resultKeywords = document.getElementById('result-keywords');
const resultLogMessage = document.getElementById('result-log-message');
const keywordStatsBody = document.getElementById('keyword-stats-body');
const shareSection = document.getElementById('share-section');
const shareButton = document.getElementById('share-button');
const leaderboardSection = document.getElementById('leaderboard-section');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardStatus = document.getElementById('leaderboard-status');
const userRankLabel = document.getElementById('user-rank');

let latestShareUrl = null;

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? 'Analiz ediliyor…' : 'Analiz Et';
}

function resetScoreIndicator() {
  scoreIndicator.classList.remove('low', 'high');
}

function resetResults() {
  resultSection.classList.add('hidden');
  leaderboardSection.classList.add('hidden');
  resultKeywords.innerHTML = '';
  keywordStatsBody.innerHTML = '';
  resultComment.textContent = '';
  resultLastTweet.textContent = '';
  resultTweetCount.textContent = '-';
  resultUsername.textContent = '-';
  resultLogMessage.textContent = '';
  userRankLabel.textContent = '';
  leaderboardBody.innerHTML = '';
  leaderboardStatus.textContent = '';
  shareSection.classList.add('hidden');
  shareButton.disabled = true;
  shareButton.setAttribute('aria-disabled', 'true');
  latestShareUrl = null;
  resetScoreIndicator();
}

function renderKeywords(keywords) {
  resultKeywords.innerHTML = '';
  if (!Array.isArray(keywords) || keywords.length === 0) {
    const emptyMessage = document.createElement('span');
    emptyMessage.className = 'keyword-empty';
    emptyMessage.textContent = 'Sentient ile ilişkili anahtar kelime bulunamadı.';
    resultKeywords.appendChild(emptyMessage);
    return;
  }
  keywords.forEach((keyword) => {
    const tag = document.createElement('span');
    tag.textContent = `#${keyword}`;
    resultKeywords.appendChild(tag);
  });
}

function renderKeywordStats(stats) {
  keywordStatsBody.innerHTML = '';
  if (!Array.isArray(stats) || stats.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.textContent = 'Kelime istatistiği bulunamadı.';
    row.appendChild(cell);
    keywordStatsBody.appendChild(row);
    return;
  }

  stats.forEach((item) => {
    const row = document.createElement('tr');
    const keywordCell = document.createElement('td');
    keywordCell.textContent = item.keyword;
    const occurrencesCell = document.createElement('td');
    occurrencesCell.textContent = String(item.occurrences);
    const weightCell = document.createElement('td');
    weightCell.textContent = `x${item.weight}`;

    row.append(keywordCell, occurrencesCell, weightCell);
    keywordStatsBody.appendChild(row);
  });
}

function updateScore(score) {
  resetScoreIndicator();
  const numericScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const rounded = Math.round(numericScore);
  scoreValue.textContent = String(rounded);
  if (rounded <= 30) {
    scoreIndicator.classList.add('low');
  } else if (rounded >= 70) {
    scoreIndicator.classList.add('high');
  }
}

function formatKeywordSummary(keywordStats) {
  if (!Array.isArray(keywordStats) || keywordStats.length === 0) {
    return '—';
  }
  const topKeywords = keywordStats.slice(0, 3);
  return topKeywords.map((item) => `${item.keyword} (${item.occurrences})`).join(', ');
}

function renderLeaderboard(entries, currentUsername, rank, errorMessage) {
  leaderboardBody.innerHTML = '';
  const normalizedCurrent = (currentUsername || '').toLowerCase();

  if (errorMessage) {
    leaderboardStatus.textContent = `Sıralama alınamadı: ${errorMessage}`;
    leaderboardSection.classList.remove('hidden');
    return;
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    leaderboardStatus.textContent = 'Henüz topluluk sonucu bulunmuyor. İlk sırada sen olabilirsin!';
    leaderboardSection.classList.remove('hidden');
    return;
  }

  leaderboardStatus.textContent = 'Skorlar Supabase üzerinden en yüksekten düşüğe sıralanır.';
  entries.forEach((entry) => {
    const row = document.createElement('tr');
    if ((entry.username || '').toLowerCase() === normalizedCurrent) {
      row.classList.add('is-current');
    }

    const rankCell = document.createElement('td');
    rankCell.textContent = entry.rank ? `#${entry.rank}` : '—';

    const usernameCell = document.createElement('td');
    usernameCell.textContent = entry.username ? `@${entry.username}` : '—';

    const scoreCell = document.createElement('td');
    const displayScore = Number.isFinite(Number(entry.score)) ? Math.round(Number(entry.score)) : '—';
    scoreCell.textContent = typeof displayScore === 'number' ? `%${displayScore}` : displayScore;

    const tweetCountCell = document.createElement('td');
    tweetCountCell.textContent =
      typeof entry.tweetCount === 'number' ? entry.tweetCount.toLocaleString('tr-TR') : '—';

    const keywordsCell = document.createElement('td');
    keywordsCell.textContent = formatKeywordSummary(entry.keywordStats);

    row.append(rankCell, usernameCell, scoreCell, tweetCountCell, keywordsCell);
    leaderboardBody.appendChild(row);
  });

  leaderboardSection.classList.remove('hidden');

  if (typeof rank === 'number') {
    userRankLabel.textContent = `Sıran: #${rank}`;
  } else if (entries.length > 0) {
    userRankLabel.textContent = 'Sıralamada görünmek için Supabase kaydının başarılı olması gerekir.';
  } else {
    userRankLabel.textContent = '';
  }
}

function handleSupabaseMessage(supabaseLog) {
  if (!supabaseLog) {
    resultLogMessage.textContent = '';
    return;
  }

  if (supabaseLog.stored) {
    resultLogMessage.textContent = 'Supabase kaydı başarıyla güncellendi.';
  } else if (supabaseLog.error) {
    resultLogMessage.textContent = `Supabase kaydedilemedi: ${supabaseLog.error}`;
  } else {
    resultLogMessage.textContent = '';
  }
}

function prepareShare(shareIntent) {
  if (!shareIntent || !shareIntent.url) {
    shareSection.classList.add('hidden');
    shareButton.disabled = true;
    shareButton.setAttribute('aria-disabled', 'true');
    latestShareUrl = null;
    return;
  }

  latestShareUrl = shareIntent.url;
  shareButton.disabled = false;
  shareButton.setAttribute('aria-disabled', 'false');
  shareSection.classList.remove('hidden');
}

resetResults();

shareButton.addEventListener('click', () => {
  if (!latestShareUrl) {
    return;
  }
  window.open(latestShareUrl, '_blank', 'noopener');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim().replace(/^@+/, '');
  if (!username) {
    return;
  }

  resetResults();
  setLoading(true);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Analiz işlemi başarısız oldu.');
    }

    const {
      score,
      comment,
      username: normalizedUsername,
      tweetCount,
      lastTweet,
      keywords,
      keywordStats,
      supabaseLog,
      leaderboard,
      leaderboardError,
      rank,
      shareIntent
    } = payload;

    updateScore(score);
    resultUsername.textContent = normalizedUsername ? `@${normalizedUsername}` : '-';
    resultTweetCount.textContent =
      typeof tweetCount === 'number' ? tweetCount.toLocaleString('tr-TR') : '-';
    resultLastTweet.textContent = lastTweet || 'Tweet bulunamadı.';
    resultComment.textContent = comment;
    renderKeywords(keywords);
    renderKeywordStats(keywordStats);
    handleSupabaseMessage(supabaseLog);
    prepareShare(shareIntent);

    resultSection.classList.remove('hidden');

    renderLeaderboard(leaderboard, normalizedUsername, rank, leaderboardError);
  } catch (error) {
    resultComment.textContent = error.message;
    resultSection.classList.remove('hidden');
    scoreIndicator.classList.add('low');
  } finally {
    setLoading(false);
  }
});
