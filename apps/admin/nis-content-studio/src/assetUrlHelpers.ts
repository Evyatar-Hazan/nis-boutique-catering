export const publicSiteOrigin = 'https://nisboutiquecatering.com';

export const cmsSrcFor = (id: string) => `/media/cms/${id}.webp`;

export const publicAssetSrcFor = (src: string) =>
  src.startsWith('http') ? src : `${publicSiteOrigin}${src}`;
