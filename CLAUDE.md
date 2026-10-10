# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This React Native application is called SPAOC. It is primarily a calendar application for a specific local Antiochian Orthodox Church. The first and main page (index.tsx) is the events screen. There is also a prayer screen that uses an api to retrieve daily readings and services.

## Tech Stack

- React Native
- TypeScript
- Expo
- State management: Zustand
- Styling: StyleSheet
- Testing: Jest + React Native Testing Library
- Package manager: npm

## Commands

- `npm start` — Metro with the dev client (`expo start --dev-client`); there is no Expo Go support. `npm run ios` / `npm run android` build and run the native app (`ios/` and `android/` are git-ignored).
- `npm run lint` — `expo lint .` (ESLint 9 flat config, whole repo).
- `npm run typecheck` — `tsc --noEmit` (strict mode).
- `npm test` — Jest, one run, exits on its own (safe without a TTY). `npm run test:watch` is the old watch mode (`--watchAll`). `jest.global-setup.js` runs every test with the device zone set to `America/Los_Angeles`, so code that leaks the device zone fails instead of passing on a Melbourne machine. `testTimeout` is 15s in the `jest` block of `package.json` because the first render in a screen test is slow on a cold CI runner.
- Single test file: `npm test -- src/services/calendar/googleCalendarMapper.test.ts`; single test by name: add `-t "name"`.
- `npm run coverage` — what CI runs; fails below 80% global line coverage. CI (`.github/workflows/ci.yml`) runs coverage, then lint, then typecheck, on Node 24.

Local setup needs a git-ignored `.env` (copy `.env.example`) with `EXPO_PUBLIC_{IOS,ANDROID}_CAL_{PROD,DEV}_KEY` (Google Calendar API keys). `config/env.ts` is the only code that reads `EXPO_PUBLIC_*`; `services/calendar/index.ts` calls it at import time, so the app **throws at start-up** if the key for the current platform/build is missing. Jest never loads `.env`, so `jest.setup.ts` injects fixture keys and mocks AsyncStorage.

## Project Structure

All source lives in `src/`. Assets, docs, config files and `jest.setup.ts` stay at the repo root. The dependency direction is **`app` → `features` → shared**, and ESLint enforces it (see below).

