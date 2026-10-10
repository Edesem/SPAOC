import {
  AKATHIST_URL,
  CENSING_HOME_URL,
  GREAT_COMPLINE_URL,
  GREAT_VESPERS_URL,
  MATINS_BILINGUAL_URL,
  MATINS_URL,
  MORNING_PRAYERS_URL,
  PARAKLESIS_URL,
  PREPARATION_FOR_COMMUNION_URL,
  PRESANCTIFIED_LITURGY_URL,
  SMALL_COMPLINE_PRIEST_URL,
  SMALL_COMPLINE_URL,
} from "../constants";
import type { LiturgicalData, Reading } from "../services";
import PrayerScreen from "./PrayerScreen";
import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import type { DailyReadingsParams, PdfViewerParams } from "@/types/routes";
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import React from "react";
import { Alert, StyleSheet } from "react-native";

// The screen is tested against a fake usePrayerFeature, the same way
// HomeScreen is tested against useHomeFeature. What the feature returns is
// covered by usePrayerFeature.test.ts. The screen never reads the clock
// itself (the date comes from the feature), so there is nothing to pin here.

const mockLoad = jest.fn();
const mockRefresh = jest.fn();
const mockPush = jest.fn();

const baseFeature = {
  // 1pm Sunday 15 March 2026 in parish time, still Saturday evening in the
  // Los Angeles device zone Jest runs in (jest.global-setup.js).
  selectedDate: new Date("2026-03-15T02:00:00.000Z"),
  loading: false,
  refreshing: false,
  error: null as Error | null,
  data: null as LiturgicalData | null,
  load: mockLoad,
  refresh: mockRefresh,
};

let mockFeature: typeof baseFeature = baseFeature;
let mockPickerProps: {
  visible: boolean;
  date: Date;
  accentColour: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};

jest.mock("@/features/prayer/hooks/usePrayerFeature", () => ({
  usePrayerFeature: () => mockFeature,
}));

