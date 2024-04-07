# Lexitor

A rich text editor based on [lexical playground](https://github.com/facebook/lexical/tree/main/packages/lexical-playground).

Lexical version: **v0.14.3**

## Using

### Import and DOM

```js
import { PlaygroundApp } from 'lexitor'
import 'lexitor/style.css'
```

```jsx
<PlaygroundApp />
```

### Medhod:

- onChange(content: string): A callback when content changes.
- setContentType(contentType: ContentType): Set the content type fo the editor, 'json' or 'markdown', defaults "json".
- setJson(content: string): Set a JSON data to editor, valid when ContentType equals "json".
- setMarkdown(content: string): Set a Markdown data to editor, valid when ContentType equals "markdown".

## Differents with lexical playground

### Moved

**Settings button** is displayed in toolbar. Merge **src/Settings.tsx** and **src/plugins/ActionsPlugin/index.tsx** to **src/plugins/ToolbarPlugin/Settings.tsx**.

### Commented out

- CommentPlugin, including **src/plugins/FloatingTextFormatToolbarPlugin/index.tsx** / **src/Editor.tsx**.
- DocsPlugin

### Styles

Keep all the content of **index.css**, add customed styles to **styles/**.

Add **dark mode** in **PlaygroundEditorThemeDark.scss**. Using `<html lang="en" class="dark">` to enable **dark mode**.

Using **.lexitor** and prefix **lexitor___** to limit style scope.

### Other:

Update **prettier**, using version 3.x.

Change `import katex from 'katex';` to `import * as katex from 'katex';`.

Commented out some images, shuch as "images/cat-typing.gif" / "images/landscape.jpg" / "images/yellow-flower.jpg"

Copy some files in "packages/shared/src/" of **lexical** to "src/shared/".

In **vite.config.ts**, using some new alias instead of  using **moduleResolution**.