/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const isDevPlayground: boolean = process.env.NODE_ENV === 'development';

export const DEFAULT_SETTINGS = {
  disableBeforeInput: false,
  emptyEditor: isDevPlayground,
  isAutocomplete: false,
  isCharLimit: false,
  isCharLimitUtf8: false,
  isCollab: false,
  isMaxLength: false,
  isRichText: true,
  measureTypingPerf: false,
  shouldUseLexicalContextMenu: false,
  showNestedEditorTreeView: false,
  showTableOfContents: false,
  showTreeView: false, // xadd
  tableCellBackgroundColor: true,
  tableCellMerge: true,
};

export type SettingName = keyof typeof DEFAULT_SETTINGS;

export type Settings = typeof DEFAULT_SETTINGS;
