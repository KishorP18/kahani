import "./style.css";
import { deviceStatus, enableDeviceModel, nextScene } from "./story.js";
import { drawPanel } from "./art.js";
import { saveStory, listStories, savePanel, panelUrl } from "./db.js";

const $ = s => document.querySelector(s);
let story = null; // { id, premise, style, age, scenes: [{ text, choices, source, picked, panelPath }] }
let lastPanel = null; // last generated picture this session, sent along so characters stay consistent

const BADGE = {
  on_device: `<span class="badge device" title="Written by Gemini Nano on this computer">⚡ On device</span>`,
  in_cloud: `<span class="badge cloud" title="Written by Gemini in the cloud">☁ Cloud</span>`,
};

async function showDeviceStatus() {
  const s = await deviceStatus();
  $("#device").textContent = {
    available: "⚡ On-device AI ready",
    downloadable: "On-device AI not downloaded yet",
    downloading: "On-device AI downloading…",
    unavailable: "No on-device AI in this browser. Stories use the cloud.",
  }[s];
  $("#enable").hidden = s !== "downloadable" && s !== "downloading";
}

$("#enable").onclick = async () => {
  $("#enable").disabled = true;
  await enableDeviceModel(p => ($("#device").textContent = `Downloading on-device AI… ${Math.round(p * 100)}%`));
  $("#enable").disabled = false;
  showDeviceStatus();
};

$("#start").onsubmit = e => {
  e.preventDefault();
  story = { id: crypto.randomUUID(), premise: $("#premise").value.trim(), style: $("#style").value, age: $("#age").value, scenes: [] };
  lastPanel = null;
  $("#scenes").innerHTML = "";
  write();
};

const save = () => saveStory(story).then(showLibrary).catch(e => console.warn("Save failed (will retry on next scene):", e));

function renderScene(scene, i, live) {
  const card = document.createElement("article");
  card.className = "scene";
  card.innerHTML = `<figure class="panel"></figure><p></p><footer>${BADGE[scene.source] ?? ""}<span class="time"></span></footer><div class="choices"></div>`;
  card.querySelector("p").textContent = scene.text;
  if (scene.panelPath) panelUrl(scene.panelPath).then(url => showPicture(card, url)).catch(() => {});
  for (const c of scene.choices) {
    const b = document.createElement("button");
    b.textContent = c;
    b.disabled = !live || !!scene.picked;
    if (scene.picked === c) b.classList.add("picked");
    b.onclick = () => {
      card.querySelectorAll(".choices button").forEach(x => (x.disabled = true));
      b.classList.add("picked");
      scene.picked = c;
      write();
    };
    card.querySelector(".choices").append(b);
  }
  return card;
}

function showPicture(card, src) {
  const fig = card.querySelector(".panel");
  fig.className = "panel";
  fig.innerHTML = `<img alt="Illustration for this scene" src="${src}">`;
}

async function write() {
  const slot = document.createElement("article");
  slot.className = "scene loading";
  slot.textContent = "Writing…";
  $("#scenes").append(slot);
  slot.scrollIntoView({ behavior: "smooth", block: "end" });
  const t0 = performance.now();
  try {
    const scene = await nextScene({ ...story, picked: story.scenes.at(-1)?.picked });
    story.scenes.push(scene);
    const card = renderScene(scene, story.scenes.length - 1, true);
    card.querySelector(".time").textContent = `${((performance.now() - t0) / 1000).toFixed(1)}s`;
    slot.replaceWith(card);
    save();
    illustrate(story, scene, card, story.scenes.length - 1);
  } catch (e) {
    console.error(e);
    slot.className = "scene error";
    slot.textContent = `Couldn't write this scene: ${e.message}`;
  }
}

// Pictures arrive after the text, so reading never waits on the slower cloud image model.
async function illustrate(forStory, scene, card, n) {
  const fig = card.querySelector(".panel");
  fig.className = "panel drawing";
  fig.textContent = "☁ Drawing…";
  try {
    const image = await drawPanel(forStory, scene, lastPanel);
    if (!image) return fig.remove();
    if (forStory === story) lastPanel = image;
    showPicture(card, `data:${image.mimeType};base64,${image.data}`);
    scene.panelPath = await savePanel(forStory.id, n, image);
    await saveStory(forStory);
  } catch (e) {
    console.warn("No picture for this scene:", e);
    fig.remove();
  }
}

async function showLibrary() {
  const list = await listStories().catch(() => []);
  $("#library").hidden = !list.length;
  $("#library ul").innerHTML = "";
  for (const s of list) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.className = "link";
    b.textContent = `${s.title} · ${s.scenes.length} scene${s.scenes.length === 1 ? "" : "s"}`;
    b.onclick = () => open(s);
    li.append(b);
    $("#library ul").append(li);
  }
}

function open(saved) {
  story = { id: saved.id, premise: saved.premise, style: saved.style, age: saved.age, scenes: saved.scenes };
  lastPanel = null;
  $("#scenes").innerHTML = "";
  story.scenes.forEach((s, i) => $("#scenes").append(renderScene(s, i, i === story.scenes.length - 1)));
  $("#scenes").lastElementChild?.scrollIntoView({ behavior: "smooth" });
}

showDeviceStatus();
showLibrary();
