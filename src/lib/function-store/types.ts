import {CopyFunction} from '../function';

/**
 * Reference to a function stored in a Catalog Shard entry. Holds only what
 * popup and options need to filter and list functions without reading the
 * Function Document. `id` is the function's logical id; `documentId` is a
 * separate id that changes every time the document is replaced.
 */
export interface CopyFunctionRef {
  id: string;
  documentId: string;
  name: string;
  pattern: string | null;
  theme: {
    textColor: string;
    backgroundColor: string;
  };
  version: number;
}

/**
 * Derives a CopyFunctionRef from a CopyFunction and the documentId it will be
 * stored under. Refs must never be assembled by hand from separate UI state;
 * they are always a projection of the CopyFunction that becomes the document.
 */
export function refFromFunction(
  fn: CopyFunction,
  documentId: string,
): CopyFunctionRef {
  return {
    id: fn.id,
    documentId,
    name: fn.name,
    pattern: fn.pattern ? fn.pattern : null,
    theme: {
      textColor: fn.theme.textColor,
      backgroundColor: fn.theme.backgroundColor,
    },
    version: fn.version,
  };
}

export type FunctionStoreErrorCode =
  | 'quota'
  | 'conflict'
  | 'corruption'
  | 'validation'
  | 'unsupported-version'
  | 'migration-failed';

/** Base class for all typed errors the FunctionStore layer can raise. */
export abstract class FunctionStoreError extends Error {
  abstract readonly code: FunctionStoreErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export type QuotaLimitKind =
  | 'item-bytes'
  | 'total-bytes'
  | 'item-count'
  | 'function-count';

/** Raised when a mutation would exceed one of the effective capacity limits. */
export class QuotaError extends FunctionStoreError {
  readonly code = 'quota';

  constructor(
    message: string,
    readonly details: {
      limitKind: QuotaLimitKind;
      limit: number;
      actual: number;
    },
  ) {
    super(message);
  }
}

/**
 * Raised when the Active Pointer changed between the start of a mutation and
 * its commit attempt; the mutation's base catalogId is stale.
 */
export class ConflictError extends FunctionStoreError {
  readonly code = 'conflict';
}

/**
 * Raised when stored data fails integrity checks: schema mismatch, missing
 * document, duplicate id, or a ref that disagrees with its document.
 */
export class CorruptionError extends FunctionStoreError {
  readonly code = 'corruption';
}

/** Raised when a CopyFunction fails schema or business-rule validation. */
export class ValidationError extends FunctionStoreError {
  readonly code = 'validation';
}

/**
 * Raised when the Active Pointer's formatVersion is newer than this build
 * knows how to read. Data must not be read or overwritten in this case.
 */
export class UnsupportedVersionError extends FunctionStoreError {
  readonly code = 'unsupported-version';

  constructor(
    message: string,
    readonly formatVersion: number,
  ) {
    super(message);
  }
}

/**
 * Raised when migrating legacy `storage.sync["functions"]` data into the
 * FunctionStore is aborted outright: the legacy value could not be read as an
 * array, or a write along the way failed. Individual functions that fail
 * per-function validation are skipped (Partial Migration) rather than raising
 * this error.
 */
export class MigrationError extends FunctionStoreError {
  readonly code = 'migration-failed';
}
