'use client';

import Image, { type StaticImageData } from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import type { PledgeResult } from '@/types';

import { resultSceneSrc } from '@/lib/resultScene';

const twitterShareText = encodeURIComponent('I just pledged my loyalty to SentientMaxi. Are you worthy?');

const RING_COUNTS = [8, 16, 24];
const DEFAULT_RING_COUNT = 24;
const RING_BASE_RADIUS = 260;
const RING_RADIUS_STEP = 120;

type ImageAsset = string | StaticImageData;

function buildTwitterUrl(result: PledgeResult) {
  const quoteUrl =
    process.env.NEXT_PUBLIC_SENTIENT_TWEET_URL || process.env.NEXT_PUBLIC_SENTIENT_QUOTE_LINK || 'https://x.com/GGodsonits';
  const composedText = `${twitterShareText}%0A%0A${encodeURIComponent(`"${result.description}"`)}`;
  return `https://twitter.com/intent/tweet?text=${composedText}&url=${encodeURIComponent(quoteUrl)}`;
}

function partitionRings(participants: PledgeResult[]) {
  const rings: PledgeResult[][] = [];
  let index = 0;
  let ringIndex = 0;

  while (index < participants.length) {
    const ringSize = RING_COUNTS[ringIndex] ?? DEFAULT_RING_COUNT;
    rings.push(participants.slice(index, index + ringSize));
    index += ringSize;
    ringIndex += 1;
  }

  return rings;
}

type ResultCardProps = {
  result: PledgeResult;
  isOwnResult?: boolean;
};

