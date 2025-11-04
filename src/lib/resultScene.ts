import type { StaticImageData } from 'next/image';

const remoteAsset = process.env.NEXT_PUBLIC_RESULT_SCENE_ASSET;
const version = process.env.NEXT_PUBLIC_RESULT_SCENE_VERSION;

function appendCacheBuster(asset: string, cacheKey?: string) {
  if (!cacheKey) {
    return asset;
  }

  const separator = asset.includes('?') ? '&' : '?';
  return `${asset}${separator}v=${encodeURIComponent(cacheKey)}`;
}

const remoteResultScene = remoteAsset ? appendCacheBuster(remoteAsset, version) : undefined;

const localResultScene: string | StaticImageData = '/result-scene.png';

export const resultSceneSrc: string | StaticImageData = remoteResultScene ?? localResultScene;
