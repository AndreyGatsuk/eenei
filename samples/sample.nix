{ name ? "eenei", active ? true }:
let
  # Preview active projects.
  title = if active then "Project: ${name}" else "Archived";
  count = 42;
  path = ./sample.nix;
  escaped = "quoted \"project\"";
  multiline = ''
    Project preview: ${title}
    # This hash belongs to the string.
  '';
  /* A block comment about the preview. */
  size = builtins.stringLength title;
in
{
  inherit title count path escaped multiline size;
  enabled = active && count > 0;
  sum = count + 2;
  negative = -count;
  notActive = !active;
}
