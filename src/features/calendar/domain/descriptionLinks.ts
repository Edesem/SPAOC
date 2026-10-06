export type DescriptionPart =
  | { kind: "text"; text: string }
  | { kind: "link"; url: string; label: string };

const URL_PATTERN = /https?:\/\/[^\s]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

// "https://www.example.com/page?x=1" -> "example.com". The full address stays
// the link's target; the label is just the part a person recognises.
const linkLabel = (url: string): string => {
  const host = /^https?:\/\/([^/?#]+)/.exec(url)?.[1] ?? url;
  return host.replace(/^www\./, "");
};

// Splits a description into plain text and links. Punctuation that ends a
// sentence ("see https://example.com.") stays in the text, not the link.
export const splitDescription = (description: string): DescriptionPart[] => {
  const parts: DescriptionPart[] = [];
  let cursor = 0;

  for (const match of description.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const url = raw.replace(TRAILING_PUNCTUATION, "");
    const start = match.index ?? 0;

    if (start > cursor) {
      parts.push({ kind: "text", text: description.slice(cursor, start) });
    }
    parts.push({ kind: "link", url, label: linkLabel(url) });
    cursor = start + url.length;
  }

  if (cursor < description.length) {
    parts.push({ kind: "text", text: description.slice(cursor) });
  }

  return parts;
};
