// Ambient declarations so TypeScript accepts CSS imports (the Metro/web
// bundler handles them at build time).
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css';
