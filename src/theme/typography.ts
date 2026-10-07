import type { TextStyle } from "react-native";

// The two Alegreya families are embedded at build time by the `expo-font`
// plugin in app.json, so the names here must match what that plugin registers
// (typography.test.ts checks the two agree). Alegreya, the serif, is the
// liturgical voice; Alegreya Sans is the noticeboard voice.
export const fontFamily = {
  serif: "Alegreya",
  sans: "Alegreya Sans",
  // Real small capitals, for short uppercase-style headings.
  smallCaps: "Alegreya SC",
} as const;

export type FontFace = {
  family: string;
  weight: string;
  style: "normal" | "italic";
  // Relative to the project root, as the expo-font plugin expects.
  file: string;
};

const SERIF_DIR = "node_modules/@expo-google-fonts/alegreya";
const SANS_DIR = "node_modules/@expo-google-fonts/alegreya-sans";
const SMALL_CAPS_DIR = "node_modules/@expo-google-fonts/alegreya-sc";

// Only the faces the app uses. Alegreya Sans has no 600, so semibold text is
// 500 or 700; typography.test.ts fails if a token asks for a face that is not
// listed here.
export const fontFaces: FontFace[] = [
  {
    family: fontFamily.serif,
    weight: "400",
    style: "normal",
    file: `${SERIF_DIR}/400Regular/Alegreya_400Regular.ttf`,
  },
  {
    family: fontFamily.serif,
    weight: "400",
    style: "italic",
    file: `${SERIF_DIR}/400Regular_Italic/Alegreya_400Regular_Italic.ttf`,
  },
  {
    family: fontFamily.serif,
    weight: "700",
    style: "normal",
    file: `${SERIF_DIR}/700Bold/Alegreya_700Bold.ttf`,
  },
  {
    family: fontFamily.sans,
    weight: "400",
    style: "normal",
    file: `${SANS_DIR}/400Regular/AlegreyaSans_400Regular.ttf`,
  },
  {
    family: fontFamily.sans,
    weight: "400",
    style: "italic",
    file: `${SANS_DIR}/400Regular_Italic/AlegreyaSans_400Regular_Italic.ttf`,
  },
  {
    family: fontFamily.sans,
    weight: "500",
    style: "normal",
    file: `${SANS_DIR}/500Medium/AlegreyaSans_500Medium.ttf`,
  },
  {
    family: fontFamily.sans,
    weight: "700",
    style: "normal",
    file: `${SANS_DIR}/700Bold/AlegreyaSans_700Bold.ttf`,
  },
  {
    family: fontFamily.smallCaps,
    weight: "700",
    style: "italic",
    file: `${SMALL_CAPS_DIR}/700Bold_Italic/AlegreyaSC_700Bold_Italic.ttf`,
  },
];

// Stack header titles keep the platform's size and take only the serif face.
export const headerTitleStyle: TextStyle = {
  fontFamily: fontFamily.serif,
  fontWeight: "700",
};

export type TypographyToken =
  | "displayTitle"
  | "eyebrow"
  | "readingTitle"
  | "liturgicalTitle"
  | "reading"
  | "readingTeaser"
  | "quote"
  | "headline"
  | "sectionTitle"
  | "title"
  | "body"
  | "bodyStrong"
  | "button"
  | "label"
  | "aside";

const serif = (style: TextStyle): TextStyle => ({
  fontFamily: fontFamily.serif,
  ...style,
});

// Times and dates are the core content, so the sans never falls back to
// old-style figures that sit below the baseline.
const sans = (style: TextStyle): TextStyle => ({
  fontFamily: fontFamily.sans,
  fontVariant: ["lining-nums"],
  ...style,
});

// Tokens carry family, size, weight, style and line height only. Margins,
// alignment and colour stay with the screen.
export const typography: Record<TypographyToken, TextStyle> = {
  // Liturgical voice
  displayTitle: serif({ fontSize: 25, fontWeight: "700" }),
  readingTitle: serif({ fontSize: 25, fontWeight: "700" }),
  liturgicalTitle: serif({ fontSize: 19, fontWeight: "400" }),
  reading: serif({ fontSize: 19, fontWeight: "400", lineHeight: 26 }),
  readingTeaser: serif({ fontSize: 17, fontWeight: "400", lineHeight: 24 }),
  quote: serif({ fontSize: 17, fontWeight: "400", fontStyle: "italic" }),
  // A small heading that sits above a larger name.
  eyebrow: {
    fontFamily: fontFamily.smallCaps,
    fontSize: 15,
    fontWeight: "700",
    fontStyle: "italic",
  },

  // Noticeboard voice
  headline: sans({ fontSize: 25, fontWeight: "700" }),
  sectionTitle: sans({ fontSize: 25, fontWeight: "700" }),
  title: sans({ fontSize: 19, fontWeight: "400" }),
  body: sans({ fontSize: 17, fontWeight: "400", lineHeight: 24 }),
  bodyStrong: sans({ fontSize: 17, fontWeight: "500" }),
  button: sans({ fontSize: 17, fontWeight: "700" }),
  label: sans({ fontSize: 15, fontWeight: "400" }),
  aside: sans({ fontSize: 17, fontWeight: "400", fontStyle: "italic" }),
};
