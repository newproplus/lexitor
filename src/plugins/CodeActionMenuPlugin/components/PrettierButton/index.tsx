/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.css';

import {$isCodeNode} from '@lexical/code';
import {$getNearestNodeFromDOMNode, LexicalEditor} from 'lexical';
import {format, Options} from 'prettier';
import {useState} from 'react';

interface Props {
  lang: string;
  editor: LexicalEditor;
  getCodeDOMNode: () => HTMLElement | null;
}

const PRETTIER_OPTIONS_BY_LANG: Record<string, Options> = {
  css: {
    parser: 'css',
  },
  html: {
    parser: 'html',
  },
  js: {
    parser: 'babel',
  },
  markdown: {
    parser: 'markdown',
  },
};

const LANG_CAN_BE_PRETTIER = Object.keys(PRETTIER_OPTIONS_BY_LANG);

export function canBePrettier(lang: string): boolean {
  return LANG_CAN_BE_PRETTIER.includes(lang);
}

function getPrettierOptions(lang: string): Options {
  const options = PRETTIER_OPTIONS_BY_LANG[lang];
  if (!options) {
    throw new Error(
      `CodeActionMenuPlugin: Prettier does not support this language: ${lang}`,
    );
  }

  return options;
}

export function PrettierButton({lang, editor, getCodeDOMNode}: Props) {
  const [syntaxError, setSyntaxError] = useState<string>('');
  const [tipsVisible, setTipsVisible] = useState<boolean>(false);

  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode();

    try {
      const options = getPrettierOptions(lang);

      if (!codeDOMNode) {
        return;
      }

      editor.update(async () => {
        const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);

        if ($isCodeNode(codeNode)) {
          const content = codeNode.getTextContent();

          let parsed = '';

          try {
            parsed = await format(content, options);
          } catch (error: unknown) {
            setError(error);
          }

          if (parsed !== '') {
            const selection = codeNode.select(0);
            selection.insertText(parsed);
            setSyntaxError('');
            setTipsVisible(false);
          }
        }
      });
    } catch (error: unknown) {
      setError(error);
    }
  }

  function setError(error: unknown) {
    if (error instanceof Error) {
      setSyntaxError(error.message);
      setTipsVisible(true);
    } else {
      console.error('Unexpected error: ', error);
    }
  }

  function handleMouseEnter() {
    if (syntaxError !== '') {
      setTipsVisible(true);
    }
  }

  function handleMouseLeave() {
    if (syntaxError !== '') {
      setTipsVisible(false);
    }
  }

  return (
    <div className="prettier-wrapper">
      <button
        className="menu-item"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="prettier">
        {syntaxError ? (
          <i className="format prettier-error" />
        ) : (
          <i className="format prettier" />
        )}
      </button>
      {tipsVisible ? (
        <pre className="code-error-tips">{syntaxError}</pre>
      ) : null}
    </div>
  );
}
