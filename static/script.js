const $ = (id) => document.getElementById(id);
let selectedFile = null;
let current = null;

//choose one file: click or drag & drop
const dz = $("dropzone");
dz.addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => setFile(e.target.files[0]));
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("hover"); });
dz.addEventListener("dragleave", () => dz.classList.remove("hover"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("hover");
  setFile(e.dataTransfer.files[0]);                    // only the first file is used
});

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    $("status").textContent = "Please choose an image file.";
    return;
  }
  selectedFile = file;
  $("preview").src = URL.createObjectURL(file);        // instant local preview
  $("preview").hidden = false;
  $("dropText").textContent = file.name;
  $("extractBtn").disabled = false;
  $("status").textContent = "";
}

//send the image to Flask
$("extractBtn").addEventListener("click", async () => {
  const form = new FormData();
  form.append("image", selectedFile);                  // name must match request.files.get("image")

  $("extractBtn").disabled = true;
  $("status").textContent = "Reading the image...";
  $("results").hidden = true;

  try {
    const res = await fetch("/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    current = data;
    showResult(data);
    $("status").textContent = "Done.";
  } catch (err) {
    $("status").textContent = "Error: " + err.message;
  } finally {
    $("extractBtn").disabled = !selectedFile;
  }
});

function showResult(r) {
  const card = $("card");
  card.innerHTML = "";
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = r.file;
  const badge = document.createElement("span");
  badge.className = "badge " + r.status;
  badge.textContent = `${r.status.replace("_", " ")}, ${r.word_count} words`;
  title.appendChild(badge);
  card.appendChild(title);

  const cols = document.createElement("div");
  cols.className = "cols";
  const rawBox = makeBox("Raw OCR text", r.raw_text, true);
  const cleanBox = makeBox("Clean text (editable)", r.clean_text, false);
  cleanBox.area.addEventListener("input", () => { current.clean_text = cleanBox.area.value; });
  cols.appendChild(rawBox.wrap);
  cols.appendChild(cleanBox.wrap);
  card.appendChild(cols);

  // Separate sections for what was kept out of the clean text
  card.appendChild(makeChips("Links found", r.urls, "No links found."));
  card.appendChild(makeChips("Junk symbols found (kept out of the clean text)",
    r.symbols.map((s) => `${s.symbol}  x${s.count}`), "No junk symbols found."));

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy clean text";
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(current.clean_text);
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy clean text"), 1500);
  });
  const txtBtn = document.createElement("button");
  txtBtn.className = "light";
  txtBtn.textContent = "Download .txt";
  txtBtn.addEventListener("click", () =>
    download(r.file.replace(/\.[^.]+$/, "") + ".txt", current.clean_text, "text/plain"));
  card.appendChild(copyBtn);
  card.appendChild(txtBtn);

  $("results").hidden = false;
}

function makeBox(label, text, readonly) {
  const wrap = document.createElement("div");
  const lab = document.createElement("label");
  lab.textContent = label;
  const area = document.createElement("textarea");
  area.rows = 10;
  area.readOnly = readonly;
  area.value = text;                                   // .value, not innerHTML: safe
  wrap.appendChild(lab);
  wrap.appendChild(area);
  return { wrap, area };
}

function makeChips(title, items, emptyText) {
  const div = document.createElement("div");
  div.className = "group";
  const label = document.createElement("b");
  label.textContent = title;
  div.appendChild(label);
  if (!items.length) {
    const none = document.createElement("span");
    none.className = "none";
    none.textContent = emptyText;
    div.appendChild(none);
    return div;
  }
  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item;                           // textContent: safe
    div.appendChild(chip);
  });
  return div;
}

function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}