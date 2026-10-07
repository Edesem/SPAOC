---
name: SPAOC
description: St Paul's Antiochian Orthodox Church parish calendar app. A plain, sturdy week-at-a-glance in vestment navy and altar bronze.
colors:
  vestment-navy: "#0a4068"
  altar-bronze: "#a88646"
  parchment-grey: "#F7F6F7"
  card-white: "#FFFFFF"
  night-ground: "#121212"
  night-card: "#272727"
  ink: "#333333"
  ink-detail: "#555555"
  ink-date: "#5d5d5d"
  ink-quiet: "#666666"
  chevron-grey: "#8C8C8C"
  bone: "#E1E1E1"
  bone-detail: "#BBBBBB"
  bone-quiet: "#B0B0B0"
  bone-date: "#999999"
  chevron-night: "#777777"
  tab-inactive: "#6B6B6B"
  tab-inactive-night: "#888888"
  separator: "#D0D0D0"
  separator-night: "#4A4A4A"
  ink-on-bronze: "#121212"
  error: "#B3261E"
  error-night: "#F2766B"
  donate-red: "#de333f"
  donate-red-night: "#b51a25"
  favourite-gold: "#B07D00"
  favourite-gold-night: "#FFD700"
  cal-youth: "#5C6BC0"
  cal-church: "#B8860B"
  cal-family: "#0E8D4D"
  cal-ladies: "#9E69AF"
  cal-parish: "#F4511E"
  cal-seniors: "#7986CB"
  cal-weekly: "#039BE5"
  cal-playgroup: "#9575CD"
  cal-fellowship: "#489160"
  cal-default: "#000000"
typography:
  display-title:
    fontFamily: "Alegreya"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "normal"
  reading-title:
    fontFamily: "Alegreya"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "normal"
  liturgical-title:
    fontFamily: "Alegreya"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "normal"
  reading:
    fontFamily: "Alegreya"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "26px"
  reading-teaser:
    fontFamily: "Alegreya"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  quote:
    fontFamily: "Alegreya"
    fontSize: "16px"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: "normal"
  headline:
    fontFamily: "Alegreya Sans"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "normal"
  section-title:
    fontFamily: "Alegreya Sans"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "normal"
  title:
    fontFamily: "Alegreya Sans"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "normal"
  body:
    fontFamily: "Alegreya Sans"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-strong:
    fontFamily: "Alegreya Sans"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "normal"
  button:
    fontFamily: "Alegreya Sans"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: "normal"
  label:
    fontFamily: "Alegreya Sans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "normal"
  aside:
    fontFamily: "Alegreya Sans"
    fontSize: "16px"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: "normal"
rounded:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  pill: "20px"
spacing:
  xs: "4px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "30px"
components:
  event-row:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "20px"
  event-row-night:
    backgroundColor: "{colors.night-card}"
    textColor: "{colors.bone}"
  reading-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.altar-bronze}"
    textColor: "{colors.ink-on-bronze}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "15px 0"
  button-donate:
    backgroundColor: "{colors.donate-red}"
    textColor: "{colors.card-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "15px 0"
  button-donate-night:
    backgroundColor: "{colors.donate-red-night}"
  link-row:
    backgroundColor: "transparent"
    textColor: "{colors.vestment-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

# Design System: SPAOC

## Overview

**Creative North Star: "The Parish Noticeboard"**

SPAOC reads like the noticeboard in the church hall: what is on this week, laid out so anyone can find it in a glance. Content sits on plain white cards over a soft grey ground, each event tagged by a coloured diamond that carries its calendar's identity. Navy and bronze do the chrome work; everything else is neutral, so the calendar colours are the loudest thing on screen.

The system is plain and sturdy. Type is Alegreya, the face the archdiocese sets its liturgical texts in: the serif carries the parish's liturgical voice and Alegreya Sans carries the noticeboard, sized generously for older eyes; cards are rounded and lightly lifted; targets are large; navigation is the OS's native tab bar. There is little ornament. The one decorative motif is the eight-pointed star illustration, tinted in the primary colour, which closes the About screen and marks the parish's own voice. Per-calendar Orthodox icon images appear on event detail screens.

Light and dark are both first-class. Dark mode swaps navy for bronze as the lead accent, since navy loses contrast on near-black.

