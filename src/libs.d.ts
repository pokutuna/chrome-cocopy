declare module 'prismjs/components/prism-core' {
  export function highlight(code: any, language: any): any;

  interface Languages {
    js: any;
  }

  export const languages: Languages;
}
