// The source of truth for catalog keys and value shapes; messages.ja.ts must
// conform to `typeof en` (docs/i18n.md, "Message Catalog"). Deliberately not
// `as const`, which would narrow every value to its literal and leave no room
// for the Japanese strings.

type MessageLeaf = string | ((...args: never[]) => string);
type MessageTree = {[key: string]: MessageLeaf | MessageTree};

export const en = {
  settings: {
    closeAfterCopy: 'Close the popup after copying',
    // Both languages, so the setting stays findable when the UI is in a
    // language the user cannot read.
    language: 'Language / 言語',
    languageAuto: 'Auto',
  },
  popup: {
    openSettings: 'Settings',
    loadFailed: 'Failed to load functions.',
    unsupportedVersion:
      'Your functions were saved by a newer version of cocopy. Update the extension.',
    functionMissing:
      'This function could not be loaded. It may have been deleted.',
  },
  functionList: {
    conflict:
      'These functions were changed in another window. The list has been reloaded; review your changes and save again.',
    quota: 'Not enough sync storage to save this.',
    operationFailed: 'The operation failed. Please try again.',
    functionGone:
      'This function is no longer stored. The list has been reloaded.',
    confirmDelete: 'Are you sure you want to delete this function?',
    confirmDiscard: 'Are you sure you want to discard changes?',
    createNew: 'Create New Function',
    createNewAria: 'Create new function',
    expandAria: 'Expand function',
    collapseAria: 'Collapse function',
  },
  editor: {
    name: 'Name',
    nameEmpty: 'Cannot be empty.',
    color: 'Color',
    randomColorAria: 'Choose a random color',
    pattern: 'URL Pattern',
    patternNote:
      '(optional) This function will be displayed if the URL matches.',
    code: 'Code',
    codeNote: 'Must be a single function.',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    install: 'Install',
    cancel: 'Cancel',
    delete: 'Delete',
    share: 'Share',
    updateUrl: 'Update URL',
  },
  hints: {
    singleFunction:
      'The code must be a single function that returns a string value to copy.',
    richText:
      'Returning this shape copies as rich text & plain text. This interface may change in future.',
    mustache: 'Renders mustache templates.',
    domParser: 'Parses the page content into a document you can query.',
    throwError:
      'Use this to report an error; it appears at the function that produced it.',
    sandbox: 'The code runs safely in an isolated sandbox, not in the page.',
    gallery: 'Find new functions and sample code in the gallery:',
    debugInspect:
      'Open the developer console by right clicking on the popup & selecting "Inspect".',
    debugSources:
      'After executing the code, you can find it on the "Sources" panel under:',
    debugStatement: 'You can also put this statement in the code.',
  },
  install: {
    noticeShare: 'Sharing this URL lets others use this function.',
    noticeEdit: 'You can edit the code and every field before installation.',
    broken: 'This URL is broken.',
  },
  legacyBanner: {
    lead: 'cocopy now stores functions in a new format to handle extension storage size limits. The original data is kept for recovery and will be removed in a future update.',
    failed: 'The automatic migration failed; your original data is untouched.',
    skipped: (count: number) =>
      `${count} of your functions could not be carried over.`,
    completed: 'Your previous functions were migrated automatically.',
    review: 'Review and recover the data from the page:',
  },
} satisfies MessageTree;

export type Messages = typeof en;
