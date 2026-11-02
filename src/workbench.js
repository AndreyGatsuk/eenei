const mix = (base, target, amount) => '#' + [1, 3, 5].map((offset) =>
  Math.round(parseInt(base.slice(offset, offset + 2), 16) * (1 - amount)
    + parseInt(target.slice(offset, offset + 2), 16) * amount).toString(16).padStart(2, '0'),
).join('');

function workbenchColors({ colors: c, status }) {
  const ui = {};
  const set = (value, keys) => { for (const key of keys) ui[key] = value; };

  set(c.background, [
    'editor.background', 'editorGroupHeader.tabsBackground', 'editorGroupHeader.noTabsBackground',
    'editorGroupHeader.tabsBorder', 'editor.rangeHighlightBackground', 'activityBar.background',
    'sideBar.background', 'sideBarSectionHeader.background', 'panel.background',
    'titleBar.activeBackground', 'titleBar.inactiveBackground', 'statusBar.background',
    'statusBar.noFolderBackground', 'tab.activeBackground', 'tab.inactiveBackground',
    'terminal.background', 'walkThrough.embeddedEditorBackground',
    'peekViewEditor.background', 'peekViewResult.background', 'peekViewTitle.background',
  ]);
  set(c.surface, [
    'editor.lineHighlightBackground', 'editorHoverWidget.background', 'editorWidget.background',
    'editorMarkerNavigation.background', 'editorSuggestWidget.background',
    'quickInput.background', 'dropdown.background', 'dropdown.listBackground',
    'input.background', 'listFilterWidget.background', 'debugToolBar.background',
    'debugExceptionWidget.background', 'notificationCenterHeader.background',
    'notifications.background', 'menu.background', 'textCodeBlock.background',
    'textBlockQuote.background', 'button.secondaryBackground',
  ]);
  set(c.raised, [
    'list.hoverBackground', 'list.focusBackground', 'quickInputList.focusBackground',
    'statusBarItem.activeBackground', 'statusBarItem.hoverBackground',
    'statusBarItem.prominentBackground', 'statusBarItem.prominentHoverBackground',
    'button.secondaryHoverBackground',
  ]);
  set(c.border, [
    'editorGroup.border', 'editorHoverWidget.border', 'editorSuggestWidget.border',
    'editorWidget.border', 'editorWidget.resizeBorder', 'activityBar.border',
    'sideBar.border', 'sideBarSectionHeader.border', 'panel.border', 'titleBar.border',
    'statusBar.border', 'tab.border', 'dropdown.border', 'input.border',
    'peekView.border', 'pickerGroup.border', 'notifications.border', 'menu.border',
    'debugExceptionWidget.border', 'textSeparator.foreground', 'editorOverviewRuler.border',
    'checkbox.border', 'settings.focusedRowBorder',
  ]);
  set(c.regular, [
    'foreground', 'editor.foreground', 'sideBar.foreground', 'sideBarTitle.foreground',
    'sideBarSectionHeader.foreground', 'icon.foreground', 'input.foreground',
    'dropdown.foreground', 'list.hoverForeground', 'list.focusForeground',
    'quickInput.foreground', 'panelTitle.activeForeground', 'panelSectionHeader.foreground',
    'titleBar.activeForeground', 'titleBar.inactiveForeground', 'tab.activeForeground',
    'terminal.foreground', 'textPreformat.foreground', 'notifications.foreground',
    'menu.foreground', 'button.secondaryForeground', 'editorSuggestWidget.foreground',
    'editorSuggestWidget.selectedForeground', 'settings.headerForeground',
    'peekViewResult.fileForeground', 'peekViewTitleLabel.foreground',
  ]);
  set(c.insignificant, [
    'descriptionForeground', 'activityBar.inactiveForeground', 'editorInlayHint.foreground',
    'editorCodeLens.foreground', 'input.placeholderForeground', 'list.inactiveSelectionForeground',
    'list.invalidItemForeground', 'panelTitle.inactiveForeground', 'statusBar.foreground',
    'tab.inactiveForeground', 'tab.unfocusedActiveForeground', 'tab.unfocusedInactiveForeground',
    'peekViewTitleDescription.foreground', 'tab.unfocusedActiveBorder',
  ]);
  set(c.accent, [
    'editorCursor.foreground', 'editorLink.activeForeground', 'textLink.foreground',
    'textLink.activeForeground', 'editor.findMatchBorder',
    'editorSuggestWidget.highlightForeground', 'editorSuggestWidget.focusHighlightForeground',
    'activityBar.activeBorder', 'activityBarBadge.background', 'badge.foreground',
    'button.background', 'extensionButton.prominentBackground', 'inputOption.activeBorder',
    'inputOption.activeForeground', 'list.activeSelectionForeground', 'list.highlightForeground',
    'list.focusHighlightForeground', 'list.filterMatchBorder', 'listFilterWidget.outline',
    'quickInputList.focusForeground', 'progressBar.background', 'panelTitle.activeBorder',
    'tab.activeBorder', 'settings.modifiedItemIndicator', 'textBlockQuote.border',
    'pickerGroup.foreground', 'checkbox.foreground',
  ]);
  set(c.background, ['button.foreground', 'extensionButton.prominentForeground', 'activityBarBadge.foreground']);
  set(mix(c.accent, c.regular, 0.12), ['button.hoverBackground', 'extensionButton.prominentHoverBackground']);
  set(c.accent + '80', ['focusBorder', 'list.focusAndSelectionOutline', 'editor.wordHighlightBorder']);
  set(c.accent + '33', [
    'badge.background', 'editor.selectionBackground', 'selection.background',
    'list.activeSelectionBackground', 'peekViewEditor.matchHighlightBackground',
    'peekViewResult.matchHighlightBackground',
  ]);
  set(c.accent + '22', ['inputOption.activeBackground', 'editorSuggestWidget.selectedBackground']);
  set(c.accent + '0d', ['editor.findMatchHighlightBackground', 'list.filterMatchBackground']);
  set(c.accent + '12', ['editor.wordHighlightBackground']);
  set(c.surface + 'f2', ['editor.inactiveSelectionBackground', 'editor.selectionHighlightBackground', 'editor.findRangeHighlightBackground']);
  set(c.border, ['editor.selectionHighlightBorder']);
  set(c.accent + 'be', ['editor.findMatchHighlightBorder']);
  set(c.background, ['editor.findMatchBackground']);
  set(c.background + '00', ['editor.findRangeHighlightBorder']);
  set(c.string + '12', ['editor.wordHighlightStrongBackground']);
  set(c.string + '80', ['editor.wordHighlightStrongBorder']);
  set(c.regular + 'cc', ['editorLineNumber.activeForeground', 'activityBar.foreground']);
  set(c.insignificant + '80', ['editorLineNumber.foreground', 'editorWhitespace.foreground']);
  set(c.insignificant + '33', ['editorIndentGuide.background1', 'editorRuler.foreground', 'tree.indentGuidesStroke']);
  set(c.insignificant + '80', ['editorIndentGuide.activeBackground1', 'scrollbarSlider.activeBackground']);
  set(c.insignificant + '33', ['scrollbarSlider.background']);
  set(c.insignificant + '55', ['scrollbarSlider.hoverBackground']);
  set(c.insignificant + '26', ['editorBracketMatch.background']);
  set(c.insignificant + '80', ['editorBracketMatch.border']);
  set('#00000030', ['widget.shadow', 'scrollbar.shadow']);
  for (let index = 1; index <= 6; index++) ui[`editorBracketHighlight.foreground${index}`] = c.insignificant;

  // Status colors are deliberately shared across the decorative families.
  Object.assign(ui, status);
  set(c.surface, ['inputValidation.errorBackground', 'inputValidation.infoBackground', 'inputValidation.warningBackground']);
  return ui;
}

module.exports = { workbenchColors };
