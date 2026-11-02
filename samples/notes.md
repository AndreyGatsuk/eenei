Theme review notes
==================

Use this shorter document to compare everyday prose with code-heavy Markdown.

Reading checklist
-----------------

- Headings should be easy to scan.
- **Important text** and *emphasis* should remain distinct.
- A path such as `src/theme.js` should be readable within a sentence.
- Long paragraphs should stay calm without losing links to
  [related documentation](sample.md).

### Configuration example

    services:
      worker:
        image: example/worker:latest
        restart: unless-stopped

### Review feedback

> The keys are easier to distinguish from values now.
> Check quoted keys and embedded code before finishing.

Status: **in progress**. Next step: compare the light theme.
