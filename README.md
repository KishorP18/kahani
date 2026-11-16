# 🌙 Kahani

Choose-your-path illustrated stories, written **on your device** when it can and in the cloud
when it can't. Built for [#BuildHybridAI 2026](https://firebasehybridaihackathon.devpost.com/)
with Firebase AI Logic hybrid inference.

- **Scenes** are written by Gemini Nano in Chrome (`PREFER_ON_DEVICE`): instant, free, private,
  and they work offline. Without a local model the same call falls back to Gemini in the cloud.
  Every scene shows where it was written: ⚡ On device or ☁ Cloud.
- **Panels** are drawn by a Gemini image model in the cloud, with the previous panel as a
  reference so characters stay consistent.
- **Stories** save to Firestore, pictures to Cloud Storage, with per-user security rules.
  Remote Config can switch the image model or turn pictures off without a redeploy.

Work in progress. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design.

## Run it

1. Set up Firebase and Chrome: [docs/SETUP.md](docs/SETUP.md).
2. `cp .env.example .env.local` and fill in your Firebase web config.
3. `npm install && npm run dev`

## License

[Apache-2.0](LICENSE)
