# Setting up Firebase (your personal Google account)

Do these in a Chrome profile signed in to your **personal** Google account, not Earnifi's.
Each step says what it is for, so you learn the pieces as you go.

## 1. Create the project (2 min)
1. Go to <https://console.firebase.google.com> → **Create a project** → name it `kahani`.
2. Google Analytics: off (we don't need it).
3. **Plan:** story text works on the free **Spark** plan. **Panel pictures need Blaze**
   (pay-as-you-go): the Gemini image models require it. Upgrade when we reach pictures and
   set a **budget alert of $5** under Google Cloud → Billing → Budgets. The hackathon's free
   image quota (step 8) covers most of the cost.

*Learn:* a Firebase project is a Google Cloud project with Firebase features turned on.

## 2. Register the web app (1 min)
1. Project overview → **</>** (Web) → nickname `kahani-web` → also tick **Firebase Hosting**.
2. Copy the `firebaseConfig` object it shows. Send it to me or paste it in `.env.local`
   (see `.env.example`).

*Learn:* this config is **not a secret**. It only says which project to talk to. Protection
comes from App Check and security rules (next steps).

## 3. Turn on AI Logic (2 min)
1. Left menu → **AI Logic** → **Get started** → choose **Gemini Developer API**.
2. It will offer to set up App Check: accept, and pick **reCAPTCHA Enterprise**.
   Copy the **site key** into `.env.local` as `VITE_RECAPTCHA_KEY`.
3. Make sure the AI Logic row under **App Check → APIs** says **Enforced**.

*Learn:* App Check attaches a short-lived token proving the call came from your real web app,
so someone who copies your config can't spend your quota.

## 4. Debug token for localhost (2 min)
1. Run the app locally (`npm run dev`) and open the browser console. It prints an
   **App Check debug token**.
2. Console → **App Check → Apps → kahani-web → ⋮ → Manage debug tokens** → add it.
3. Never commit this token.

## 5. Authentication (1 min)
**Authentication → Get started → Sign-in method** → enable **Anonymous** and **Google**.

## 6. Firestore and Storage (2 min)
1. **Firestore Database → Create database** → production mode → region close to you
   (e.g. `asia-south1`).
2. **Storage → Get started** → same region.
3. Deploy the security rules from the repo instead of editing them in the console:
   `firebase deploy --only firestore:rules,storage` (after step 9).

*Learn:* the rules are the real security boundary. They let a signed-in user touch only
`users/{their uid}/...`, so even with the public config nobody can read another person's stories.

## 7. Chrome with Gemini Nano (5 min + download)
1. Chrome **139+** on desktop (`chrome://settings/help`).
2. `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled** → relaunch.
3. In DevTools console: `await LanguageModel.availability()`. You want `"available"`.
   If it says `"downloadable"`, the app's **Enable on-device AI** button starts the download
   (needs ~22 GB free disk).

## 8. Image quota (optional, request early)
The hackathon offers a free Google Account Quota for image generation, valid 4 days.
Request windows: **Wed Nov 18** (sprint 2) or **Wed Nov 25** (last). Request on the
hackathon's page when we reach the panel-art step.

## 9. Firebase CLI (1 min)
```bash
npm i -g firebase-tools
firebase login          # personal account
firebase use --add      # pick "kahani"
```

## 10. Remote Config (optional, 1 min)
The app has built-in defaults, so this is only needed to change things live.
**Remote Config → Create configuration** and add:
- `image_model` (string): `gemini-3.1-flash-lite-image`
- `images_enabled` (boolean): `true`. Set it to `false` to stop all picture generation
  instantly if you're near your budget.
