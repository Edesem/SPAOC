import { splitDescription } from "./descriptionLinks";

describe("splitDescription", () => {
  it("returns plain text as a single text part", () => {
    expect(splitDescription("Bring a plate to share.")).toEqual([
      { kind: "text", text: "Bring a plate to share." },
    ]);
  });

  it("labels a link with its site name, without www", () => {
    expect(
      splitDescription("RSVP at https://www.stpaulchurch.com.au/rsvp?id=4 today"),
    ).toEqual([
      { kind: "text", text: "RSVP at " },
      {
        kind: "link",
        url: "https://www.stpaulchurch.com.au/rsvp?id=4",
        label: "stpaulchurch.com.au",
      },
      { kind: "text", text: " today" },
    ]);
  });

  it("keeps sentence punctuation out of the link", () => {
    expect(splitDescription("Details: https://example.com/a.")).toEqual([
      { kind: "text", text: "Details: " },
      { kind: "link", url: "https://example.com/a", label: "example.com" },
      { kind: "text", text: "." },
    ]);
  });

  it("handles several links and a link at the very start", () => {
    const parts = splitDescription("https://a.com and http://b.org");

    expect(parts.filter((part) => part.kind === "link")).toEqual([
      { kind: "link", url: "https://a.com", label: "a.com" },
      { kind: "link", url: "http://b.org", label: "b.org" },
    ]);
  });
});
