import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAI, GoogleAIBackend } from "firebase/ai";

const env = import.meta.env;

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

// On localhost App Check can't pass reCAPTCHA, so the SDK prints a debug token to the console
// that you register once in the Firebase console (docs/SETUP.md step 4).
if (env.DEV) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_KEY),
  isTokenAutoRefreshEnabled: true,
});

export const ai = getAI(app, { backend: new GoogleAIBackend() });
