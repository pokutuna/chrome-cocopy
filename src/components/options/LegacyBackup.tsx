// Legacy Storage Backup UI (docs/function-storage.md, "Legacy Storage Backup
// UI"). Temporary: it exists only so users can see what the migration did with
// their pre-FunctionStore data and recover anything it could not carry over.
// Scheduled for removal a few releases from now.

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';

import {CopyFunction, currentVersion, generateId} from '../../lib/function';
import {
  classifyFunction,
  LegacyBackupStatus,
  MigrationResult,
  MigrationSkip,
} from '../../lib/function-store/migration';
import {encodeSharable} from '../../lib/share';
import {
  useFunctionRepository,
  useLegacyBackupRepository,
} from '../common/FunctionStoreContext';
import {Button} from './Button';
import {messageForError} from './FunctionList';
import {Section, TextList} from './Parts';

import styles from './LegacyBackup.module.css';

const EXPORT_FILENAME = 'cocopy-legacy-functions.json';

/** UTF-8 byte length of the raw JSON, matching what storage accounts for. */
function byteLength(raw: string): number {
  return new TextEncoder().encode(raw).length;
}

function parseArray(raw: string | undefined): unknown[] | undefined {
  if (raw === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function describeSource(
  raw: string | undefined,
): {present: false} | {present: true; bytes: number; count?: number} {
  if (raw === undefined) return {present: false};
  return {
    present: true,
    bytes: byteLength(raw),
    count: parseArray(raw)?.length,
  };
}

function formatSource(source: ReturnType<typeof describeSource>): string {
  if (!source.present) return 'not present';
  const count =
    source.count === undefined
      ? 'not readable as an array'
      : `${source.count} function(s)`;
  return `present, ${source.bytes} bytes, ${count}`;
}

function reasonText(reason: MigrationSkip['reason']): string {
  switch (reason) {
    case 'schema':
      return 'does not match the function format';
    case 'pattern':
      return 'its URL pattern is not a valid regular expression';
    case 'size':
      return 'it is too large to store';
  }
}

function outcomeText(result: MigrationResult): string {
  if (result.outcome === 'failed') return 'Failed';
  return result.skipped.length > 0
    ? `Completed with ${result.skipped.length} function(s) left behind`
    : 'Completed';
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

type EntryState =
  | {kind: 'migrated'}
  | {kind: 'importable'; fn: CopyFunction; reason?: MigrationSkip['reason']}
  | {kind: 'invalid'; reason: MigrationSkip['reason']; sharable?: string};

interface Entry {
  key: string;
  id: string;
  name: string;
  state: EntryState;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function hexColorOr(value: unknown, fallback: string): string {
  return typeof value === 'string' &&
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
    ? value
    : fallback;
}

/**
 * Encodes a legacy entry for the install editor. The entry failed validation
 * by definition, and `encodeSharable` only accepts a well-formed
 * `CopyFunction`, so the invalid fields are replaced with editable defaults.
 * Whatever is salvageable (name, code, pattern, colors) is carried through so
 * the user repairs the function rather than retyping it.
 */
function toSharable(item: unknown): string | undefined {
  const obj =
    typeof item === 'object' && item !== null
      ? (item as Record<string, unknown>)
      : {};
  const theme =
    typeof obj.theme === 'object' && obj.theme !== null
      ? (obj.theme as Record<string, unknown>)
      : {};

  const repaired: CopyFunction = {
    id: generateId(),
    name: stringOr(obj.name, 'function name'),
    code: stringOr(obj.code, ''),
    pattern: stringOr(obj.pattern, ''),
    version: currentVersion,
    theme: {
      textColor: hexColorOr(theme.textColor, '#ffffff'),
      backgroundColor: hexColorOr(theme.backgroundColor, '#9e9e9e'),
    },
  };

  try {
    return encodeSharable(repaired);
  } catch {
    return undefined;
  }
}

/**
 * Builds one row per function in the legacy snapshot. `renamedIds` matters
 * because a function whose id collided during migration is stored under a new
 * id; matching only on the current catalog would show it as missing.
 */
function buildEntries(
  source: unknown[],
  result: MigrationResult | undefined,
  storedIds: Set<string>,
): Entry[] {
  const renamedFrom = new Set(
    (result?.renamedIds ?? []).map(rename => rename.from),
  );
  // Skips are matched positionally per id: the same id can appear twice in a
  // corrupt legacy array, and consuming one skip per row keeps them aligned.
  const skips = [...(result?.skipped ?? [])];

  return source.map((item, index) => {
    const classified = classifyFunction(item);
    const id =
      typeof item === 'object' && item !== null && 'id' in item
        ? String((item as {id: unknown}).id)
        : '(unknown id)';
    const name =
      typeof item === 'object' && item !== null && 'name' in item
        ? String((item as {name: unknown}).name)
        : '(unknown name)';

    const skipIndex = skips.findIndex(skip => skip.id === id);
    const skip = skipIndex >= 0 ? skips.splice(skipIndex, 1)[0] : undefined;

    let state: EntryState;
    if (!classified.ok) {
      // Cannot be created as-is; hand it to the editor instead so the user can
      // repair it and save.
      state = {
        kind: 'invalid',
        reason: classified.reason,
        sharable: toSharable(item),
      };
    } else if (storedIds.has(id) || renamedFrom.has(id)) {
      state = {kind: 'migrated'};
    } else {
      state = {kind: 'importable', fn: classified.fn, reason: skip?.reason};
    }

    return {key: `${id}-${index}`, id, name, state};
  });
}

function downloadJson(raw: string): void {
  const url = URL.createObjectURL(new Blob([raw], {type: 'application/json'}));
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = EXPORT_FILENAME;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function EntryRow(props: {
  entry: Entry;
  imported: boolean;
  busy: boolean;
  onImport: (fn: CopyFunction) => void;
}) {
  const {entry, imported, busy} = props;
  const {state} = entry;

  return (
    <li className={styles.entry}>
      <span className={styles.entryName}>{entry.name}</span>
      <span className={styles.entryId}>{entry.id}</span>
      {imported || state.kind === 'migrated' ? (
        <span className={styles.entryState}>Already in your functions</span>
      ) : state.kind === 'importable' ? (
        <>
          <span
            className={state.reason ? styles.entryProblem : styles.entryState}
          >
            {state.reason
              ? `Not migrated: ${reasonText(state.reason)}`
              : 'Not migrated'}
          </span>
          <Button disabled={busy} onClick={() => props.onImport(state.fn)}>
            Import
          </Button>
        </>
      ) : (
        <>
          <span className={styles.entryProblem}>
            {`Cannot be imported: ${reasonText(state.reason)}`}
          </span>
          {state.sharable && (
            <Link to={`/install?f=${encodeURIComponent(state.sharable)}`}>
              Fix in editor
            </Link>
          )}
        </>
      )}
    </li>
  );
}

export function LegacyBackup() {
  const legacyBackup = useLegacyBackupRepository();
  const repository = useFunctionRepository();

  const [status, setStatus] = useState<LegacyBackupStatus | undefined>(
    undefined,
  );
  const [storedIds, setStoredIds] = useState<Set<string>>(() => new Set());
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [next, refs] = await Promise.all([
          legacyBackup.status(),
          repository.list().catch(() => []),
        ]);
        if (cancelled) return;
        setStatus(next);
        setStoredIds(new Set(refs.map(ref => ref.id)));
      } catch (e) {
        if (!cancelled) setError(messageForError(e));
      }
    };
    void load();
    // Deleting a function in the list above must re-enable its Import here,
    // so re-read whenever the repository publishes a new snapshot.
    const unsubscribe = repository.subscribe(() => void load());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [legacyBackup, repository]);

  // The backup is the read-only original captured at migration time; the
  // legacy sync value is only a fallback for a migration that never got as far
  // as writing the backup.
  const raw = status?.backupRaw ?? status?.legacyRaw;

  const entries = useMemo(() => {
    const source = parseArray(raw);
    if (!source) return [];
    return buildEntries(source, status?.result, storedIds);
  }, [raw, status?.result, storedIds]);

  const onImport = useCallback(
    (fn: CopyFunction) => {
      if (busy) return;
      setBusy(true);
      setError(undefined);
      // A fresh id keeps the import from colliding with anything already in
      // the catalog, and leaves the legacy snapshot untouched.
      repository
        .create({...fn, id: generateId()})
        .then(() => {
          setImportedIds(current => [...current, fn.id]);
          setBusy(false);
        })
        .catch(e => {
          setError(messageForError(e));
          setBusy(false);
        });
    },
    [repository, busy],
  );

  const onExport = useCallback(() => {
    if (raw !== undefined) downloadJson(raw);
  }, [raw]);

  if (!status) return null;

  // Fresh install: nothing was ever stored in the legacy format. This also
  // covers a completed migration that only seeded the default functions
  // (legacyExisted false) — there is nothing to inspect or recover then. A
  // failed migration still renders even without legacy data, so its error and
  // export stay reachable.
  const {legacyRaw, backupRaw, result} = status;
  if (
    legacyRaw === undefined &&
    backupRaw === undefined &&
    (result === undefined ||
      (result.outcome === 'completed' && !result.legacyExisted))
  ) {
    return null;
  }

  const imported = new Set(importedIds);

  return (
    <Section title="Legacy storage backup">
      <div className={styles.notice}>
        This section is temporary and will be removed in a release a few months
        from now. Export the original JSON before then if you want to keep it.
      </div>

      <TextList>
        <li>
          This is the read-only original captured when cocopy migrated to its
          new storage format, not a backup of your current functions. Nothing
          here changes when you edit or delete functions above.
        </li>
        <li>
          Importing a function copies it into your functions under a new id. The
          original stays here, so importing the same function twice leaves you
          with two copies.
        </li>
      </TextList>

      <div className={styles.status}>
        <dl>
          <dt>Legacy data (sync)</dt>
          <dd>{formatSource(describeSource(legacyRaw))}</dd>
          <dt>Backup (local)</dt>
          <dd>{formatSource(describeSource(backupRaw))}</dd>
          <dt>Migration</dt>
          <dd>{result ? outcomeText(result) : 'not recorded'}</dd>
          {result && (
            <>
              <dt>New storage enabled</dt>
              <dd>{formatTimestamp(result.migratedAt)}</dd>
              <dt>Functions migrated</dt>
              <dd>{result.migratedCount}</dd>
            </>
          )}
        </dl>
      </div>

      {result?.error && (
        <div className={styles.error} role="alert">
          {result.error}
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <Button disabled={raw === undefined} onClick={onExport}>
          Export original JSON
        </Button>
      </div>

      {entries.length > 0 ? (
        <ul className={styles.entries}>
          {entries.map(entry => (
            <EntryRow
              key={entry.key}
              entry={entry}
              imported={imported.has(entry.id)}
              busy={busy}
              onImport={onImport}
            />
          ))}
        </ul>
      ) : (
        <div className={styles.status}>
          No functions could be read from the legacy data.
        </div>
      )}
    </Section>
  );
}
