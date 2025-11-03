import type { StaticImageData } from 'next/image';
import localPledgeFrame from '@/assets/pledge-frame.PNG';

const remoteAsset = process.env.NEXT_PUBLIC_PLEDGE_FRAME_ASSET;
const version = process.env.NEXT_PUBLIC_PLEDGE_FRAME_VERSION;

function appendCacheBuster(asset: string, cacheKey?: string) {
  if (!cacheKey) {
    return asset;
  }

  const separator = asset.includes('?') ? '&' : '?';
  return `${asset}${separator}v=${encodeURIComponent(cacheKey)}`;
}

const remotePledgeFrame = remoteAsset ? appendCacheBuster(remoteAsset, version) : undefined;

export const pledgeFrameSrc: string | StaticImageData = remotePledgeFrame ?? (localPledgeFrame as StaticImageData);
