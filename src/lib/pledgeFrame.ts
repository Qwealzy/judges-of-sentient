const baseAsset = process.env.NEXT_PUBLIC_PLEDGE_FRAME_ASSET ?? '/pledge-frame.png';
const version = process.env.NEXT_PUBLIC_PLEDGE_FRAME_VERSION;

function appendCacheBuster(asset: string, cacheKey?: string) {
  if (!cacheKey) {
    return asset;
  }

  const separator = asset.includes('?') ? '&' : '?';
  return `${asset}${separator}v=${encodeURIComponent(cacheKey)}`;
}

export const pledgeFrameSrc = appendCacheBuster(baseAsset, version);
