# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Parishioners of St Paul's Antiochian Orthodox Church (Melbourne). They open the app on a phone to check what is on this week: parish events, fasting days, the saint of the day and daily readings. The congregation includes older parishioners (the parish runs a seniors calendar), so the app must work for people with a wide range of tech comfort and vision.

## Product Purpose

SPAOC is the parish's calendar app. Its main screen is the events list; a second area holds daily readings and service texts. It exists so parishioners can keep up with parish life, liturgical life and giving in one place, and be reminded of what they have chosen to follow.

## Positioning

- Parish-specific calendars: St Paul's own Google Calendars (youth, church, family, ladies, parish, seniors, weekly), always in Melbourne time, each with its own notification setting.
- Liturgical life alongside events: fasting days, saint of the day, daily readings and service texts (from Antiochian.org) sit next to the parish schedule.
- Donations and parish links: giving (bank and Square), website, store, Facebook and help in one place.

## Operating Context

- Content comes from the parish's Google Calendars and the Antiochian.org API; there is no backend of the parish's own.
- The parish is on `Australia/Melbourne` regardless of the device's time zone.
- Local state (favourites, settings) is stored on the device; notifications are scheduled locally.

## Capabilities and Constraints

- Platforms: iOS and Android from one Expo/React Native codebase, with the design language adapting to each OS (iOS uses NativeTabs and an iOS 26 icon).
- Calendar sources and their names are defined in `src/domain/calendarSources.ts` and must stay in sync with the Google calendar IDs.
- Features: events, favourites, fasting days, saints, daily readings, service PDFs, notifications (saint and favourite), settings, About, Help, donations.
- Light and dark mode follow the system setting.

## Brand Commitments

- The St Paul's logo and app icon art (`assets/images/spaoc-*`, `stpauls-wireframe-logo*`) are binding.
- Not confirmed as binding (open to change): the Orthodox iconography images in `assets/images/orthodox/` and the per-calendar colours.

## Evidence on Hand

- Real parish calendar data via Google Calendar; real readings via Antiochian.org.
- Parish links: https://stpaulchurch.com.au, https://stpaulchurch.org.au/store, Facebook (see `src/features/parish/screens/AboutScreen.tsx`).
- App Store screenshots in `docs/store/`.
- No user research, usage analytics or testimonials are on file; do not fabricate them.

## Product Principles

- Answer "what's on this week?" first; everything else supports that.
- Serve the least tech-comfortable parishioner without making the app feel dated for the youth.
- Respect the parish's liturgical rhythm: fasting, feasts and the saint of the day are part of the calendar, not extras.
- Reminders are opt-in and per calendar; never notify more than the user chose.
- Follow each platform's conventions rather than a custom shell.

## Accessibility & Inclusion

- Honour system text scaling (Dynamic Type / Android font scale) at the largest sizes.
- Light and dark mode must both be first-class.
- Design for older parishioners: legible type, strong contrast, simple navigation, and large touch targets.
- Otherwise follow iOS and Android platform accessibility standards.
