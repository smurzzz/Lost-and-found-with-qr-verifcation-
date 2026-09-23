// Static image imports (avif, webp, png, ...) — Expo/Metro handles these at
// bundle time; this declaration gives TypeScript the `number` asset type.
declare module '*.avif' {
  const asset: number;
  export default asset;
}

declare module '*.webp' {
  const asset: number;
  export default asset;
}
