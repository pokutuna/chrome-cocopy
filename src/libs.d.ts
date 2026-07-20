declare module '*.css';

// CSS Modules trial (see NEXT_PLAN.md Phase 2 styled-components migration).
// Vite handles *.module.css natively; this just gives TS the class-name map shape.
declare module '*.module.css' {
  const classes: {readonly [key: string]: string};
  export default classes;
}
