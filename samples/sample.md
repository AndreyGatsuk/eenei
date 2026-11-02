# Navigate: Markdown preview

Open this file in the **text editor** to inspect syntax colors, then use
the *Markdown preview* to compare the rendered document.

## Text and links

This paragraph includes **bold**, *italic*, ***bold italic***,
~~strikethrough~~, and inline code: `docker compose config`.

Visit [the example project](https://example.com "Project home") or open
the [Compose sample](compose.yaml). Escaped formatting: \*plain text\*.

> Keep comments readable and let the code structure guide your eyes.
>
> A second paragraph with **emphasis** and `inline code`.

## Lists

- [x] Check dark and light themes
- [ ] Inspect strings, numbers and punctuation
- [ ] Compare headings and links

1. Open a sample file.
2. Select the Navigate theme.
3. Save a color change and inspect the result.

## Fenced code

```typescript
interface Project { name: string; archived: boolean }

// Only show active projects.
const names = projects
  .filter((project: Project) => !project.archived)
  .map((project: Project) => `Project: ${project.name}`);
```

```yaml
services:
  web:
    image: nginx:alpine
    ports: ["8080:80"]
    read_only: true
```

```bash
docker compose config --services
```

## Table

| Element | Example | Expected role |
| --- | --- | --- |
| Name | `services` | Structure |
| String | `"8080:80"` | Readable value |
| Number | `8080` | Regular value |

---

<!-- This comment is visible only in the source editor. -->

<details>
<summary>Inline HTML example</summary>

Additional notes with an &amp; entity and a [reference link][project].

</details>

[project]: https://example.com "Example project"
