import { getGenerativeModel, ResponseModality, ImageConfigAspectRatio } from "firebase/ai";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import { ai, app } from "./firebase.js";

// Remote Config: switch the image model or turn pictures off for everyone without redeploying.
const rc = getRemoteConfig(app);
rc.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 60_000 : 3_600_000;
rc.defaultConfig = { image_model: "gemini-3.1-flash-lite-image", images_enabled: true };
const ready = fetchAndActivate(rc).catch(() => {}); // offline or not set up yet: use the defaults

/**
 * Draws a comic panel for a scene, in the cloud (Gemini Nano can't make images).
 * `previous` is the last panel's { mimeType, data }, passed in so characters stay consistent.
 * Returns { mimeType, data } (base64), or null when pictures are switched off.
 */
export async function drawPanel(story, scene, previous) {
  await ready;
  if (!getValue(rc, "images_enabled").asBoolean()) return null;
  const model = getGenerativeModel(ai, {
    model: getValue(rc, "image_model").asString(),
    generationConfig: {
      responseModalities: [ResponseModality.IMAGE],
      imageConfig: { aspectRatio: ImageConfigAspectRatio.LANDSCAPE_4x3 },
    },
  });
  const parts = [
    `Draw one ${story.style} comic panel for readers aged ${story.age}. ` +
      `No text, captions or speech bubbles in the image.\n\nStory premise: ${story.premise}\n\nThis scene: ${scene.text}`,
  ];
  if (previous) parts.push("Keep the characters, colours and art style consistent with this earlier panel:", { inlineData: previous });
  const { response } = await model.generateContent(parts);
  const image = response.inlineDataParts()?.[0]?.inlineData;
  if (!image) throw new Error("the image model returned no picture");
  return image;
}
