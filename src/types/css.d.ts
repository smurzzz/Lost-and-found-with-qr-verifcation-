/// <reference types="expo-env.d.ts" />

// CSS modules imported from components (web-only styling in the template).
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Side-effect import in src/constants/theme.ts.
declare module '*.css';
