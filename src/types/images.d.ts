/** Static image imports (metro bundles jpg/png via @expo/metro-assets). */
declare module '*.jpg' {
  const asset: number;
  export default asset;
}

declare module '*.png' {
  const asset: number;
  export default asset;
}
