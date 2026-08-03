// Legacy Storage Backup UI (docs/function-storage.md, "Legacy Storage Backup
// UI"). Temporary: it exists only so users can see what the migration did with
// their pre-FunctionStore data and recover anything it could not carry over.
// Scheduled for removal a few releases from now.

import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {faTriangleExclamation} from '@fortawesome/free-solid-svg-icons/faTriangleExclamation';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';

import {CopyFunction, currentVersion, generateId} from '../../lib/function';
import {
  classifyFunction,
  describeUnknown,
  LegacyBackupStatus,
  MigrationResult,
  MigrationSkip,
} from '../../lib/function-store/migration';
import {encodeSharable} from '../../lib/share';
import {FunctionItem} from '../common/FunctionParts';
import {
  useFunctionRepository,
  useLegacyBackupRepository,
} from '../common/FunctionStoreContext';
import {Button, ButtonIcon} from './Button';
import {CodeEditor} from './CodeEditor';
import {Caret, EditorBox, messageForError} from './FunctionList';
import {TextInput} from './Input';
import {Box, Item, Row, Section} from './Parts';

import listStyles from './FunctionList.module.css';
import styles from './LegacyBackup.module.css';

const EXPORT_FILENAME = 'cocopy-legacy-functions.json';

/**
 * Why the legacy backup exists at all — shown wherever the backup surfaces so
 * users are not confronted with "legacy data" out of nowhere.
 */
const MIGRATION_INTRO =
  'cocopy now stores functions in a new format to handle extension storage size limits.';

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

/**
 * One-line provenance for the footer, replacing the per-store status table:
 * when the new format took over and how big the original is. The details that
 * table carried (which store holds what, byte counts) only ever mattered for
 * debugging, and the exported JSON answers them better.
 */
function summaryText(
  raw: string | undefined,
  result: MigrationResult | undefined,
): string {
  const size =
    raw === undefined ? 'no data' : `${byteLength(raw)} bytes of original data`;
  if (!result) return size;
  const date = new Date(result.migratedAt);
  const when = Number.isNaN(date.getTime())
    ? result.migratedAt
    : date.toLocaleDateString();
  const outcome = result.outcome === 'failed' ? 'migration failed' : 'migrated';
  return `${outcome} ${when} · ${size}`;
}

/**
 * Whether there is anything to show about the legacy storage. False on a
 * fresh install: nothing was ever stored in the legacy format. This also
 * covers a completed migration that only seeded the default functions
 * (legacyExisted false) — there is nothing to inspect or recover then. A
 * failed migration still counts even without legacy data, so its error and
 * export stay reachable.
 */
export function hasLegacyBackupContent(status: LegacyBackupStatus): boolean {
  const {legacyRaw, backupRaw, result} = status;
  if (legacyRaw !== undefined || backupRaw !== undefined) return true;
  return (
    result !== undefined &&
    !(result.outcome === 'completed' && !result.legacyExisted)
  );
}

type EntryState =
  | {kind: 'migrated'}
  | {kind: 'importable'}
  | {kind: 'invalid'; reason: MigrationSkip['reason']; sharable?: string};

