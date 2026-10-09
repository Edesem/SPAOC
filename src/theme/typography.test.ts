import * as fs from "fs";
import * as path from "path";
import appConfig from "../../app.json";
import { fontFaces, fontFamily, typography } from "./typography";

const ROOT = path.resolve(__dirname, "../..");

const tokens = Object.entries(typography);
const sansTokens = tokens.filter(
  ([, token]) => token.fontFamily === fontFamily.sans,
);

type FontPluginConfig = {
  ios: { fonts: string[] };
  android: {
    fonts: {
      fontFamily: string;
      fontDefinitions: { path: string; weight: number; style?: string }[];
    }[];
  };
};

function fontPluginConfig(): FontPluginConfig {
  const entry = appConfig.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-font",
  );
  if (!Array.isArray(entry)) {
    throw new Error("app.json does not configure the expo-font plugin");
  }
  return entry[1] as unknown as FontPluginConfig;
}

describe("typography", () => {
  it("defines the named tokens the screens use", () => {
    expect(Object.keys(typography).sort()).toEqual(
      [
        "aside",
        "body",
        "bodyStrong",
        "button",
        "displayTitle",
        "dropCap",
        "eyebrow",
        "headline",
        "label",
        "liturgicalTitle",
        "quote",
        "reading",
        "readingLabel",
        "readingTeaser",
        "readingTitle",
        "sectionTitle",
        "subtitle",
        "title",
      ].sort(),
    );
  });

  it.each(tokens)("%s uses one of the Alegreya families", (_name, token) => {
    expect([fontFamily.serif, fontFamily.sans, fontFamily.smallCaps]).toContain(
      token.fontFamily,
    );
  });

  it.each(tokens)(
    "%s asks for a face that is bundled with the app",
    (_name, token) => {
      const bundled = fontFaces.some(
        (face) =>
          face.family === token.fontFamily &&
          face.weight === token.fontWeight &&
          face.style === (token.fontStyle ?? "normal"),
      );

      expect(bundled).toBe(true);
    },
  );

  it.each(sansTokens)(
    "%s keeps lining figures so times and dates stay level",
    (_name, token) => {
      expect(token.fontVariant).toContain("lining-nums");
    },
  );

  it("sets the eyebrow upright, in the bold small capitals", () => {
    expect(typography.eyebrow).toMatchObject({
      fontFamily: fontFamily.smallCaps,
      fontWeight: "700",
    });
    expect(typography.eyebrow.fontStyle).toBeUndefined();
  });

  // The one table to edit when tuning sizes on a device.
  it("sets each token at its size", () => {
    expect(
      Object.fromEntries(tokens.map(([name, token]) => [name, token.fontSize])),
    ).toEqual({
      displayTitle: 30,
      dropCap: 52,
      eyebrow: 18,
      readingTitle: 25,
      liturgicalTitle: 19,
      reading: 19,
      readingLabel: 18,
      readingTeaser: 17,
      quote: 17,
      headline: 25,
      sectionTitle: 25,
      title: 19,
      body: 17,
      bodyStrong: 17,
      button: 17,
      label: 15,
      aside: 17,
      subtitle: 19,
    });
  });

  it("sets the subtitle upright, in the sans", () => {
    expect(typography.subtitle).toMatchObject({
      fontFamily: fontFamily.sans,
      fontWeight: "400",
    });
    expect(typography.subtitle.fontStyle).toBeUndefined();
  });

  it("sets the reading label in the italic small capitals", () => {
    expect(typography.readingLabel).toMatchObject({
      fontFamily: fontFamily.smallCaps,
      fontWeight: "400",
      fontStyle: "italic",
    });
  });

  it("bundles the nine faces and no Alegreya Sans 600, which does not exist", () => {
    expect(fontFaces).toHaveLength(9);
    expect(
      fontFaces.filter((face) => face.family === fontFamily.smallCaps),
    ).toHaveLength(2);
    expect(
      fontFaces.filter((face) => face.family === fontFamily.sans),
    ).toHaveLength(4);
    expect(fontFaces.some((face) => face.weight === "600")).toBe(false);
  });

  describe("expo-font plugin in app.json", () => {
    it("links every bundled face on iOS", () => {
      const configured = fontPluginConfig().ios.fonts;

      expect([...configured].sort()).toEqual(
        fontFaces.map((face) => face.file).sort(),
      );
    });

    it("registers every bundled face on Android with its weight and style", () => {
      const configured = fontPluginConfig().android.fonts.flatMap((family) =>
        family.fontDefinitions.map((definition) => ({
          family: family.fontFamily,
          weight: String(definition.weight),
          style: definition.style ?? "normal",
          file: definition.path,
        })),
      );
      const bundled = fontFaces.map(({ family, weight, style, file }) => ({
        family,
        weight,
        style,
        file,
      }));
      const byFile = (a: { file: string }, b: { file: string }) =>
        a.file.localeCompare(b.file);

      expect([...configured].sort(byFile)).toEqual([...bundled].sort(byFile));
    });

    it("points at font files that exist", () => {
      for (const face of fontFaces) {
        expect(fs.existsSync(path.join(ROOT, face.file))).toBe(true);
      }
    });
  });
});