jest.mock("expo-router", () => ({
  ...require("@/testing/expoRouterStack").createStackMock(),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Renders nothing, but keeps the props so a test can see whether the picker is
// open and answer it the way the native dialog would.
jest.mock("../components/DatePickerSheet", () => (props: any) => {
  mockPickerProps = props;
  return null;
});

// The package ships untranspiled ESM, which Jest can't load.
jest.mock("@fortawesome/react-native-fontawesome", () => ({
  FontAwesomeIcon: () => null,
}));

const reading = (
  kind: Reading["kind"],
  title: string,
  overrides: Partial<Reading> = {},
): Reading => ({
  kind,
  title,
  teaser: `${title} teaser`,
  fullText: `${title} full text`,
  ...overrides,
});

const epistle = reading("epistle", "HEBREWS 11:24-26");
const gospel = reading("gospel", "MARK 2:1-12");
const thirdReading = reading("thirdReading", "GENESIS 1:1-13");

const dataWith = (overrides: Partial<LiturgicalData> = {}): LiturgicalData => ({
  day: { feastTitle: null, readings: [epistle, gospel] },
  services: [],
  ...overrides,
});

const section = (heading: string) => {
  const parent = screen.getByText(heading).parent;
  if (!parent) throw new Error(`No section for ${heading}`);
  return within(parent);
};

// What the OK button on the "Silence Your Phone!" alert does.
const confirmAlert = async () => {
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
  await act(async () => buttons[0].onPress());
};

describe("PrayerScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeature = baseFeature;
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("header", () => {
    it("shows the selected date", async () => {
      await render(<PrayerScreen />);

      expect(screen.getByText("Sunday, March 15, 2026")).toBeTruthy();
    });

    it("left-aligns the quote, in line with the header title", async () => {
      await render(<PrayerScreen />);

      expect(screen.getByText(/Pray without ceasing/)).toHaveStyle({
        textAlign: "left",
      });
    });

    it("sets the quote upright in the sans at 19, not italic", async () => {
      await render(<PrayerScreen />);

      const quote = StyleSheet.flatten(
        screen.getByText(/Pray without ceasing/).props.style,
      );
      expect(quote).toMatchObject({
        fontFamily: fontFamily.sans,
        fontSize: 19,
      });
      expect(quote.fontStyle).toBeUndefined();
    });

    it("left-aligns the date and the feast title, in line with the header title", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          day: { feastTitle: "THE SUNDAY OF ORTHODOXY", readings: [epistle] },
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByText("Sunday, March 15, 2026")).toHaveStyle({
        textAlign: "left",
      });
      expect(screen.getByText("The Sunday of Orthodoxy")).toHaveStyle({
        textAlign: "left",
      });
    });

    it("shows the feast title in title case", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          day: {
            feastTitle: "THE SUNDAY OF ORTHODOXY",
            readings: [epistle, gospel],
          },
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByText("The Sunday of Orthodoxy")).toBeTruthy();
    });

    it("shows no feast title when the day has none", async () => {
      mockFeature = { ...baseFeature, data: dataWith() };

      await render(<PrayerScreen />);

      expect(screen.queryByText("The Sunday of Orthodoxy")).toBeNull();
    });

    it("sets the feast title in the serif, in the commemorate red", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          day: { feastTitle: "THE SUNDAY OF ORTHODOXY", readings: [epistle] },
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByText("The Sunday of Orthodoxy")).toHaveStyle({
        fontFamily: fontFamily.serif,
        fontSize: 19,
        color: Colours.light.commemorate,
      });
    });

    it("sets the date as a section heading, which screen readers announce as a header", async () => {
      await render(<PrayerScreen />);

      expect(
        screen.getByRole("header", { name: "Sunday, March 15, 2026" }),
      ).toHaveStyle({ fontFamily: fontFamily.serif, fontSize: 28 });
    });

    it("insets the quote and the date by the same 20 so they line up", async () => {
      await render(<PrayerScreen />);

      const quote = StyleSheet.flatten(
        screen.getByText(/Pray without ceasing/).props.style,
      );
      const date = StyleSheet.flatten(
        screen.getByText("Sunday, March 15, 2026").props.style,
      );
      expect(quote.marginHorizontal).toBe(20);
      expect(date.marginHorizontal).toBe(20);
    });
  });

  describe("ornamental dividers", () => {
    const HIDDEN = { includeHiddenElements: true };

    it("closes the header, then opens each of the four lists", async () => {
      await render(<PrayerScreen />);

      expect(screen.getAllByTestId("ornamental-divider", HIDDEN)).toHaveLength(
        5,
      );
    });

    it("draws them in the bronze accent", async () => {
      await render(<PrayerScreen />);

      for (const rule of screen.getAllByTestId(
        "ornamental-divider-rule",
        HIDDEN,
      )) {
        expect(rule).toHaveStyle({ backgroundColor: Colours.light.secondary });
      }
    });
  });

  describe("loading", () => {
    beforeEach(() => {
      mockFeature = { ...baseFeature, loading: true };
    });

    it("shows loading messages for the readings and the daily texts", async () => {
      await render(<PrayerScreen />);

      expect(screen.getByText("Loading Readings...")).toBeTruthy();
      expect(screen.getByText("Loading readings...")).toBeTruthy();
      expect(screen.getByText("Loading prayers...")).toBeTruthy();
    });

    it("shows no reading cards or daily texts while loading", async () => {
      mockFeature = {
        ...mockFeature,
        data: dataWith({
          services: [{ title: "Daily Vespers", pdfUrl: "https://x/v.pdf" }],
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.queryByText("Hebrews 11:24-26")).toBeNull();
      expect(screen.queryByText("Daily Vespers")).toBeNull();
    });

    it("still shows the fixed prayer lists", async () => {
      await render(<PrayerScreen />);

      expect(screen.getByText("Prayers")).toBeTruthy();
      expect(screen.getByText("Morning Prayers")).toBeTruthy();
    });
  });

  describe("daily texts", () => {
    it("shows an error message when the load failed", async () => {
      mockFeature = { ...baseFeature, error: new Error("offline") };

      await render(<PrayerScreen />);

      expect(screen.getByText("Error loading prayers")).toBeTruthy();
      expect(
        screen.queryByText("There are no liturgical texts today."),
      ).toBeNull();
    });

    it("sets the error message in the sans rather than the system font", async () => {
      mockFeature = { ...baseFeature, error: new Error("offline") };

      await render(<PrayerScreen />);

      expect(screen.getByText("Error loading prayers")).toHaveStyle({
        fontFamily: fontFamily.sans,
      });
    });

    it("offers a retry that reloads the selected day", async () => {
      mockFeature = { ...baseFeature, error: new Error("offline") };

      await render(<PrayerScreen />);
      await fireEvent.press(screen.getByLabelText("Try loading prayers again"));

      expect(mockLoad).toHaveBeenCalledWith(baseFeature.selectedDate);
    });

    it("shows the empty message when the day has no services", async () => {
      mockFeature = { ...baseFeature, data: dataWith({ services: [] }) };

      await render(<PrayerScreen />);

      expect(
        screen.getByText("There are no liturgical texts today."),
      ).toBeTruthy();
      expect(screen.queryByText("Error loading prayers")).toBeNull();
    });

    it("shows the empty message when the provider listed no services", async () => {
      mockFeature = { ...baseFeature, data: dataWith({ services: null }) };

      await render(<PrayerScreen />);

      expect(
        screen.getByText("There are no liturgical texts today."),
      ).toBeTruthy();
    });

    it("shows the empty message before any data has arrived", async () => {
      await render(<PrayerScreen />);

      expect(
        screen.getByText("There are no liturgical texts today."),
      ).toBeTruthy();
    });

    it("lists each of the day's services", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          services: [
            { title: "Daily Vespers", pdfUrl: "https://x/vespers.pdf" },
            { title: "Daily Matins", pdfUrl: "https://x/matins.pdf" },
          ],
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByText("Daily Vespers")).toBeTruthy();
      expect(screen.getByText("Daily Matins")).toBeTruthy();
      expect(
        screen.queryByText("There are no liturgical texts today."),
      ).toBeNull();
    });

    it("sets the heading as a serif section heading, like the other lists", async () => {
      await render(<PrayerScreen />);

      expect(
        screen.getByRole("header", { name: "Daily Variables" }),
      ).toHaveStyle({ fontFamily: fontFamily.serif, fontSize: 28 });
    });

    it("shows each service as a row card with a chevron, not inside one big card", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          services: [
            { title: "Daily Vespers", pdfUrl: "https://x/vespers.pdf" },
            { title: "Daily Matins", pdfUrl: "https://x/matins.pdf" },
          ],
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByRole("button", { name: "Daily Vespers" })).toHaveStyle(
        {
          backgroundColor: Colours.light.itemBackground,
          borderRadius: 8,
        },
      );
      expect(
        section("Daily Variables").getAllByTestId("prayer-row-chevron"),
      ).toHaveLength(2);
      expect(screen.getByText("Daily Variables").parent).not.toHaveStyle({
        backgroundColor: Colours.light.itemBackground,
      });
    });

    it("asks the user to silence their phone before opening a daily service", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          services: [{ title: "Daily Vespers", pdfUrl: "https://x/v.pdf" }],
        }),
      };
      await render(<PrayerScreen />);

      await fireEvent.press(screen.getByText("Daily Vespers"));

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Silence Your Phone!",
        "Before opening this prayer, please ensure your phone is on silent.",
        [expect.objectContaining({ text: "OK" })],
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("opens the daily service's PDF once the alert is confirmed", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          services: [{ title: "Daily Vespers", pdfUrl: "https://x/v.pdf" }],
        }),
      };
      await render(<PrayerScreen />);
      await fireEvent.press(screen.getByText("Daily Vespers"));

      await confirmAlert();

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/pdfViewer",
        params: {
          url: "https://x/v.pdf",
          title: "Daily Vespers",
        } satisfies PdfViewerParams,
      });
    });
  });

  describe("readings", () => {
    beforeEach(() => {
      mockFeature = { ...baseFeature, data: dataWith() };
    });

    it("shows the epistle and gospel cards with title-cased titles", async () => {
      await render(<PrayerScreen />);

      expect(screen.getByText("Hebrews 11:24-26")).toBeTruthy();
      expect(screen.getByText("Mark 2:1-12")).toBeTruthy();
      expect(screen.getByText("EBREWS 11:24-26 teaser")).toBeTruthy();
      expect(screen.getByText("ARK 2:1-12 teaser")).toBeTruthy();
    });

    it("decodes HTML entities in a teaser", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          day: {
            feastTitle: null,
            readings: [
              reading("epistle", "HEBREWS 11:24-26", {
                teaser: "Faith &amp; works &quot;together&quot;",
              }),
              gospel,
            ],
          },
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByText('aith & works "together"')).toBeTruthy();
    });

    it("shows no third reading card when the day has only two readings", async () => {
      await render(<PrayerScreen />);

      expect(screen.queryByText("Genesis 1:1-13")).toBeNull();
    });

    it("labels two readings the Epistle and the Holy Gospel in the commemorate red", async () => {
      await render(<PrayerScreen />);

      expect(screen.getByText("The Epistle")).toBeTruthy();
      expect(screen.getByText("The Holy Gospel")).toHaveStyle({
        fontFamily: fontFamily.smallCaps,
        fontStyle: "italic",
        color: Colours.light.commemorate,
      });
      expect(screen.queryByText("First Reading")).toBeNull();
    });

    it("labels three readings First, Second and Third", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          day: {
            feastTitle: null,
            readings: [epistle, gospel, thirdReading],
          },
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByText("First Reading")).toBeTruthy();
      expect(screen.getByText("Second Reading")).toBeTruthy();
      expect(screen.getByText("Third Reading")).toBeTruthy();
      expect(screen.queryByText("The Epistle")).toBeNull();
    });

    it("shows the third reading card when the day has one", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({
          day: {
            feastTitle: null,
            readings: [epistle, gospel, thirdReading],
          },
        }),
      };

      await render(<PrayerScreen />);

      expect(screen.getByText("Genesis 1:1-13")).toBeTruthy();
      expect(screen.getByText("ENESIS 1:1-13 teaser")).toBeTruthy();
    });

    it("shows only the readings the day has", async () => {
      mockFeature = {
        ...baseFeature,
        data: dataWith({ day: { feastTitle: null, readings: [gospel] } }),
      };

      await render(<PrayerScreen />);

      expect(screen.queryByText("Hebrews 11:24-26")).toBeNull();
      expect(screen.getByText("Mark 2:1-12")).toBeTruthy();
    });

    it("shows no reading cards when the day is unknown", async () => {
      mockFeature = { ...baseFeature, data: dataWith({ day: null }) };

      await render(<PrayerScreen />);

      expect(screen.queryByText("Hebrews 11:24-26")).toBeNull();
      expect(screen.queryByText("Mark 2:1-12")).toBeNull();
    });

    it.each<[DailyReadingsParams["type"], Reading]>([
      ["epistle", epistle],
      ["gospel", gospel],
      ["thirdReading", thirdReading],
    ])(
      "opens the %s in the daily readings screen when tapped",
      async (type, r) => {
        mockFeature = {
          ...baseFeature,
          data: dataWith({
            day: {
              feastTitle: null,
              readings: [epistle, gospel, thirdReading],
            },
          }),
        };
        await render(<PrayerScreen />);

        await fireEvent.press(screen.getByText(r.teaser.slice(1)));

        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/dailyReadings",
          params: {
            type,
            reading: r.fullText,
            title: r.title,
          } satisfies DailyReadingsParams,
        });
        expect(Alert.alert).not.toHaveBeenCalled();
      },
    );
  });

  describe("fixed lists", () => {
    const prayers = [
      [
        "Morning Prayers",
        "A short prayer to start the day",
        MORNING_PRAYERS_URL,
      ],
      [
        "Small Compline",
        "A prayer before sleep & Communion",
        SMALL_COMPLINE_URL,
      ],
      [
        "Holy Communion",
        "Preparation & Thanksgiving",
        PREPARATION_FOR_COMMUNION_URL,
      ],
      [
        "Censing the Home",
        "A prayer when you cense your home",
        CENSING_HOME_URL,
      ],
    ];
    const services = [
      ["Great Vespers", "An evening sacrifice", GREAT_VESPERS_URL],
      ["Small Compline", "When a Priest is serving", SMALL_COMPLINE_PRIEST_URL],
      ["Paraklesis", "To the Theotokos, the Mother of Light", PARAKLESIS_URL],
      ["Matins", "Morning Offering", MATINS_URL],
      ["Matins - Bilingual", "English and Arabic Matins", MATINS_BILINGUAL_URL],
    ];
    const lentenServices = [
      ["Great Compline", "A solemn Lenten evening prayer", GREAT_COMPLINE_URL],
      [
        "Presanctified Liturgy",
        "A Lenten Eucharistic service",
        PRESANCTIFIED_LITURGY_URL,
      ],
      ["Akathist", "A standing hymn of praise, to the Theotokos", AKATHIST_URL],
    ];

    describe.each([
      ["Prayers", prayers, false],
      ["Services", services, true],
      ["Lenten Services", lentenServices, true],
    ])("%s", (heading, rows, warnsToSilencePhone) => {
      it("lists each entry with its subtitle", async () => {
        await render(<PrayerScreen />);

        for (const [title, subtitle] of rows) {
          expect(section(heading).getByText(title)).toBeTruthy();
          expect(section(heading).getByText(subtitle)).toBeTruthy();
        }
      });

      it.each(rows)("opens %s in the PDF viewer", async (title, _s, url) => {
        await render(<PrayerScreen />);

        await fireEvent.press(section(heading).getByText(title));
        if (warnsToSilencePhone) await confirmAlert();

        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/pdfViewer",
          params: { url, title } satisfies PdfViewerParams,
        });
      });

      it(
        warnsToSilencePhone
          ? "asks the user to silence their phone before opening anything"
          : "opens straight away, with no alert",
        async () => {
          await render(<PrayerScreen />);

          await fireEvent.press(section(heading).getByText(rows[0][0]));

          if (warnsToSilencePhone) {
            expect(Alert.alert).toHaveBeenCalledWith(
              "Silence Your Phone!",
              "Before opening this prayer, please ensure your phone is on silent.",
              [expect.objectContaining({ text: "OK" })],
            );
            expect(mockPush).not.toHaveBeenCalled();
          } else {
            expect(Alert.alert).not.toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledTimes(1);
          }
        },
      );
    });
  });

  describe("date picker", () => {
    it("starts closed, showing the selected date", async () => {
      await render(<PrayerScreen />);

      expect(mockPickerProps.visible).toBe(false);
      expect(mockPickerProps.date).toBe(baseFeature.selectedDate);
    });

    it("is tinted with the app's primary colour", async () => {
      await render(<PrayerScreen />);

      expect(mockPickerProps.accentColour).toBe(Colours.light.primary);
    });

    it("opens when the calendar button is pressed", async () => {
      await render(<PrayerScreen />);

      await fireEvent.press(screen.getByLabelText("Choose date"));

      expect(mockPickerProps.visible).toBe(true);
    });

    it("closes without loading anything when cancelled", async () => {
      await render(<PrayerScreen />);
      await fireEvent.press(screen.getByLabelText("Choose date"));

      await act(() => mockPickerProps.onCancel());

      expect(mockPickerProps.visible).toBe(false);
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it("loads the chosen date and closes when confirmed", async () => {
      const chosen = new Date(2026, 3, 12, 12);
      await render(<PrayerScreen />);
      await fireEvent.press(screen.getByLabelText("Choose date"));

      await act(() => mockPickerProps.onConfirm(chosen));

      expect(mockLoad).toHaveBeenCalledTimes(1);
      expect(mockLoad).toHaveBeenCalledWith(chosen);
      expect(mockPickerProps.visible).toBe(false);
    });
  });

  describe("pull to refresh", () => {
    // The RefreshControl element is a prop of the scroll view that wraps
    // everything on the screen, so walk up from the quote to find it.
    const refreshControl = () => {
      let node = screen.getByText(/Pray without ceasing/).parent;
      while (node && !node.props.refreshControl) node = node.parent;
      if (!node) throw new Error("No scroll view with a refresh control");
      return node.props.refreshControl;
    };

    it.each([true, false])(
      "passes refreshing=%s to the refresh control",
      async (refreshing) => {
        mockFeature = { ...baseFeature, refreshing };

        await render(<PrayerScreen />);

        expect(refreshControl().props.refreshing).toBe(refreshing);
      },
    );

    it("refreshes when the user pulls down", async () => {
      await render(<PrayerScreen />);

      await act(async () => refreshControl().props.onRefresh());

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