**Key Characteristics:**
- White cards on a soft grey ground in light mode; `#272727` cards on `#121212` in dark.
- Calendar colour is expressed as a diamond marker, never as a card fill.
- One lead accent per scheme (navy light, bronze dark); bronze is the secondary in light.
- Alegreya (serif) for liturgical text and Alegreya Sans for the interface, with 16px as the floor for reading text.
- Native tab bar and platform haptics; no custom shell.

## Colors

A reverent navy and bronze pair on neutral greys, with ten calendar colours that come from the parish's Google Calendars.

### Primary
- **Vestment Navy** (#0a4068): Lead accent in light mode: tab tint, link rows and icons, the About star, toast accent border, and the "Clear month filter" pill. Rare in dark mode, where bronze takes over.
- **Altar Bronze** (#a88646): Lead accent in dark mode (tab tint, links, filled buttons). Secondary in light mode: the Home screen's vertical rail. Text and icons on a bronze fill are Ink on Bronze (#121212, 5.5:1); white on bronze is 3.4:1 and is not used.

### Secondary
- **Donate Red** (#de333f, #b51a25 at night): Used only for the Donate via Square button. It is the only red in the chrome, which is why it stands out.
- **Favourite Gold** (#B07D00 on light, #FFD700 at night): The filled favourite star. Light mode uses a deeper gold because #FFD700 is 1.4:1 on white.
- **Error** (#B3261E light, #F2766B night): Error text and the error toast border.

### Neutral
- **Parchment Grey** (#F7F6F7): Screen background in light mode.
- **Card White** (#FFFFFF): Cards, rows, sheets and toast background in light mode.
- **Night Ground** (#121212): Screen background in dark mode, matching the dark splash.
- **Night Card** (#272727): Cards and rows in dark mode.
- **Ink** (#333333): Primary text on light. **Ink Detail** (#555555), **Ink Date** (#5d5d5d) and **Ink Quiet** (#666666, 5.3:1 on the background) step down for secondary copy, section dates and times.
- **Bone** (#E1E1E1): Primary text on dark. **Bone Detail** (#BBBBBB), **Bone Quiet** (#B0B0B0) and **Bone Date** (#999999) step down.
- **Chevron Grey** (#8C8C8C light, #777777 dark): Chevrons and the empty favourite star, 3:1 or better on cards. **Tab Inactive** (#6B6B6B light, #888888 dark): unselected tabs. **Separator** (#D0D0D0 light, #4A4A4A dark): dividers inside cards.

### Calendar colours
Each calendar has a fixed colour used for its event marker and its Settings entry. They start from the Google Calendar palette, darkened where needed so each keeps 3:1 against both card surfaces (white and #272727), and stay identical in light and dark.
- **youth** (#5C6BC0), **church** (#B8860B), **family** (#0E8D4D), **ladies** (#9E69AF), **parish** (#F4511E), **seniors** (#7986CB), **weekly** (#039BE5), **playgroup** (#9575CD), **fellowship** (#489160). Events from other sources (fasting, saints) fall back to black (#000000).

### Named Rules
**The Calendar Colour Rule.** A calendar's colour identifies its events and nothing else. It appears as the `CalendarMarker` diamond on a row and in the Settings legend, always beside the calendar's name, never as a button, a text colour or a card fill.

**The One Lead Accent Rule.** Each scheme has one lead accent for interactive chrome: navy in light, bronze in dark. Do not use both as competing actions on the same screen.

**The One Red Rule.** Donate Red is reserved for giving. Errors and destructive actions do not borrow it.

## Typography

**Liturgical font:** Alegreya (serif). **Interface font:** Alegreya Sans. Both are embedded at build time by the `expo-font` plugin in `app.json` from the `@expo-google-fonts` packages, so there is no runtime font load and the splash screen waits only for settings. Every style comes from `src/theme/typography.ts`; screens spread a token and add only margins, alignment and colour. Native chrome (tab labels, switches, pickers, alerts, notifications, PDFs) stays in the platform font.

**Character:** The serif is what the archdiocese uses for liturgical texts, so the parish's own words sit in it: the saint of the day, the fasting rule, the prayer day heading, reading titles and text, and scripture quotes. The sans carries the noticeboard: events, times, buttons, settings and links. Weight and size build hierarchy within each voice.

### Hierarchy
Serif (Alegreya), the liturgical voice:
- **Display Title** (700, 24px): Screen titles, the saint of the day heading, the fasting rule heading and the day heading on the prayer screen.
- **Reading Title** (700, 24px): Card titles on the prayer screen (readings, Daily Variables, Prayers, Services).
- **Liturgical Title** (400, 18px): The saint's name and the minor fast line.
- **Reading** (400, 18px, 26px line height): The full text on the Daily Readings screen.
- **Reading Teaser** (400, 16px, 24px line height): The teaser on a reading card.
- **Quote** (400 italic, 16px): Scripture quotes (the Donate verse).

Sans (Alegreya Sans), the noticeboard voice:
- **Headline** (700, 24px): Week labels and the event details title.
- **Section Title** (700, 24px): Card titles such as "Support Us Online".
- **Title** (400, 18px): Event titles, day section headers, setting labels and primary list copy.
- **Body** (400, 16px, 24px line height): Descriptions, detail text and toasts.
- **Body Strong** (500, 16px): Event dates and link labels.
- **Button** (700, 16px): Button and pill labels.
- **Label** (400, 14px): Event times and secondary metadata only.
- **Aside** (400 italic, 16px): The subtitle under a screen title and short notes.

### Named Rules
**The Two Voices Rule.** The serif is for the parish's liturgical words and the screen titles that introduce them; the sans is for everything a parishioner does with the app (find an event, change a setting, give). Do not set a button or an event row in the serif, or a reading in the sans.

**The Weights Rule.** Alegreya Sans has no 600, so only 400, 500 and 700 are bundled (serif: 400, 400 italic, 700). Semibold text is 500 or 700. `typography.test.ts` fails if a token asks for a face that is not bundled, and ESLint fails on an inline `fontFamily`, `fontWeight` or `fontStyle` outside `src/theme/`, because an unbundled weight would be synthesised on Android.

**The Lining Figures Rule.** Every sans token sets `fontVariant: ["lining-nums"]` so times and dates never fall back to old-style figures.

**The 16px Floor Rule.** Content a parishioner has to read is 16px or larger. 14px is for a time or a caption beside a larger title. Alegreya reads smaller than the system fonts at the same size, so sizes are tuned on a device in `typography.ts` rather than per screen.

**The Italic Aside Rule.** Italics are reserved for the subtitle under a screen title and for scripture quotes (the Donate verse); they are never used for emphasis in lists.

## Layout

A single-column, full-width list on a phone, inside safe-area insets. Screens use 20px horizontal padding (About, Settings) or 16px margins on event rows. Vertical rhythm is loose: 2px between event rows (so a day reads as one group), 16px between link buttons, 30px between major About sections, 20px around cards.

The Home screen carries a 7px bronze vertical rail down the left edge; the week label, saint of the day, fasting rule and day-grouped events follow. Section headers are 18px and sit at 15px left inset.

Navigation is a native bottom tab bar with five tabs (Events, Favourites, Prayer, About, Help). Settings opens from a menu icon at the top of Home as a full-screen route with no stack header. Detail routes (event details, readings, PDF) use the stack header.

Spacing scale in use: 4, 10, 16, 20, 30. Small touch targets are padded to at least 44pt using `hitSlop` (the favourite star pads 4 + hit slop 10).

## Elevation & Depth

Hybrid: tonal layering carries most separation (white card on grey ground; `#272727` on `#121212`), with a soft ambient shadow lifting cards slightly. Shadows are never coloured and never reach structural weight.

### Shadow Vocabulary
- **Row lift** (`shadow-color #000, offset 0×2, opacity 0.2, radius 4`; Android elevation 2): Event rows.
- **Card lift** (`#000, offset 0×3, opacity 0.1, radius 4`; elevation 5): Reading cards, Donate sections, prayer content sections.
- **Button lift** (`#000, offset 0×2, opacity 0.1, radius 3`; elevation 3): The primary button in common styles.

### Named Rules
**The Soft Lift Rule.** Shadow opacity stays at or below 0.2 and radius at or below 4. A card is lifted, never floating.

## Shapes

Gently rounded and consistent. Cards and buttons use 8–10px corners; link rows 12px; the "Clear month filter" pill 20px. The calendar marker is a signature shape: a tall, narrow diamond in the calendar's colour (22px point to point, 0.6 as wide), drawn by the shared `CalendarMarker` component so event rows and the Settings legend always match. Dividers are 1px (`#E0E0E0`), or 3px in a calendar colour when a reading card carries an accent.

Images are line illustrations (the star, the Orthodox icons), tinted in the lead accent colour on the About and event detail screens and set with `resizeMode: contain`, never cropped.

## Components

### Event Row
Plain and sturdy: a white (or `#272727`) card, 8px corners, 20px padding, 2px vertical margin, 16px horizontal margin. A left calendar marker (the diamond), then date (when shown, 16px/500), the calendar's name and time on one line (14px, quiet, e.g. "Church · 8:00 PM to 10:00 PM"), and title (18px). A 24px favourite star (outline in chevron grey, filled in Favourite Gold) and a chevron sit at the right. Tapping the row gives a rigid haptic and opens details; tapping the star gives a medium haptic.

### Reading Card
White card, 10px corners, 20px padding, card lift. 24px/600 title with a chevron at the right, then a 1px divider (3px in an accent colour when one is supplied), then a 16px teaser in the primary text colour.

### Buttons
- **Primary** (Altar Bronze fill, Ink on Bronze 16px/600 text, 10px corners, 15px vertical padding, 80% width, centred, button lift).
- **Donate** (Donate Red fill, white 16px/600 text, 10px corners, 15px vertical padding, full card width), one per screen.
- **Link row** (no fill, navy or bronze text and icon, 16px/500 label, 24px icon, 12px gap, 12px corners, 10×16px padding) for the About screen's outbound links.
- Haptics: every press fires one (medium for actions, rigid for navigation into a detail).

### Navigation
Native bottom tabs (`NativeTabs`): SF Symbols on iOS and Material icons on Android, with filled variants when selected. Selected tint is the lead accent; unselected is Tab Inactive (#6B6B6B light, #888888 dark). Labels are the platform default size and font; the tab bar is native and is not set in Alegreya. Stack header titles are set in the serif.

### Toast
Light: white background, left accent border in Vestment Navy, 15px text in Ink. Dark: `#272727` background, bronze border, Bone text. Errors use a red left border. Used for transient confirmations such as "Account Number copied" (1.5s).

### Settings
A title in the lead accent colour, then `SettingPicker` rows (18px labels) and a native `Switch` for the saint-of-the-day notification. Below them, `CalendarLegend` lists every calendar in registry order, each with the `CalendarMarker` diamond and its name. Theme follows the system setting; there is no in-app theme choice.

## Do's and Don'ts

### Do:
- **Do** check text and icon pairs for contrast (4.5:1 text, 3:1 icons and controls) in both schemes whenever a token changes.
- **Do** take type from the tokens in `theme/typography.ts`; every `<Text>` needs one, because React Native has no global default font.
- **Do** take colours from `theme/colours.ts` (`Colours.light` / `Colours.dark`) and calendar colours from `getCalendarColour`; both schemes get the same screen design.
- **Do** keep reading text at 16px or larger and let it scale with the system text size.
- **Do** give every tappable control at least a 44pt target (padding or `hitSlop`).
- **Do** use the `CalendarMarker` diamond, and nothing else, to mark which calendar an event belongs to.
- **Do** use native controls (tab bar, switches, pickers, haptics) and platform icons.
- **Do** keep the logo and app icon art as supplied (binding per PRODUCT.md).

### Don't:
- **Don't** use a calendar colour as button fill, text or card background.
- **Don't** use Donate Red for anything other than giving.
- **Don't** add a second lead accent to a screen, or hard-code hex values in a screen when a theme token exists.
- **Don't** add typefaces beyond Alegreya and Alegreya Sans, set an inline `fontFamily`, `fontWeight` or `fontStyle`, or use heavy ornament; the star and Orthodox icon illustrations are the only decoration.
- **Don't** raise shadow opacity above 0.2 or radius above 4.
- **Don't** build dark mode as an invert; it has its own surfaces (`#121212`, `#272727`) and swaps the lead accent to bronze.
