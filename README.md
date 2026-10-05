# Servizato Customer App

Mobile-first web app for customers of the Servizato service marketplace: find a service, compare providers, book a slot, track the technician with OTP, pay the invoice and leave a review.

> **Prototype:** providers, prices and technicians are sample data in `data.js`. Bookings are saved in the browser (localStorage). There is no backend yet.

## Run it locally

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open the link it prints (usually http://localhost:5173). For the phone view in a desktop browser, press F12 and turn on the device toolbar.

## Try the full flow

1. Home → tap **AC Repair** → add one or more services → **Choose provider**
2. Sort providers, then select one → pick a date and time → **Confirm booking**
3. On the tracking screen, tap **Simulate next update** to move the job forward (assigned → on the way → started → completed)
4. **View invoice and pay** → choose a payment method → pay
5. Rate the service → see it under **Bookings → Past**

**Account → Clear demo data** resets everything.

## Project structure

```
index.html   page shell (Vite entry)
main.jsx     mounts the React app
App.jsx      navigation, app state, booking actions
screens.jsx  all screens (Home, Services, Providers, Schedule, Tracking, Invoice, Review, Bookings, Account)
data.js      sample categories, services, providers, pricing and bill calculation
icons.jsx    inline SVG icons
styles.css   design tokens and styles
shared.js    link to the provider and technician apps
public/      app icons, manifest.webmanifest, sw.js (offline)
```

## Connected apps

- [Partner (provider) app](https://github.com/utku54321/servizato-provider) - bookings made here appear as incoming requests
- [Technician app](https://github.com/utku54321/servizato-technician) - the assigned technician's progress, parts and photos show up on the tracking and invoice screens

All three share `shared.js` and talk through browser storage on the same site, so use them on the same phone or browser.

## Live demo

Every push to `main` builds the app and publishes it to GitHub Pages (see `.github/workflows/deploy.yml`):
https://utku54321.github.io/servizato-customer/

One-time setup: **Settings → Pages → Source → GitHub Actions**.

## Install on a phone

The app is installable (web app manifest + offline service worker, files in `public/`).

- **Android (Chrome):** open the link → tap **Install** in the prompt, or **⋮ → Install app**. Also available under **Account → Install app**.
- **iPhone (Safari):** open the link → **Share → Add to Home Screen**.

It then opens full screen from its own icon and keeps working offline.

## Connecting a real backend later

Replace the sample data in `data.js` and the actions in `App.jsx` (`createBooking`, `advance`, `pay`, `review`) with API calls to the Servizato backend.
