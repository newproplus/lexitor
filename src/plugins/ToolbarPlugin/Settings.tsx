/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 *
 * Merged from `src/Settings.tsx` and `src/plugins/ActionsPlugin/index.tsx`.
 * There are two DropDown menus, one is for normal user, the other one is for developer.
 *
 *
 */

import type {LexicalEditor} from 'lexical';

import {$createCodeNode, $isCodeNode} from '@lexical/code';
import {exportFile, importFile} from '@lexical/file';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';
import {useCollaborationContext} from '@lexical/react/LexicalCollaborationContext';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {CONNECTED_COMMAND, TOGGLE_CONNECT_COMMAND} from '@lexical/yjs';
import {
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical';

import {useCallback, useEffect, useMemo, useState} from 'react';

import useModal from '../../hooks/useModal';
import Button from '../../ui/Button';
import {PLAYGROUND_TRANSFORMERS} from '../MarkdownTransformers';
import {
  SPEECH_TO_TEXT_COMMAND,
  SUPPORT_SPEECH_RECOGNITION,
} from '../SpeechToTextPlugin';

import {isDevPlayground} from '@/appSettings';
import {useSettings} from '@/context/SettingsContext';
import DropDown, {DropDownItem} from '@/ui/DropDown';

async function sendEditorState(editor: LexicalEditor): Promise<void> {
  const stringifiedEditorState = JSON.stringify(editor.getEditorState());
  try {
    await fetch('http://localhost:1235/setEditorState', {
      body: stringifiedEditorState,
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      method: 'POST',
    });
  } catch {
    // NO-OP
  }
}

async function validateEditorState(editor: LexicalEditor): Promise<void> {
  const stringifiedEditorState = JSON.stringify(editor.getEditorState());
  let response = null;
  try {
    response = await fetch('http://localhost:1235/validateEditorState', {
      body: stringifiedEditorState,
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      method: 'POST',
    });
  } catch {
    // NO-OP
  }
  if (response !== null && response.status === 403) {
    throw new Error(
      'Editor state validation failed! Server did not accept changes.',
    );
  }
}

export function dropDownActiveClass(active: boolean) {
  if (active) {
    return 'active dropdown-item-active-text';
  } else {
    return '';
  }
}

export default function Settings(): JSX.Element {
  const windowLocation = window.location;
  const {
    setOption,
    settings: {
      measureTypingPerf,
      isCollab,
      isRichText,
      isMaxLength,
      isCharLimit,
      isCharLimitUtf8,
      isAutocomplete,
      showTreeView,
      showNestedEditorTreeView,
      disableBeforeInput,
      showTableOfContents,
      shouldUseLexicalContextMenu,
    },
  } = useSettings();

  const [isSplitScreen, search] = useMemo(() => {
    const parentWindow = window.parent;
    const _search = windowLocation.search;
    const _isSplitScreen =
      parentWindow && parentWindow.location.pathname === '/split/';
    return [_isSplitScreen, _search];
  }, [windowLocation]);
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [modal, showModal] = useModal();
  const {isCollabActive} = useCollaborationContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      editor.registerCommand<boolean>(
        CONNECTED_COMMAND,
        (payload) => {
          const isConnected = payload;
          setConnected(isConnected);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(
      ({dirtyElements, prevEditorState, tags}) => {
        // If we are in read only mode, send the editor state
        // to server and ask for validation if possible.
        if (
          !isEditable &&
          dirtyElements.size > 0 &&
          !tags.has('historic') &&
          !tags.has('collaboration')
        ) {
          validateEditorState(editor);
        }
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();

          if (children.length > 1) {
            setIsEditorEmpty(false);
          } else {
            if ($isParagraphNode(children[0])) {
              const paragraphChildren = children[0].getChildren();
              setIsEditorEmpty(paragraphChildren.length === 0);
            } else {
              setIsEditorEmpty(false);
            }
          }
        });
      },
    );
  }, [editor, isEditable]);

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
        $convertFromMarkdownString(
          firstChild.getTextContent(),
          PLAYGROUND_TRANSFORMERS,
        );
      } else {
        const markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
        root
          .clear()
          .append(
            $createCodeNode('markdown').append($createTextNode(markdown)),
          );
      }
      root.selectEnd();
    });
  }, [editor]);

  return (
    <>
      {/* Common tools */}
      <DropDown
        buttonClassName="toolbar-item spaced"
        buttonLabel=""
        buttonAriaLabel="Insert specialized editor node"
        buttonIconClassName="icon settings"
        stopCloseOnClickSelf={true}>
        <>
          <DropDownItem
            onClick={() => {}}
            className={'item ' + dropDownActiveClass(showTableOfContents)}>
            <span
              onClick={() => {
                setOption('showTableOfContents', !showTableOfContents);
              }}>
              Table Of Contents
            </span>
          </DropDownItem>
          <DropDownItem
            onClick={() => {}}
            className={
              'item ' + dropDownActiveClass(shouldUseLexicalContextMenu)
            }>
            <span
              onClick={() => {
                setOption(
                  'shouldUseLexicalContextMenu',
                  !shouldUseLexicalContextMenu,
                );
              }}>
              Use Lexical Context Menu
            </span>
          </DropDownItem>

          {SUPPORT_SPEECH_RECOGNITION && (
            <DropDownItem
              onClick={() => {}}
              className={
                'item action-button' + dropDownActiveClass(isSpeechToText)
              }>
              <span
                onClick={() => {
                  editor.dispatchCommand(
                    SPEECH_TO_TEXT_COMMAND,
                    !isSpeechToText,
                  );
                  setIsSpeechToText(!isSpeechToText);
                }}
                className={
                  'action-button action-button-mic ' +
                  (isSpeechToText ? 'active' : '')
                }
                title="Speech To Text"
                aria-label={`${
                  isSpeechToText ? 'Enable' : 'Disable'
                } speech to text`}>
                <i className="mic" />
              </span>
            </DropDownItem>
          )}
          <DropDownItem
            onClick={() => {
              showModal('Clear editor', (onClose) => (
                <ShowClearDialog editor={editor} onClose={onClose} />
              ));
            }}
            className="item action-button">
            <i className="clear" />
            Clear content
          </DropDownItem>

          <DropDownItem
            onClick={() => {
              // Send latest editor state to commenting validation server
              if (isEditable) {
                sendEditorState(editor);
              }
              editor.setEditable(!editor.isEditable());
            }}
            className={`item action-button ${
              !isEditable ? 'unlock' + dropDownActiveClass(true) : 'lock'
            }`}>
            <i className={!isEditable ? 'unlock' : 'lock'} />
            Read-Only Mode
          </DropDownItem>

          <DropDownItem
            onClick={() => {
              handleMarkdownToggle();
            }}
            className="item action-button">
            <i className="markdown" />
            Convert From/To Markdown
          </DropDownItem>

          {isCollabActive && (
            <DropDownItem
              onClick={() => {}}
              className={'item action-button' + dropDownActiveClass(connected)}>
              <span
                className="action-button connect "
                onClick={() => {
                  editor.dispatchCommand(TOGGLE_CONNECT_COMMAND, !connected);
                }}
                title={`${
                  connected ? 'Disconnect' : 'Connect'
                } Collaborative Editing`}
                aria-label={`${
                  connected ? 'Disconnect from' : 'Connect to'
                } a collaborative editing server`}>
                <i className={connected ? 'disconnect' : 'connect'} />
              </span>
            </DropDownItem>
          )}

          {modal}
        </>
      </DropDown>

      {/* Advanced tools */}

      <DropDown
        buttonClassName="toolbar-item spaced"
        buttonLabel=""
        buttonAriaLabel="Insert specialized editor node"
        buttonIconClassName="icon settings-dev"
        stopCloseOnClickSelf={true}>
        <DropDownItem
          onClick={() => {
            importFile(editor);
          }}
          className="item action-button">
          <i className="import" />
          Import from JSON
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            exportFile(editor, {
              fileName: `Playground ${new Date().toISOString()}`,
              source: 'Playground',
            });
          }}
          className="item action-button">
          <i className="export" />
          Export to JSON
        </DropDownItem>

        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(measureTypingPerf)}>
          <span
            onClick={() => setOption('measureTypingPerf', !measureTypingPerf)}>
            Measure Perf
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(showTreeView)}>
          <span onClick={() => setOption('showTreeView', !showTreeView)}>
            Debug View
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(showNestedEditorTreeView)}>
          <span
            onClick={() =>
              setOption('showNestedEditorTreeView', !showNestedEditorTreeView)
            }>
            Nested Editors Debug View
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(isRichText)}>
          <span
            onClick={() => {
              setOption('isRichText', !isRichText);
              setOption('isCollab', false);
            }}>
            Rich Text
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(isCharLimit)}>
          <span onClick={() => setOption('isCharLimit', !isCharLimit)}>
            Char Limit
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(isCharLimitUtf8)}>
          <span onClick={() => setOption('isCharLimitUtf8', !isCharLimitUtf8)}>
            Char Limit (UTF-8)
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(isMaxLength)}>
          <span onClick={() => setOption('isMaxLength', !isMaxLength)}>
            Max Length
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(isAutocomplete)}>
          <span onClick={() => setOption('isAutocomplete', !isAutocomplete)}>
            Autocomplete
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(disableBeforeInput)}>
          <span
            onClick={() => {
              setOption('disableBeforeInput', !disableBeforeInput);
              setTimeout(() => window.location.reload(), 500);
            }}>
            Legacy Events
          </span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {}}
          className={'item ' + dropDownActiveClass(isSplitScreen)}>
          <span
            onClick={() => {
              if (isSplitScreen) {
                window.parent.location.href = `/${search}`;
              } else {
                window.location.href = `/split/${search}`;
              }
            }}>
            Split Screen
          </span>
        </DropDownItem>
      </DropDown>
    </>
  );
}

function ShowClearDialog({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  return (
    <>
      Are you sure you want to clear the editor?
      <div className="Modal__content">
        <Button
          onClick={() => {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            editor.focus();
            onClose();
          }}>
          Clear
        </Button>{' '}
        <Button
          onClick={() => {
            editor.focus();
            onClose();
          }}>
          Cancel
        </Button>
      </div>
    </>
  );
}
