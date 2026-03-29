/// <reference types="vite/client" />
/// <reference types="@react-three/fiber" />

declare module 'virtual:personal-bgm-manifest' {
  export const PERSONAL_BGM_MANIFEST: Record<number, string[]>;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}
