# Kahani: architecture

Kahani is a web app that writes illustrated, branching stories and plays them back as a motion
comic. It's built for #BuildHybridAI 2026: story text is written by **Gemini Nano on the
device** when Chrome has it, and falls back to **Gemini in the cloud** when it doesn't. Images
are always made in the cloud.

## The one idea judges should remember

**Each task runs where it makes the most sense, and the app shows you where it ran.**

| Task | Where | Mode | Why |
|---|---|---|---|
| Write the next scene, offer 2 choices | Device first | `PREFER_ON_DEVICE` | Instant, free, private, works offline. Short text suits a small model. |
| Rewrite a scene ("make it funnier", "simpler words for age 6") | Device only | `ONLY_ON_DEVICE` | Pure privacy feature: your edits never leave the laptop. If there's no local model, the button explains why it's off. |
| Story recap / title / cover caption | Device first | `PREFER_ON_DEVICE` | Small summarizing job. |
| Long "chapter mode" (whole story in one go) | Cloud first | `PREFER_IN_CLOUD` | Long output is where the bigger cloud model is clearly better. |
| Panel illustration | Cloud only | `ONLY_IN_CLOUD` (image model) | Gemini Nano can't make images. |
| Narration | Browser | Web Speech API | Built into Chrome, free, offline. No AI service needed. |
| Motion comic video | Browser | Canvas + MediaRecorder | Pan/zoom over panels, captions, narration, exported as `.webm`. No video model. |

Every scene card shows a small badge: **⚡ On device** or **☁ Cloud**, read from
`result.response.inferenceSource`. That badge is the hybrid story made visible in the demo.

## Diagram

```
                Chrome (the user's laptop)
 ┌───────────────────────────────────────────────────────────┐
 │  Kahani web app (Vite, plain JS)                          │
 │                                                           │
 │  story.js ──► Firebase AI Logic SDK ──► Gemini Nano       │  ⚡ on device
 │     │              (hybrid model)    └─► (fallback) ──────┼──┐
 │     │                                                     │  │
 │  art.js ─────► Firebase AI Logic SDK (image model) ───────┼──┤ ☁ cloud
 │                                                           │  │
 │  player.js ──► Canvas + Web Speech + MediaRecorder        │  │
 │  (motion comic, all local)                                │  │
 └──────────────┬────────────────────────────────────────────┘  │
                │ App Check token on every AI call              │
                ▼                                               ▼
     ┌─────────────────────── Firebase (your personal project) ──────────┐
     │ App Check (reCAPTCHA Enterprise) — blocks anyone else's calls     │
     │ AI Logic → Gemini API (cloud text + image models)                 │
     │ Authentication (anonymous → optional Google sign-in)              │
     │ Firestore: users/{uid}/stories/{storyId} (text, choices, sources) │
     │ Storage: users/{uid}/panels/{panelId}.png                         │
     │ Remote Config: model names, scene length, image on/off            │
     │ Hosting: the public demo URL for judges                           │
     └───────────────────────────────────────────────────────────────────┘
```

## Firebase products and what each one teaches you

| Product | What we use it for | What you learn |
|---|---|---|
| **AI Logic** | Hybrid text model + cloud image model, called straight from the browser | Calling AI from a client without your own backend; hybrid inference modes |
| **App Check** | Proves calls come from *your* app, so nobody can spend your quota | Why a client-side API key isn't a secret, and what protects it instead |
| **Authentication** | Anonymous sign-in on first visit, optional Google upgrade | Giving every user a stable `uid` with zero sign-up friction |
| **Firestore** | Saving stories | Document model, per-user security rules |
| **Storage** | Saving panel images | Files + security rules keyed to `uid` |
| **Remote Config** | Model names, story settings, kill switch for images | Changing app behavior without redeploying (models get renamed; this saves you) |
| **Hosting** | Public URL | One-command deploys |

No Cloud Functions and no server of our own. Everything runs in the browser plus managed
Firebase services, which keeps it free-tier friendly and fast to build.

## Data model (Firestore)

```
users/{uid}/stories/{storyId}
  title, ageBand, style, createdAt, updatedAt
  scenes: [ { text, choices: [a, b], picked, source: "on_device"|"in_cloud", panelPath? } ]
```

One document per story (scenes are small; a story stays well under the 1 MB document limit).
Security rule: a user can read and write only `users/{their uid}/**`.

## How a scene is made

1. User picks a choice (or types a premise).
2. `story.js` builds a short prompt (premise + last 2 scenes + style + age band) and asks the
   hybrid model for **JSON**: `{ "scene": "...", "choices": ["...", "..."] }`. Structured output
   is supported on device, which keeps parsing reliable.
3. Text streams onto the page; the badge shows `inferenceSource`.
4. In the background, `art.js` asks the cloud image model for a panel in the story's style;
   the picture fades in when ready. If images are off or fail, the scene still works.
5. The scene is saved to Firestore.

## Failure handling

- **No Gemini Nano** (other browser, flag off, model downloading): `PREFER_ON_DEVICE` quietly
  uses the cloud; the badge says ☁. The "private rewrite" button is disabled with a tooltip.
- **Offline**: on-device writing still works; images and saving queue until back online
  (Firestore's offline cache does the saving part for free).
- **Bad JSON from the model**: retry once, then show the raw text as the scene with default
  choices.
- **Image quota exhausted**: Remote Config switch turns images off for everyone.

## Build order (14 days, deadline Nov 30 2:00 PM PST)

1. Days 1–3: Firebase project, App Check, hybrid scene generation with the badge.
2. Days 4–7: choices, Auth + Firestore saving, cloud panels + Storage, Remote Config.
3. Days 8–10: motion comic player and `.webm` export, offline polish.
4. Days 11–14: optional Android, README, Apache-2.0 license, 3-minute video, submit.
