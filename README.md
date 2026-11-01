# SPAOC App

St Paul's Antiochian Orthodox Church (_SPAOC_) app, for iOS and Android. It is built with React Native, Expo and TypeScript.

## Features

- **Events** — the parish calendar from Google Calendar, filterable by month, with fasting days and the saints of the day.
- **Favourites** — star events to keep them in one place.
- **Prayer** — daily readings and service texts from Antiochian.org, with PDFs opened in the app.
- **Parish** — ways to give, links to the parish's other sites, and Help.
- **Notifications** — optional reminders for saints and favourite events.
- **Settings** — start of the week, per-calendar and notification options.

## Setup

You need Node 24 and npm. The app uses native modules, so it runs in a development build, not Expo Go.

1. `npm install`
2. Create a `.env` with the Google Calendar API keys: `cp .env.example .env`, then fill in the values. Keys come from the [Google Cloud console](https://console.cloud.google.com).

   ```
   EXPO_PUBLIC_IOS_CAL_PROD_KEY=
   EXPO_PUBLIC_IOS_CAL_DEV_KEY=

   EXPO_PUBLIC_ANDROID_CAL_PROD_KEY=
   EXPO_PUBLIC_ANDROID_CAL_DEV_KEY=
   ```

   The app throws at start-up if the key for the current platform and build is missing. Tests don't need a `.env`.

3. `npm run ios` or `npm run android` to build and run the native app, then `npm start` for Metro on later runs.

## Scripts

- `npm start` — Metro for the dev client; `npm run ios` / `npm run android` build the native app.
- `npm test` — tests once; `npm run test:watch` — watch mode; `npm run coverage` — what CI runs (80% line threshold).
- `npm run lint` and `npm run typecheck`.
- `npm run build-ios` / `npm run build-android` — local production builds with EAS.

## Project structure

Source lives in `src/`: `app/` (Expo Router routes, thin), `features/` (`calendar`, `prayer`, `notifications`, `settings`, `parish`), and shared `components`, `hooks`, `services`, `domain`, `lib`, `theme`, `config`. Features may only be imported through their `index.ts`, which ESLint enforces. See [CLAUDE.md](CLAUDE.md) for the layout, architecture, naming and testing conventions.

## Architecture

Data flows one way: **screen → feature hook → data hook → service → provider**. Dependencies point one way too: `app` → `features` → shared code, and ESLint fails the build if that is broken.

- **Routes** (`src/app/`) are thin. Each file re-exports a screen from `features/<name>/screens`. Each tab is its own one-screen stack so the native tab bar and headers work.
- **Features** (`src/features/<name>/`) own their screens, components, hooks, services and domain logic, and expose a public API through `index.ts`. Features talk to each other only through that index.
- **Remote data sits behind interfaces.** `CalendarDataService` (Google Calendar) and `LiturgicalDataService` (Antiochian.org) each have one implementation, exported as a singleton. Screens and hooks depend on the interface, so a provider can be swapped in one place.
- **Local persistence goes through repositories.** A repository is the only code that touches AsyncStorage. It pairs with a Zustand store that holds in-memory state and loads saved values at start-up. Favourites and settings work this way.
- **Time is parish time.** The parish is on `Australia/Melbourne` whatever the device zone, so "what day is it" logic uses `now()` and `lib/parishTime.ts`, never `new Date()`.
- **Notifications** have three parts: a pure planner that decides what should be scheduled, a gateway over `expo-notifications`, and a sync step that reconciles the two. See [the notification planner doc](docs/notification-planner.md).
- **Theming and type** come from tokens in `src/theme/`. On iOS 26+ the headers use the system's Liquid Glass; Android and older iOS keep a solid header.

```
src/
├── app/          routes only
├── features/     calendar · prayer · notifications · settings · parish
├── components/   shared UI
├── hooks/        shared hooks
├── services/     settings repository + store
├── domain/       calendar sources
├── lib/          parish time, haptics
├── theme/        colours, typography, header options
└── config/       environment keys
```

## Fonts

Text is set in Alegreya (liturgical text and titles), Alegreya Sans (the interface) and Alegreya SC (small capitals), © The Alegreya Project Authors, under the SIL Open Font License 1.1. They come from the `@expo-google-fonts` packages and are embedded by the `expo-font` plugin in `app.json`, so a font change needs a native rebuild (`npm run ios` / `npm run android`), not just a Metro reload.

## Docs

[`docs/`](docs/) holds the design notes. [Notification planner](docs/notification-planner.md) explains how notifications are planned, scheduled and reconciled. [CLAUDE.md](CLAUDE.md) covers the architecture.

## Licence

[MIT](LICENSE).
