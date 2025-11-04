'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import type { PledgeResult } from '@/types';

import { pledgeFrameSrc } from '@/lib/pledgeFrame';
import { resultSceneSrc } from '@/lib/resultScene';

const twitterShareText = encodeURIComponent('I just pledged my loyalty to SentientMaxi. Are you worthy?');

const RESULT_CARD_WIDTH = 1536;
const RESULT_CARD_HEIGHT = 1024;
const RING_COUNTS = [8, 16, 24];
const DEFAULT_RING_COUNT = 24;
const RING_BASE_RADIUS = 260;
const RING_RADIUS_STEP = 120;

function normaliseAssetSrc(asset: string | { src: string }) {
  if (typeof asset === 'string') {
    return asset;
  }

  return asset.src;
}

function buildTwitterUrl(result: PledgeResult) {
  const quoteUrl =
    process.env.NEXT_PUBLIC_SENTIENT_TWEET_URL || process.env.NEXT_PUBLIC_SENTIENT_QUOTE_LINK || 'https://x.com/GGodsonits';
  const composedText = `${twitterShareText}%0A%0A${encodeURIComponent(result.description)}%0A— ${encodeURIComponent(result.username)}`;
  return `https://twitter.com/intent/tweet?text=${composedText}&url=${encodeURIComponent(quoteUrl)}`;
}

