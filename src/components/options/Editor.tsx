import {faShareSquare} from '@fortawesome/free-solid-svg-icons/faShareSquare';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import debounce from 'lodash.debounce';
import {useReducer, useMemo, useCallback, useRef, useLayoutEffect} from 'react';

import {EvalPayload, EvalResult} from '../../lib/eval';
import {CopyFunction} from '../../lib/function';
import {encodeSharable} from '../../lib/share';
import {useSandbox} from '../common/Sandbox';
import {Button, ButtonIcon} from './Button';
import {CodeEditor} from './CodeEditor';
import {ColorInput} from './ColorInput';
import {reducer, init, stateToFn, EditorCallbacks} from './EditorReducer';
import {TextInput} from './Input';
import {Box, Row, Item, DividerV} from './Parts';

import styles from './Editor.module.css';

type EditorProps = {
  function: CopyFunction;
  onEdit: (fn: Omit<CopyFunction, 'id'>) => void;
  /** Called with the final draft (trailing space stripped); see EditorCallbacks. */
  onSave: (fn: Omit<CopyFunction, 'id'>) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  /** A mutation is in flight; Save/Delete stay disabled until it settles. */
  saving?: boolean;
  /** The last mutation resolved, so the change is really persisted. */
  saved?: boolean;
  /** Message from a failed mutation; the draft above it is kept for a retry. */
  error?: string;
  install?: boolean;
};

export function Editor(props: EditorProps) {
  // The reducer captures its callbacks once, so route them through a ref that
  // always points at the current props (the previous code had the same shape
  // with a dispatch function). Assigning in a layout effect (not during
  // render) keeps render pure; the effect commits before the setTimeout
  // callbacks below can ever run, so they still always see the latest props.
  const propsRef = useRef(props);
  useLayoutEffect(() => {
    propsRef.current = props;
  }, [props]);

  const callbacks = useMemo<EditorCallbacks>(
    () => ({
      // Deferred: the owner's state must not be updated while this component
      // renders. See https://github.com/facebook/react/issues/18178
      onEdit: fn => setTimeout(() => propsRef.current.onEdit(fn), 1),
      onSave: fn => setTimeout(() => propsRef.current.onSave(fn), 1),
      onCancel: () => setTimeout(() => propsRef.current.onCancel?.(), 1),
      onDelete: () => setTimeout(() => propsRef.current.onDelete?.(), 1),
    }),
    [],
  );

  const [state, dispatch] = useReducer(
    reducer,
    init(props.function, callbacks),
  );

  const onEdit = useCallback(
    (name: string, value: string) => dispatch({t: 'edit', name, value}),
    [dispatch],
  );
  const togglePalette = useCallback(() => dispatch({t: 'palette'}), [dispatch]);

  const _evaluate = useSandbox<EvalPayload, EvalResult>(
    useCallback(
      res => dispatch({t: 'parse', error: res.error?.message}),
      [dispatch],
    ),
  );
  const parse = useMemo(() => debounce(_evaluate, 200), [_evaluate]);

  const onCodeEdit = useCallback(
    (value: string) => {
      parse({command: 'parse', code: value});
      dispatch({t: 'edit', name: 'code', value});
    },
    [dispatch, parse],
  );

  const onClickSave = useCallback(() => dispatch({t: 'save'}), [dispatch]);
  const onClickCancel = useCallback(() => dispatch({t: 'cancel'}), [dispatch]);
  const onClickDelete = useCallback(() => dispatch({t: 'delete'}), [dispatch]);
  const onClickShare = useCallback(() => {
    const fn = stateToFn(state);
    const encoded = encodeSharable({id: '', ...fn}); // XXX filled dummy id
    window.open(`/options.html#/install?f=${encodeURIComponent(encoded)}`);
  }, [state]);

  const saving = props.saving ?? false;
  const saveLabel = props.install
    ? 'Install'
    : saving
      ? 'Saving...'
      : props.saved
        ? 'Saved'
        : 'Save';

  return (
    <form>
      <Box>
        <Row>
          <Item $grow={1}>
            <TextInput
              label="Name"
              name="name"
              placeholder=""
              value={state.name}
              onInput={onEdit}
              error={state.errors.name}
            />
          </Item>
          <Item style={{width: '9rem'}}>
            <ColorInput
              value={state.backgroundColor}
              onInput={onEdit}
              togglePalette={togglePalette}
              showPalette={state.openPalette}
              error={state.errors.backgroundColor}
            />
          </Item>
        </Row>
        <Row>
          <TextInput
            label="URL Pattern"
            name="pattern"
            placeholder=".*"
            subLabel={
              <span>
                (optional) This function will be displayed if the URL matches.
              </span>
            }
            value={state.pattern || ''}
            onInput={onEdit}
            error={state.errors.pattern}
          />
        </Row>
        <Row>
          <CodeEditor
            code={state.code}
            setCode={onCodeEdit}
            error={state.errors.code}
          />
        </Row>
        {props.error && (
          <Row>
            <div className={styles.error} role="alert">
              {props.error}
            </div>
          </Row>
        )}
        <Row>
          <Item>
            <Button onClick={onClickSave} disabled={!state.canSave || saving}>
              {saveLabel}
            </Button>
          </Item>
          {!props.install && (
            <Item>
              <Button onClick={onClickCancel} disabled={saving}>
                Cancel
              </Button>
            </Item>
          )}
          <Item>
            <DividerV />
          </Item>
          <Item>
            <Button onClick={onClickShare}>
              <ButtonIcon>
                <FontAwesomeIcon icon={faShareSquare} />
              </ButtonIcon>
              {!props.install ? 'Share' : 'Update URL'}
            </Button>
          </Item>
          {!props.install && (
            <Item style={{marginLeft: 'auto'}}>
              <Button onClick={onClickDelete} mode="danger" disabled={saving}>
                <ButtonIcon>
                  <FontAwesomeIcon icon={faTrash} />
                </ButtonIcon>
                Delete
              </Button>
            </Item>
          )}
        </Row>
      </Box>
    </form>
  );
}