interface Entry {
  key: string;
  /** Position in the rendered legacy array; what `deleteEntry` addresses. */
  index: number;
  /** The raw legacy item at `index`; `deleteEntry` verifies it is unchanged. */
  raw: unknown;
  /** What the row renders: the validated function, or a repaired stand-in. */
  fn: CopyFunction;
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
 * Rebuilds a well-formed `CopyFunction` from a legacy entry that failed
 * validation: invalid fields are replaced with editable defaults, and
 * whatever is salvageable (name, code, pattern, colors) is carried through so
 * the user repairs the function rather than retyping it.
 */
function repairFunction(item: unknown): CopyFunction {
  const obj =
    typeof item === 'object' && item !== null
      ? (item as Record<string, unknown>)
      : {};
  const theme =
    typeof obj.theme === 'object' && obj.theme !== null
      ? (obj.theme as Record<string, unknown>)
      : {};

  return {
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
}

/** Encodes a repaired entry for the install editor's `?f=` parameter. */
function toSharable(fn: CopyFunction): string | undefined {
  try {
    return encodeSharable(fn);
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
  // Skips are matched on (id, name), consuming one per row: a corrupt legacy
  // array can hold the same id twice, with one copy stored and one skipped.
  const skips = [...(result?.skipped ?? [])];

  return source.map((item, index) => {
    const classified = classifyFunction(item);
    const {id, name} = describeUnknown(item);

    const skipIndex = skips.findIndex(
      skip => skip.id === id && skip.name === name,
    );
    const skip = skipIndex >= 0 ? skips.splice(skipIndex, 1)[0] : undefined;

    if (!classified.ok) {
      // Cannot be created as-is; hand it to the editor instead so the user can
      // repair it and save.
      const repaired = repairFunction(item);
      return {
        key: `${id}-${index}`,
        index,
        raw: item,
        fn: repaired,
        state: {
          kind: 'invalid' as const,
          reason: classified.reason,
          sharable: toSharable(repaired),
        },
      };
    }

    // Skipped for size: importing as-is can only hit the same per-item limit
    // again (and a renamed duplicate would collide with its stored sibling),
    // so route it to the editor under a fresh id like an invalid entry.
    if (skip?.reason === 'size') {
      const fresh = {...classified.fn, id: generateId()};
      return {
        key: `${id}-${index}`,
        index,
        raw: item,
        fn: classified.fn,
        state: {
          kind: 'invalid' as const,
          reason: skip.reason,
          sharable: toSharable(fresh),
        },
      };
    }

    const state: EntryState =
      storedIds.has(id) || renamedFrom.has(id)
        ? {kind: 'migrated'}
        : {kind: 'importable'};
    return {key: `${id}-${index}`, index, raw: item, fn: classified.fn, state};
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

/** The status/action line at the bottom of an expanded entry. */
function EntryActions(props: {
  entry: Entry;
  busy: boolean;
  onImport: (fn: CopyFunction) => void;
  onDelete: (entry: Entry) => void;
}) {
  const {entry, busy} = props;
  const {state} = entry;

  let status: React.ReactNode;
  if (state.kind === 'migrated') {
    status = (
      <Item>
        <span className={styles.entryState}>Already in your functions</span>
      </Item>
    );
  } else if (state.kind === 'importable') {
    status = (
      <>
        <Item>
          <span className={styles.entryState}>Not migrated</span>
        </Item>
        <Item>
          <Button disabled={busy} onClick={() => props.onImport(entry.fn)}>
            Import
          </Button>
        </Item>
      </>
    );
  } else {
    status = (
      <>
        <Item>
          <span className={styles.entryProblem}>
            {`Cannot be imported: ${reasonText(state.reason)}`}
          </span>
        </Item>
        {state.sharable && (
          <Item>
            <Link to={`/install?f=${encodeURIComponent(state.sharable)}`}>
              Fix in editor
            </Link>
          </Item>
        )}
      </>
    );
  }

  return (
    <>
      {status}
      <Item style={{marginLeft: 'auto'}}>
        <Button
          mode="danger"
          disabled={busy}
          onClick={() => props.onDelete(entry)}
        >
          <ButtonIcon>
            <FontAwesomeIcon icon={faTrash} />
          </ButtonIcon>
          Delete
        </Button>
      </Item>
    </>
  );
}

/**
 * One legacy function, drawn like a row of the options function list: the
 * colored function box expands into a read-only detail view. There is nothing
 * to save or share here — recovery goes through Import or the install editor.
 * The one mutation is Delete, which erases the entry from the legacy data so
 * users can purge anything sensitive left behind.
 */
function EntryRow(props: {
  entry: Entry;
  busy: boolean;
  onImport: (fn: CopyFunction) => void;
  onDelete: (entry: Entry) => void;
}) {
  const {entry} = props;
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(value => !value), []);

  const done = entry.state.kind === 'migrated';

  return (
    <div>
      <div className={listStyles.functionItemBox}>
        <Caret active={expanded} onClick={toggle} />
        <FunctionItem fn={entry.fn} onClick={toggle} />
        <div
          className={[listStyles.itemButton, styles.stateIconBox].join(' ')}
          onClick={toggle}
        >
          {!done && (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              title="Not in your functions"
            />
          )}
        </div>
      </div>
      {expanded && (
        <EditorBox>
          <Box>
            <Row>
              <Item $grow={1}>
                <TextInput
                  label="Name"
                  name={`legacy-name-${entry.key}`}
                  value={entry.fn.name}
                  readOnly
                />
              </Item>
              <Item style={{width: '9rem'}}>
                <TextInput
                  label="Color"
                  name={`legacy-color-${entry.key}`}
                  value={entry.fn.theme.backgroundColor}
                  readOnly
                />
              </Item>
            </Row>
            <Row>
              <TextInput
                label="URL Pattern"
                name={`legacy-pattern-${entry.key}`}
                value={entry.fn.pattern || ''}
                readOnly
              />
            </Row>
            <Row>
              <CodeEditor code={entry.fn.code} readOnly />
            </Row>
            <Row>
              <EntryActions {...props} />
            </Row>
          </Box>
        </EditorBox>
      )}
    </div>
  );
}

export function LegacyBackup() {
  const legacyBackup = useLegacyBackupRepository();
  const repository = useFunctionRepository();

  const [status, setStatus] = useState<LegacyBackupStatus | undefined>(
    undefined,
  );
  const [storedIds, setStoredIds] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      // list() failures degrade to "nothing stored" instead of failing the
      // whole page: this UI is the recovery path when the store is broken.
      const [next, refs] = await Promise.all([
        legacyBackup.status(),
        repository.list().catch(() => []),
      ]);
      setStatus(next);
      setStoredIds(new Set(refs.map(ref => ref.id)));
    } catch (e) {
      setError(messageForError(e));
    }
  }, [legacyBackup, repository]);

  useEffect(() => {
    void load();
    // Deleting a function in the list above must re-enable its Import here,
    // so re-read whenever the repository publishes a new snapshot.
    return repository.subscribe(() => void load());
  }, [load, repository]);

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
      // The legacy id is kept: an importable row's id is by definition absent
      // from the catalog, and storing it under the same id is what marks the
      // row as migrated on every future visit — no separate imported state to
      // persist. Deleting the function re-enables Import again, symmetrically.
      repository
        .create(fn)
        .then(() => load())
        .then(() => setBusy(false))
        .catch(e => {
          setError(messageForError(e));
          setBusy(false);
        });
    },
    [repository, busy, load],
  );

