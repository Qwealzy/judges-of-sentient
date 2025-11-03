const baseAsset = process.env.NEXT_PUBLIC_PLEDGE_FRAME_ASSET ?? '/pledge-frame.png';
const version = process.env.NEXT_PUBLIC_PLEDGE_FRAME_VERSION;

export const pledgeFrameSrc = version ? `${baseAsset}?v=${version}` : baseAsset;