async function loadImageAsset(src: string): Promise<CanvasImageSource> {
  const response = await fetch(src, { cache: 'no-store', mode: 'cors' });

  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.status}`);
  }

  const blob = await response.blob();

  if (typeof createImageBitmap !== 'undefined') {
    return await createImageBitmap(blob);
  }

  if (typeof window === 'undefined') {
    throw new Error('Image helpers require a browser environment');
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(objectUrl);
      reject(event);
    };
    image.src = objectUrl;
  });
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  borderWidth: number,
  borderColor: string
) {
  ctx.save();
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(source, x, y, width, height);
  ctx.restore();

  if (borderWidth > 0) {
    ctx.save();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let y = startY;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const { width } = ctx.measureText(testLine);

    if (width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, y);
  }

  return y;
}

async function composeShareImage(
  result: PledgeResult,
  rings: PledgeResult[][],
  backgroundSrc: string
): Promise<Blob | null> {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = RESULT_CARD_WIDTH;
  canvas.height = RESULT_CARD_HEIGHT;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  try {
    const ringSources = rings.flat();
    const assets = await Promise.all([
      loadImageAsset(backgroundSrc),
      loadImageAsset(result.profile_image_url),
      ...ringSources.map((entry) => loadImageAsset(entry.profile_image_url))
    ]);

    const background = assets[0];
    const mainAvatar = assets[1];

    ctx.drawImage(background, 0, 0, RESULT_CARD_WIDTH, RESULT_CARD_HEIGHT);

    const mainAvatarSize = 380;
    const mainAvatarX = 96;
    const mainAvatarY = RESULT_CARD_HEIGHT - mainAvatarSize - 220;
    drawRoundedImage(ctx, mainAvatar, mainAvatarX, mainAvatarY, mainAvatarSize, mainAvatarSize, 60, 14, '#fbd38d');

    const usernameY = mainAvatarY - 56;
    ctx.save();
    ctx.fillStyle = '#fde68a';
    ctx.font = '600 64px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(result.username, mainAvatarX, usernameY);
    ctx.restore();

    const descriptionBoxX = mainAvatarX;
    const descriptionBoxY = mainAvatarY + mainAvatarSize + 36;
    const descriptionBoxWidth = 560;
    const descriptionBoxHeight = 220;

    ctx.save();
    const cornerRadius = 28;
    ctx.fillStyle = 'rgba(12, 3, 24, 0.78)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(descriptionBoxX + cornerRadius, descriptionBoxY);
    ctx.arcTo(descriptionBoxX + descriptionBoxWidth, descriptionBoxY, descriptionBoxX + descriptionBoxWidth, descriptionBoxY + descriptionBoxHeight, cornerRadius);
    ctx.arcTo(descriptionBoxX + descriptionBoxWidth, descriptionBoxY + descriptionBoxHeight, descriptionBoxX, descriptionBoxY + descriptionBoxHeight, cornerRadius);
    ctx.arcTo(descriptionBoxX, descriptionBoxY + descriptionBoxHeight, descriptionBoxX, descriptionBoxY, cornerRadius);
    ctx.arcTo(descriptionBoxX, descriptionBoxY, descriptionBoxX + descriptionBoxWidth, descriptionBoxY, cornerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#fef3c7';
    ctx.font = '700 60px "Inter", "Segoe UI", sans-serif';
    ctx.textBaseline = 'top';
    wrapText(ctx, result.description, descriptionBoxX + 36, descriptionBoxY + 40, descriptionBoxWidth - 72, 70);
    ctx.restore();

    let assetIndex = 2;
    rings.forEach((ring, ringIndex) => {
      const radius = RING_BASE_RADIUS + RING_RADIUS_STEP * ringIndex + 220;
      const avatarSize = Math.max(120 - ringIndex * 12, 72);

      ring.forEach((entry, positionIndex) => {
        const angle = (positionIndex / ring.length) * Math.PI * 2 - Math.PI / 2;
        const centerX = RESULT_CARD_WIDTH / 2 + Math.cos(angle) * radius;
        const centerY = RESULT_CARD_HEIGHT / 2 + Math.sin(angle) * radius;
        const asset = assets[assetIndex];
        assetIndex += 1;

        if (asset) {
          drawRoundedImage(
            ctx,
            asset,
            centerX - avatarSize / 2,
            centerY - avatarSize / 2,
            avatarSize,
            avatarSize,
            avatarSize / 2,
            10,
            'rgba(253, 224, 71, 0.85)'
          );
        }
      });
    });

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob;
  } catch (error) {
    console.error('Failed to compose share image', error);
    return null;
  }
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

        <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 p-4">
          <Image
            src={pledgeFrameSrc}
            alt="Sentient pledge frame"
            width={320}
            height={560}
            className="mx-auto h-auto w-full max-w-[280px] object-contain"
          />
          <div className="absolute bottom-6 right-6 h-32 w-32 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
            <Image src={result.profile_image_url} alt={`${result.username} composite`} fill className="object-cover" sizes="128px" />
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
  const dominantResult = useMemo<PledgeResult | null>(() => {
    if (currentUserResult) {
      return currentUserResult;
    }

    return others[0] ?? null;
  }, [currentUserResult, others]);

  const orbitParticipants = useMemo(() => {
    const skipId = dominantResult?.id;
    return others.filter((entry) => entry.id !== skipId);
  }, [dominantResult, others]);

  const rings = useMemo(() => partitionRings(orbitParticipants), [orbitParticipants]);

  const orderedResults = useMemo(() => {
    const remainder = orbitParticipants;
    return dominantResult ? [dominantResult, ...remainder] : remainder;
  }, [dominantResult, orbitParticipants]);

  const shareUrl = dominantResult ? buildTwitterUrl(dominantResult) : null;
  const sceneImage = normaliseAssetSrc(resultSceneSrc);

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!dominantResult || isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      const blob = await composeShareImage(dominantResult, rings, sceneImage);
      const quoteLink =
        process.env.NEXT_PUBLIC_SENTIENT_TWEET_URL || process.env.NEXT_PUBLIC_SENTIENT_QUOTE_LINK || 'https://x.com/GGodsonits';

      if (blob && typeof navigator !== 'undefined') {
        const cleaned = dominantResult.username.replace(/[^a-zA-Z0-9-_]+/g, '').toLowerCase() || 'sentient';
        const fileName = `${cleaned}-result.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        const shareText = `I just pledged my loyalty to SentientMaxi. Are you worthy?\n\n${dominantResult.description}\n— ${dominantResult.username}\n${quoteLink}`;

        if (navigator.canShare?.({ files: [file], text: shareText })) {
          await navigator.share({ files: [file], text: shareText });
          setIsSharing(false);
          return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Share flow failed', error);
    } finally {
      setIsSharing(false);
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  }, [dominantResult, isSharing, rings, sceneImage, shareUrl]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12">
      <header className="space-y-4 text-center">
        <h2 className="text-3xl font-semibold text-slate-900">Hall of Worthy SentientMaxis</h2>
        <p className="text-base text-slate-500">
          Witness the latest pledges. Your devotion appears first; scroll to explore the rest of the loyal collective.
        </p>
        {dominantResult ? (
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSharing ? 'Preparing share…' : 'Share your results'}
          </button>
        ) : null}
      </header>

      {dominantResult ? (
        <div className="flex flex-col items-center gap-10">
          <div className="relative hidden aspect-square w-full max-w-[960px] items-center justify-center md:flex">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-indigo-900/40 via-slate-900/30 to-transparent blur-3xl" />
            <div className="relative flex aspect-[3/2] w-[60%] max-w-[620px] items-end justify-start overflow-hidden rounded-[36px] border border-amber-500/40 bg-black/40 shadow-[0_25px_80px_rgba(88,28,135,0.35)]">
              <Image src={resultSceneSrc} alt="Sentient decree" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-transparent to-black/55" />
              <div className="absolute left-8 top-8 rounded-2xl bg-black/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                {dominantResult.username}
              </div>
              <div className="absolute bottom-10 left-10 flex w-[320px] flex-col items-start gap-4 rounded-3xl bg-black/55 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
                <div className="relative h-32 w-32 overflow-hidden rounded-3xl border-4 border-amber-200/90 shadow-xl">
                  <Image
                    src={dominantResult.profile_image_url}
                    alt={`${dominantResult.username} avatar`}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <p className="text-base font-semibold leading-relaxed text-amber-100">{dominantResult.description}</p>
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

          <div className="flex w-full flex-col gap-6 md:hidden">
            <div className="relative overflow-hidden rounded-[28px] border border-amber-500/40 bg-black/40 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900/40 via-slate-900/20 to-transparent" aria-hidden />
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[24px]">
                <Image src={resultSceneSrc} alt="Sentient decree" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-transparent to-black/60" />
                <div className="absolute left-4 top-4 rounded-2xl bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80">
                  {dominantResult.username}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex flex-col items-start gap-3 rounded-3xl bg-black/60 p-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-3xl border-4 border-amber-200/90 shadow-xl">
                    <Image src={dominantResult.profile_image_url} alt={`${dominantResult.username} avatar`} fill className="object-cover" sizes="96px" />
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-amber-100">{dominantResult.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
        {orderedResults.map((result, index) => (
          <ResultCard key={result.id} result={result} isOwnResult={dominantResult?.id === result.id && index === 0} />
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
