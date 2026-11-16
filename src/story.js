import { getGenerativeModel, InferenceMode } from "firebase/ai";
import { ai } from "./firebase.js";

// One JSON Schema feeds both engines: Chrome's Prompt API calls it `responseConstraint`,
// the cloud Gemini API calls it `responseJsonSchema`.
const SCENE_SCHEMA = {
  type: "object",
  properties: {
    scene: { type: "string" },
    choices: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
  },
  required: ["scene", "choices"],
};

const CLOUD_MODEL = "gemini-3.5-flash-lite"; // the SDK's own default for hybrid; moves to Remote Config later

// Device first: free, instant, private, works offline. Falls back to the cloud automatically.
export const sceneModel = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_ON_DEVICE,
  inCloudParams: {
    model: CLOUD_MODEL,
    generationConfig: { responseMimeType: "application/json", responseJsonSchema: SCENE_SCHEMA },
  },
  onDeviceParams: { promptOptions: { responseConstraint: SCENE_SCHEMA } },
});

// Is Gemini Nano usable in this browser? "available" | "downloadable" | "downloading" | "unavailable"
export async function deviceStatus() {
  return "LanguageModel" in self ? LanguageModel.availability() : "unavailable";
}

// Must be called from a click: Chrome only starts the model download after a user gesture.
export const enableDeviceModel = onProgress => sceneModel.initializeDeviceModel(onProgress);

function prompt({ premise, style, age, scenes, picked }) {
  const recent = scenes.slice(-2).map(s => s.text).join("\n\n");
  return [
    `You write a ${style} story for readers aged ${age}, one short scene at a time.`,
    `Premise: ${premise}`,
    recent && `Story so far (latest scenes):\n${recent}`,
    picked && `The reader chose: ${picked}`,
    `Write the next scene in 60-90 words with vivid, simple language, ending on a moment of choice.`,
    `Then give exactly 2 short choices (under 8 words each) for what happens next.`,
    `Reply as JSON: {"scene": "...", "choices": ["...", "..."]}`,
  ].filter(Boolean).join("\n\n");
}

/** Next scene of the story. Returns { text, choices, source: "on_device" | "in_cloud" }. */
export async function nextScene(story) {
  for (let attempt = 0; ; attempt++) {
    const { response } = await sceneModel.generateContent(prompt(story));
    try {
      const { scene, choices } = JSON.parse(response.text());
      return { text: scene.trim(), choices: choices.slice(0, 2), source: response.inferenceSource };
    } catch (e) {
      // Small models occasionally break JSON; one retry, then keep the prose with default choices.
      if (attempt === 0) continue;
      return { text: response.text().trim(), choices: ["Keep going", "Try something brave"], source: response.inferenceSource };
    }
  }
}