- `app/` — routes only. Every `_layout.tsx` and `+not-found.tsx` are real; every other file is a one-line `export { default } from "@/features/<f>/screens/<X>Screen"`. Each tab is a folder holding its own one-screen stack (`(tabs)/(events)/`, `favourites/`, `prayer/`, `parish/`, each with a `_layout.tsx` that renders `TabStack` and an `index.tsx`), because native tabs draw no header. Expo Router finds `src/app` on its own. Every file under `app/` becomes a route (a test enforces nothing is parked there; delete unused screens, git history keeps them).
- `features/<name>/` — one folder per feature, with only the subfolders it needs (`screens`, `components`, `hooks`, `services`, `domain`, `constants.ts`) and an `index.ts` that is its public API:
  - `calendar` — events, favourites, fasting, saints. Google Calendar service, favourites repository/store, Home/Favourites/EventDetails screens, `EventData` type.
  - `prayer` — daily readings and service texts. Antiochian.org client and service, `usePrayerFeature`, PDF viewer and Daily Readings screens.
  - `notifications` — no UI. The pure planner, the `expo-notifications` gateway, the saint/favourite/calendar modules, and the app-level handler/listeners.
  - `settings` — Settings screen and `SettingSegmented`. The settings repository and store are shared (see below).
  - `parish` — the Parish tab (giving, `PARISH_LINKS` for the parish's other sites, and rows into Help and Settings) and the pushed Help screen. `DonateSection`, `LinkRow`, bank/Square constants.
- Shared code (never imports a feature): `components` (`ThemedText`, `ThemedView`, `ui/` including `TabStack` and `useToolbarIcon`), `hooks` (theme and `useForegroundRefresh`), `services/settings` (repository + store, read by theme, calendar and notifications), `domain/calendarSources.ts` (read by the shared settings repository), `lib` (`parishTime`, `haptics`), `theme` (`colours.ts` and `typography.ts`, the type tokens; `headerOptions.ts`, the header options), `config`, `constants`, `types/routes.ts`. `testing/` holds Jest helpers (the `Stack` test double) and is deliberately outside `collectCoverageFrom`.
- `assets/` (repo root) — images. The fonts are not here: Alegreya, Alegreya Sans and Alegreya SC come from the `@expo-google-fonts` packages.

Import rules: inside a feature use relative imports; across features go through the other feature's index (`@/features/calendar`); route files and shared code use `@/`. `import/no-restricted-paths` in `eslint.config.js` fails the build on shared → feature, feature → `app`, and deep cross-feature imports. A lint rule also keeps `notificationPlanner.ts` free of React/Expo/AsyncStorage/`now()`/`new Date()`.

Aliases: `@/` is `src/` and `@assets/` is the root `assets/` folder (e.g. `require("@assets/images/orthodox/church.png")`). Both come from `tsconfig.json` `paths`; Expo's Metro and jest-expo read them, so there is no `babel.config.js` or `metro.config.js`.

### Naming

- Files that mainly export a component, class or interface are PascalCase (`EventItem.tsx`, `GoogleCalendarService.ts`, `CalendarDataService.ts`); everything else is camelCase (`parishTime.ts`, `homeRules.ts`, `useEvents.ts`, `colours.ts`).
- Use `.tsx` only when the file contains JSX; otherwise `.ts`.
- Australian spelling in identifiers and paths (`colours`, `favourites`). `theme/themedColors.ts` is a separate template palette that only backs `ThemedText`/`ThemedView`; `theme/colours.ts` is the app palette.
- Tests sit beside the code as `name.test.ts[x]`. Tests for route files cannot (everything under `app/` becomes a route), so they live in `src/__tests__/`.

## Architecture

Data flows one way: **screen → feature hook → data hook → service → provider**.

- **Remote data sits behind interfaces.** `features/calendar/services` (`CalendarDataService`, Google Calendar implementation) and `features/prayer/services` (`LiturgicalDataService`, Antiochian.org implementation) each export a module-level singleton from their `index.ts` (`calendarService`, `liturgicalService`). Screens and hooks depend on the interface; provider details and mappers (`googleCalendarMapper`, `antiochianMapper`) stay inside the service folder. Swap providers in `index.ts`.
- **Local persistence goes through repositories.** `features/calendar/favourites` and `services/settings` pair a repository (the only code that touches AsyncStorage, with private keys) with a Zustand store (in-memory state, `hydrate()` loads persisted values). `app/_layout.tsx` hydrates both at startup and holds the splash screen until settings are ready.
- **Feature hooks orchestrate screens.** `useHomeFeature` / `usePrayerFeature` combine the data hooks (`useEvents`, `useDailySaint`, `useFastDay`) plus refresh/selection state, so screens only render. Pure helpers for them live in `features/calendar/domain` (`homeRules`, `dateUtils`).
- **Event calendars are defined in two places that must stay in sync by name:** `domain/calendarSources.ts` (name, colour, image — also drives the Settings screen order) and `features/calendar/services/googleCalendarConfig.ts` (Google calendar IDs). `googleCalendarConfig.test.ts` fails if they drift. The `source` name on each event keys colours and per-calendar notification settings.
- **Time:** the parish is on `Australia/Melbourne` regardless of device time zone. Use `now()` and the helpers in `lib/parishTime.ts` instead of `new Date()` for "what day is it" logic; tests pin the clock with `setNow`/`resetNow` rather than fake timers. A few legacy `new Date()` call sites remain — don't copy them.
- **Notifications** are split into three parts (see `docs/notification-planner.md`): a pure planner (`features/notifications/notificationPlanner.ts`), a gateway over `expo-notifications` (`notificationGateway.ts`), and a reconcile step (`syncNotifications.ts`). Expo's own scheduled list is the only record of what is scheduled. `syncNotifications` reconciles saint notifications only (it runs from the root layout once settings hydrate, and after the Settings saint toggle); favourite notifications still call the gateway directly, and the calendar kind is unwired (#130). The root layout also installs the handler/listeners (`appNotifications.ts`).
- **Typography:** Alegreya (serif, the liturgical voice), Alegreya Sans (the interface) and Alegreya SC (small capitals, for the Home "Today we Commemorate" heading) are embedded at build time by the `expo-font` plugin in `app.json`, not loaded at runtime, so adding or changing a font needs a native rebuild (`npm run ios` / `npm run android`). Every style comes from a token in `theme/typography.ts`: spread it into a style and add only margins, alignment and colour. React Native has no global default font, so a `<Text>` without a token renders in the system font. ESLint fails on an inline `fontFamily`, `fontWeight` or `fontStyle` outside `src/theme/` (Alegreya Sans has no 600, so an unbundled weight is synthesised on Android), and `theme/typography.test.ts` keeps the tokens, the bundled faces and `app.json` in sync. Tab labels, switches, menus, pickers and alerts stay native.
- **Headers and Liquid Glass:** the headers use only what Expo Router and iOS provide, with no blur library. `theme/headerOptions.ts` builds the options: on iOS 26+ (`supportsLiquidGlass()`) the header is transparent with no background colour or blur, so the system draws Liquid Glass and fades content under it; Android and older iOS keep the solid themed header. Pushed screens (`eventDetails`, `dailyReadings`, `settings`, `help`) use `glassHeaderOptions` in the root layout (the navigator merges a screen's options over the root's solid `screenOptions` key by key, which is why `glassHeaderOptions` sets `headerStyle: undefined`, and `scrollEdgeEffects.top` is `soft` so iOS 27 does not draw a hard line); tab stacks use `TabStack`, with a native large title (Alegreya, via `headerLargeTitleStyle` in `theme/typography.ts`) on every tab except Events. **A screen's scroll view must be the first view it renders** with `contentInsetAdjustmentBehavior="automatic"` (no `SafeAreaView` wrapper around it), or the fade and the large-title collapse do not work; because the list starts at a negative offset on iOS 26, scroll to the offset learnt from the first scroll event rather than `y: 0`. Header buttons are `Stack.Toolbar` items (hamburger and calendar on Events, calendar on Prayer, Copy at the bottom of Daily Readings); `useToolbarIcon` gives iOS an SF Symbol and Android a rendered Material glyph, since Android's toolbar only takes images. Events' calendar is always a `Stack.Toolbar.Menu`: All Months, then up to twelve months that have events (`getMonthOptions`), with a tick (`isOn`) on the active choice, and the header shows the month while a filter is on. **Pickers are system controls from `@expo/ui`**, tinted with `theme.primary` and otherwise left in the system look: Settings' Start of the Week is a segmented control, and Prayer's date is `DatePickerSheet` (a SwiftUI sheet with the graphical calendar and Cancel/Done on iOS, the Material dialog on Android; the date applies only on Done/OK). Screen tests use `createStackMock` from `@/testing/expoRouterStack` to press header buttons by accessibility label. Glass cannot be seen in Jest: check it on an iOS 26+ simulator.
- **PDFs and orientation:** service and prayer PDFs open in `features/prayer/screens/PdfViewerScreen.tsx` with `react-native-pdf` (PDFKit on iOS, Pdfium on Android; it needs `react-native-blob-util` and the two `@config-plugins` entries in `app.json`, so a native rebuild). The file is cached on the device for a week and TLS is checked (`trustAllCerts={false}`; the library defaults to skipping it). The app is portrait everywhere except that screen, and three things must agree: `app.json` `orientation` is `default` (native layer allows rotation), the root `Stack` in `app/_layout.tsx` sets `orientation: 'portrait'` for every screen, and the `pdfViewer` screen sets `orientation: 'default'`. `TabStack` pins its own screens to portrait as well: on iOS the native tab bar asks the selected tab's inner stack, and a screen with no orientation inherits what `Info.plist` allows (landscape included), so the root stack's lock never reaches the tabs. `__tests__/rootLayout.test.tsx` and `TabStack.test.tsx` pin these. **`expo-screen-orientation` must stay installed even though no code imports it:** in a dev-client build the dev launcher wraps the root view controller, which hides every screen's orientation from iOS so the whole app rotates; the package supplies the root view controller that looks through the wrapper (it is autolinked, no config plugin or JS call needed). After changing `app.json` orientation, run `npx expo prebuild --clean` since `ios/` and `android/` are generated. The PDF screen keeps the solid header: the glass header needs a React Native scroll view as the first view, which a native PDF view is not. iPad already rotates on every screen (its `Info.plist` lists all four orientations and multitasking is on).
- Prefer a Zustand store for new shared cross-screen state.

## Testing

Tests are colocated (`*.test.ts[x]` beside the source), apart from tests of route files in `src/__tests__/`. Service tests mock at the lowest layer (e.g. `AntiochianLiturgicalService.network.test.ts` mocks only axios so the real client runs). Coverage is collected from `src/{app,components,config,domain,features,hooks,lib,services}` (see `collectCoverageFrom` in `package.json`), excluding `constants.ts` files, which are pure data. A new top-level folder under `src/` needs adding to that list or its code is not measured.

## Docs

`docs/` holds `notification-planner.md` (the notification design and what each issue changed) and `store/` (App Store screenshots). The earlier architecture snapshot, refactoring plans and issue drafts were deleted; this file is the architecture summary, and git history keeps the old documents. Add new docs with links relative to the file; `src/__tests__/docLinks.test.ts` fails if a link or a named `.md` file does not exist.
