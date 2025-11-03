'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import type { PledgeResult } from '@/types';

const twitterShareText = encodeURIComponent('I just pledged my loyalty to SentientMaxi. Are you worthy?');

function buildTwitterUrl(result: PledgeResult) {
  const quoteUrl = process.env.NEXT_PUBLIC_SENTIENT_TWEET_URL || 'https://twitter.com/SentientLLC/status/example';
  const composedText = `${twitterShareText}%0A%0A${encodeURIComponent(result.description)}%0A— ${encodeURIComponent(result.username)}`;
  return `https://twitter.com/intent/tweet?text=${composedText}&url=${encodeURIComponent(quoteUrl)}`;
}

type ResultCardProps = {
  result: PledgeResult;
  isOwnResult?: boolean;
};

function ResultCard({ result, isOwnResult }: ResultCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 transition hover:shadow-xl hover:shadow-slate-900/10 ${isOwnResult ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <Image src={result.profile_image_url} alt={`${result.username} avatar`} width={56} height={56} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Sentient Pledge</p>
              <h3 className="text-lg font-semibold text-slate-900">{result.username}</h3>
            </div>
          </div>
          <p className="text-base leading-relaxed text-slate-600">{result.description}</p>
          {isOwnResult ? (
            <p className="text-sm font-medium text-emerald-600">Sentient acknowledges your ambition first.</p>
          ) : null}
        </div>

        <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-900/80">
          <Image src="/pledge-frame.png" alt="Sentient pledge frame" fill className="object-cover" sizes="220px" />
          <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
            <Image src={result.profile_image_url} alt={`${result.username} composite`} fill className="object-cover" sizes="144px" />
          </div>
        </div>
      </div>
    </article>
  );
}

type ResultsBoardProps = {
  currentUserResult: PledgeResult | null;
  others: PledgeResult[];
};

export function ResultsBoard({ currentUserResult, others }: ResultsBoardProps) {
  const orderedResults = useMemo(() => {
    const rest = others.filter((result) => result.id !== currentUserResult?.id);
    return currentUserResult ? [currentUserResult, ...rest] : rest;
  }, [currentUserResult, others]);

  const shareUrl = currentUserResult ? buildTwitterUrl(currentUserResult) : null;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="space-y-4 text-center">
        <h2 className="text-3xl font-semibold text-slate-900">Hall of Worthy SentientMaxis</h2>
        <p className="text-base text-slate-500">
          Witness the latest pledges. Your devotion appears first; scroll to explore the rest of the loyal collective.
        </p>
        {shareUrl ? (
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white"
          >
            Share your results
          </a>
        ) : null}
      </header>

      <div className="grid gap-6">
        {orderedResults.map((result, index) => (
          <ResultCard key={result.id} result={result} isOwnResult={currentUserResult?.id === result.id && index === 0} />
        ))}
        {orderedResults.length === 0 ? (
          <p className="text-center text-sm font-medium text-slate-400">
            No pledges yet. Be the first to prove your worthiness.
          </p>
        ) : null}
      </div>
    </section>
  );
}