function ResultCard({ result, isOwnResult }: ResultCardProps) {
  const baseClasses =
    'flex h-full items-start gap-3 rounded-xl border border-slate-200/70 bg-white/80 p-3 text-sm shadow-sm shadow-slate-900/5 backdrop-blur transition hover:border-slate-300 sm:p-4';
  const highlightedClasses = isOwnResult ? ' ring-2 ring-indigo-500/80' : '';
  
  return (
    <li className={`${baseClasses}${highlightedClasses}`}>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <p className="text-xs font-semibold text-slate-900">{result.username}</p>
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-amber-200/60 bg-slate-100 shadow">
          <Image
            src={result.profile_image_url}
            alt={`${result.username} avatar`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      </div>
    <p className="flex-1 text-left text-xs leading-relaxed text-slate-600">{result.description}</p>
    </li>
  );
}

type ResultsBoardLayoutProps = {
  dominantResult: PledgeResult | null;
  rings: PledgeResult[][];
  orderedResults: PledgeResult[];
  isOwnDominant: boolean;
  isSharing: boolean;
  onShare: () => void;
  sceneSrc: ImageAsset;
};

const ResultsBoardLayout = ({
  dominantResult,
  rings,
  orderedResults,
  isOwnDominant,
  isSharing,
  onShare,
  sceneSrc
}: ResultsBoardLayoutProps) => {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12">
      {dominantResult ? (
        <div className="flex flex-col items-center gap-10">
          <div className="relative hidden aspect-square w-full max-w-[960px] items-center justify-center md:flex">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-indigo-900/40 via-slate-900/30 to-transparent blur-3xl" />
            <div className="relative flex w-[60%] max-w-[620px] flex-col items-start gap-6">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[36px] border border-amber-500/40 bg-black/40 shadow-[0_25px_80px_rgba(88,28,135,0.35)]">
                <Image src={sceneSrc} alt="Sentient decree" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-transparent to-black/55" />
                <div className="absolute bottom-10 left-12 flex flex-col items-start gap-3">
                  <div className="rounded-2xl bg-black/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-amber-200/80 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                    {dominantResult.username}
                  </div>
                  <div className="absolute bottom-10 left-12 flex flex-col items-start gap-3">
                    <Image
                      src={dominantResult.profile_image_url}
                      alt={`${dominantResult.username} avatar`}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col items-center gap-4 text-center">
                <p className="max-w-[420px] text-base font-semibold leading-relaxed text-black">
                  {dominantResult.description}
                </p>
                {isOwnDominant ? (
                  <button
                    type="button"
                    onClick={onShare}
                    disabled={isSharing}
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-100 shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSharing ? 'Preparing share…' : 'Share your results'}
                  </button>
                ) : null}
              </div>
            </div>

            {rings.map((ring, ringIndex) => {
              if (ring.length === 0) {
                return null;
              }

              const avatarSize = Math.max(72 - ringIndex * 6, 48);
              const orbitRadius = RING_BASE_RADIUS + RING_RADIUS_STEP * ringIndex + 210;

              return (
                <div key={`ring-${ringIndex}`} className="pointer-events-none absolute inset-0">
                  <div
                    className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500/25 md:block"
                    style={{ width: orbitRadius * 2 + 200, height: orbitRadius * 2 + 200 }}
                  />
                  {ring.map((entry, index) => {
                    const angle = (index / ring.length) * Math.PI * 2 - Math.PI / 2;
                    const x = Math.cos(angle) * orbitRadius;
                    const y = Math.sin(angle) * orbitRadius;

                    return (
                      <div
                        key={entry.id}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                      >
                        <div className="relative overflow-hidden rounded-full border-4 border-amber-300/80 bg-black/60 shadow-xl" style={{ height: avatarSize, width: avatarSize }}>
                          <Image src={entry.profile_image_url} alt={`${entry.username} avatar`} fill className="object-cover" sizes="96px" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex w-full flex-col gap-4 md:hidden">
            <div className="relative overflow-hidden rounded-[28px] border border-amber-500/40 bg-black/40 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900/40 via-slate-900/20 to-transparent" aria-hidden />
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[24px]">
                <Image src={sceneSrc} alt="Sentient decree" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-transparent to-black/60" />
                <div className="absolute bottom-4 left-6 flex flex-col items-start gap-2">
                  <div className="rounded-2xl bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80">
                    {dominantResult.username}
                  </div>
                  <div className="h-24 w-24 overflow-hidden rounded-[18px] border-4 border-amber-200/90 shadow-xl">
                    <Image src={dominantResult.profile_image_url} alt={`${dominantResult.username} avatar`} fill className="object-cover" sizes="96px" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="max-w-[420px] text-sm font-semibold leading-relaxed text-black">
                {dominantResult.description}
              </p>
              {isOwnDominant ? (
                <button
                  type="button"
                  onClick={onShare}
                  disabled={isSharing}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-indigo-100 shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSharing ? 'Preparing share…' : 'Share your results'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {orderedResults.map((result, index) => (
          <ResultCard key={result.id} result={result} isOwnResult={dominantResult?.id === result.id && index === 0} />
        ))}
      </ul>
      {orderedResults.length === 0 ? (
        <p className="text-center text-sm font-medium text-slate-400">
          No pledges yet. Be the first to prove your worthiness.
        </p>
      ) : null}
    </section>
  );
};  
      
type ResultsBoardProps = {
  currentUserResult: PledgeResult | null;
  others: PledgeResult[];
};

export function ResultsBoard({ currentUserResult, others }: ResultsBoardProps) {
  const limitedOthers = useMemo(() => {
    if (others.length <= 30) {
      return others;
    }

    const shuffled = [...others];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 30);
  }, [others]);

  const dominantResult = useMemo<PledgeResult | null>(() => {
    if (currentUserResult) {
      return currentUserResult;
    }

    return limitedOthers[0] ?? null;
  }, [currentUserResult, limitedOthers]);

  const orbitParticipants = useMemo(() => {
    const skipId = dominantResult?.id;
    return limitedOthers.filter((entry) => entry.id !== skipId);
  }, [dominantResult, limitedOthers]);

  const rings = useMemo(() => partitionRings(orbitParticipants), [orbitParticipants]);

  const orderedResults = useMemo(() => {
    const allowance = 30 - (dominantResult ? 1 : 0);
    const remainder = allowance > 0 ? orbitParticipants.slice(0, allowance) : [];
    return dominantResult ? [dominantResult, ...remainder] : remainder;
  }, [dominantResult, orbitParticipants]);

  const shareUrl = dominantResult ? buildTwitterUrl(dominantResult) : null;

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(() => {
    if (!dominantResult || !shareUrl || isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsSharing(false);
    }
  }, [dominantResult, isSharing, shareUrl]);

  const isOwnDominant = Boolean(currentUserResult && dominantResult && currentUserResult.id === dominantResult.id);

  return (
    <ResultsBoardLayout
      dominantResult={dominantResult}
      rings={rings}
      orderedResults={orderedResults}
      isOwnDominant={isOwnDominant}
      isSharing={isSharing}
      onShare={handleShare}
      sceneSrc={resultSceneSrc}
    />
  );
}
