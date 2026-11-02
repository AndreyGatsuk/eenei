# Customization

Eenei works without configuration. These are optional examples for your own
**Preferences: Open User Settings (JSON)**. Merge the keys you want into your
existing settings; remove them to return to the theme defaults.

Changes are scoped to the named theme. Use its exact name, including Dark or Light.
These are native VS Code settings, not extension-specific `eenei.*` options.

## Change a UI accent

For a rose-colored cursor, active tab border and links in Rose Dark:

```json
{
  "workbench.colorCustomizations": {
    "[Eenei on Rose Dark]": {
      "editorCursor.foreground": "#CC9DB8",
      "tab.activeBorder": "#CC9DB8",
      "textLink.foreground": "#CC9DB8",
      "textLink.activeForeground": "#CC9DB8"
    }
  }
}
```

Each workbench key changes its own control. For a coordinated change throughout
the UI, edit the source `accent` role and build a personal VSIX; see
[development](development.md). The normal release keeps frost blue across families.

## Adjust comment colors

Use the `comments` shorthand for comments recognized as such by the syntax grammar:

```json
{
  "editor.tokenColorCustomizations": {
    "[Eenei on Hellebore Dark]": {
      "comments": "#B5A6B1"
    }
  }
}
```

Python docstrings are string scopes. To change them separately, use the matching
TextMate scope as in the next example. Theme-specific grammar rules can be more
specific than a broad `comment` selector; inspect the token if an override does
not apply where expected.

## Remove comment italics

This removes italics from Python line comments and docstrings in Lilac Dark,
including their delimiters. It leaves syntax colors as supplied by the theme.

```json
{
  "editor.tokenColorCustomizations": {
    "[Eenei on Lilac Dark]": {
      "textMateRules": [
        {
          "scope": [
            "comment",
            "comment punctuation.definition.comment",
            "string.quoted.docstring",
            "string.quoted.docstring punctuation.definition.string"
          ],
          "settings": { "fontStyle": "" }
        }
      ]
    }
  }
}
```

For a token that retains its style, run **Developer: Inspect Editor Tokens and
Scopes** and use its more specific scope. These overrides follow TextMate grammar
scopes. They do not add semantic highlighting or language-server features.

For persistent palette changes shared by everyone, edit `src/palettes/` and submit
the source change rather than relying on user settings.

References: [VS Code theme customization](https://code.visualstudio.com/docs/configure/themes#_customizing-a-color-theme),
[workbench color keys](https://code.visualstudio.com/api/references/theme-color),
and [Catppuccin's customization examples](https://github.com/catppuccin/vscode#customization).

[Back to Eenei](../README.md)