  const onDelete = useCallback(
    (entry: Entry) => {
      if (busy) return;
      const ok = window.confirm(
        `Delete "${entry.fn.name}" from the legacy data? ` +
          'It is removed from both the backup and the old sync value, and cannot be undone.',
      );
      if (!ok) return;
      setBusy(true);
      setError(undefined);
      legacyBackup
        .deleteEntry(entry.index, entry.raw)
        .then(() => load())
        .then(() => setBusy(false))
        .catch(e => {
          setError(messageForError(e));
          setBusy(false);
        });
    },
    [legacyBackup, busy, load],
  );

  const onExport = useCallback(() => {
    if (raw !== undefined) downloadJson(raw);
  }, [raw]);

  // status() itself failed: without it nothing below can render, so the error
  // must stand on its own instead of an empty page.
  if (!status) {
    return error ? (
      <Section title="Legacy Functions">
        <div className={styles.error} role="alert">
          {error}
        </div>
      </Section>
    ) : null;
  }
  if (!hasLegacyBackupContent(status)) return null;

  const {result} = status;
  const summary = summaryText(raw, result);

  return (
    <Section title="Legacy Functions">
      <p className={styles.lead}>
        {MIGRATION_INTRO} This is the original data from before that move, kept
        so you can recover anything the automatic migration missed. It will be
        removed in a future release &mdash; export it if you want to keep it.
      </p>

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

      {entries.length > 0 ? (
        <div className={styles.entryList}>
          {entries.map(entry => (
            <EntryRow
              key={entry.key}
              entry={entry}
              busy={busy}
              onImport={onImport}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <p className={styles.lead}>
          No functions could be read from the legacy data.
        </p>
      )}

      <div className={styles.footer}>
        <Button disabled={raw === undefined} onClick={onExport}>
          Export original JSON
        </Button>
        <span className={styles.summary}>{summary}</span>
      </div>
    </Section>
  );
}

/**
 * Compact pointer to the /legacy page, shown on the main page only when there
 * is legacy data worth reviewing. The full inspection UI lives in
 * LegacyBackup on that page.
 */
export function LegacyBackupBanner() {
  const legacyBackup = useLegacyBackupRepository();
  const [status, setStatus] = useState<LegacyBackupStatus | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    legacyBackup
      .status()
      .then(next => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        // The banner is only a pointer; with an unreadable status there is
        // nothing to point at.
      });
    return () => {
      cancelled = true;
    };
  }, [legacyBackup]);

  if (!status || !hasLegacyBackupContent(status)) return null;

  const failed = status.result?.outcome === 'failed';
  const skippedCount = status.result?.skipped.length ?? 0;
  const detail = failed ? (
    <>
      The automatic migration failed. Your original data is kept untouched
      &mdash; recover it from the <Link to="/legacy">Legacy Functions</Link>{' '}
      page.
    </>
  ) : skippedCount > 0 ? (
    <>
      Your previous functions were migrated automatically, but {skippedCount}{' '}
      function(s) could not be carried over. Review and import them from the{' '}
      <Link to="/legacy">Legacy Functions</Link> page.
    </>
  ) : (
    <>
      Your previous functions were migrated automatically. If anything is
      missing, review and recover the original data from the{' '}
      <Link to="/legacy">Legacy Functions</Link> page.
    </>
  );

  return (
    <Section title="Legacy Functions">
      <div className={failed ? styles.bannerProblem : styles.banner}>
        <p>{MIGRATION_INTRO}</p>
        <p>{detail}</p>
        <p>The original data will be removed in a future update.</p>
      </div>
    </Section>
  );
}
