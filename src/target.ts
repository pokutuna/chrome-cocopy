export type TargetType = 'page' | 'text' | 'image';

export interface CommonCopyTarget {
  /** type of the target to copy. */
  type: TargetType;

  /** title of the page executing extension. */
  title: string;

  /** * url ot the page executiong extension. */
  pageURL: string;
}

export type PageTarget = CommonCopyTarget;

interface LinkTarget {
  isLink: boolean;
  linkURL?: string;
  linkText?: string;
}

export interface TextTarget extends CommonCopyTarget, LinkTarget {
  /**
   * `text` is selectionText when you selecting any text.
   * Or `text` is the link text.
   */
  text: string;

  isSelection: boolean;
  selectionText?: string;
}

export interface ImageTarget extends CommonCopyTarget, LinkTarget {
  imageURL: string;
}

export function isTarget(input: any): input is CommonCopyTarget {
  return (
    input &&
    typeof input.type === 'string' &&
    typeof input.title === 'string' &&
    typeof input.pageURL === 'string'
  );
}
