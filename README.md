# SPAOC App

St Paul's Antiochian Orthodox Church (_SPAOC_) app is a calendar app.

## Setup

Make sure to create a `.env` with the API keys (`cp .env.example .env`, then fill in the values).

API keys can be found from [here](https://console.cloud.google.com)

```
EXPO_PUBLIC_IOS_CAL_PROD_KEY=
EXPO_PUBLIC_IOS_CAL_DEV_KEY=

EXPO_PUBLIC_ANDROID_CAL_PROD_KEY=
EXPO_PUBLIC_ANDROID_CAL_DEV_KEY=

```

## Project structure

Source lives in `src/`: `app/` (Expo Router routes, thin), `features/` (`calendar`, `prayer`, `notifications`, `settings`, `parish`), and shared `components`, `hooks`, `lib`, `theme`, `config`. Features may only be imported through their `index.ts`, which ESLint enforces. See [CLAUDE.md](CLAUDE.md) for the layout, naming and testing conventions.

## Scripts

- `npm start` — Metro for the dev client; `npm run ios` / `npm run android` build the native app.
- `npm test` — tests once; `npm run test:watch` — watch mode; `npm run coverage` — what CI runs (80% line threshold).
- `npm run lint` and `npm run typecheck`.

## Fonts

Text is set in Alegreya (liturgical text and titles) and Alegreya Sans (the interface), © The Alegreya Project Authors, under the SIL Open Font License 1.1. They come from the `@expo-google-fonts` packages and are embedded by the `expo-font` plugin in `app.json`, so a font change needs a native rebuild (`npm run ios` / `npm run android`), not just a Metro reload.

## Docs

[`docs/`](docs/) holds the design notes. [Notification planner](docs/notification-planner.md) explains how notifications are planned, scheduled and reconciled. [CLAUDE.md](CLAUDE.md) covers the architecture.
