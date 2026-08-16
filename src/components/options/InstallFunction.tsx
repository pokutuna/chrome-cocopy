import {faDizzy} from '@fortawesome/free-solid-svg-icons/faDizzy';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {memo, useCallback, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';

import {CopyFunction, generateId, isCopyFunction} from '../../lib/function';
import {decodeSharable} from '../../lib/share';
import {FunctionItem} from '../common/FunctionParts';
import {useFunctionRepository} from '../common/FunctionStoreContext';
import {useT} from '../common/I18nContext';
import {Editor} from './Editor';
import {EditorBox} from './FunctionItemParts';
import {messageForError} from './FunctionList';
import {Section, TextList} from './Parts';

import styles from './InstallFunction.module.css';

const Notice = memo(() => {
  const t = useT();
  return (
    <div className={styles.noticeFrame}>
      <TextList>
        <li>{t.install.noticeShare}</li>
        <li>{t.install.noticeEdit}</li>
      </TextList>
    </div>
  );
});

const FailedMessage = memo(() => {
  const t = useT();
  return (
    <div className={styles.center}>
      <FontAwesomeIcon icon={faDizzy} size="10x" />
      <h3>{t.install.broken}</h3>
    </div>
  );
});

function useSharedFunction(): CopyFunction | undefined {
  const location = useLocation();
  const fn = useMemo<CopyFunction | undefined>(() => {
    const params = new URLSearchParams(location.search);
    const decoded = decodeSharable(params.get('f') || '');
    return isCopyFunction(decoded) ? decoded : undefined;
  }, [location]);
  return fn;
}

export function InstallFunction() {
  const t = useT();
  const repository = useFunctionRepository();
  const shared = useSharedFunction();
  const [fn, setFn] = useState<CopyFunction | undefined>(shared);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const onEdit = useCallback(
    (edited: Omit<CopyFunction, 'id'>) =>
      setFn(current => (current ? {...current, ...edited} : current)),
    [],
  );

  const onSave = useCallback(
    (edited: Omit<CopyFunction, 'id'>) => {
      if (!fn || saving) return;
      setSaving(true);
      setError(undefined);
      // The shared URL carries whatever id the author had, which may already
      // be in this user's catalog. Installing always mints a fresh id, the
      // same way newFunction() does, so it never collides with or overwrites
      // an existing function.
      repository
        .create({...fn, ...edited, id: generateId()})
        .then(() => {
          // XXX this doesn't care react-router-dom
          location.href = 'options.html';
        })
        .catch(e => {
          setError(messageForError(t, e));
          setSaving(false);
        });
    },
    [repository, fn, saving, t],
  );

  return (
    <Section title="Install Function">
      {fn ? (
        <EditorBox>
          <Notice />
          <FunctionItem fn={fn} />
          <Editor
            function={fn}
            onEdit={onEdit}
            onSave={onSave}
            saving={saving}
            error={error}
            install
          />
        </EditorBox>
      ) : (
        <FailedMessage />
      )}
    </Section>
  );
}
