const $ = (id) => document.getElementById(id);
let files = [];
let records = [];

//choose files: click or drag & drop
const dz = $("dropzone");
dz.addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => setFiles(e.target.files));
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("hover"); });
dz.addEventListener("dragleave", () => dz.classList.remove("hover"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("hover");
  setFiles(e.dataTransfer.files);
});

function setFiles(fileList) {
  files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
  $("fileList").textContent = files.length
    ? `${files.length} image(s): ` + files.map((f) => f.name).join(", ")
    : "No images selected.";
  $("extractBtn").disabled = files.length === 0;
  $("status").textContent = "";
}

//send all images to Flask
$("extractBtn").addEventListener("click", async () => {
  const form = new FormData();
  files.forEach((f) => form.append("images", f));      // name must match getlist("images")

  $("extractBtn").disabled = true;
  $("status").textContent = `Reading ${files.length} image(s)...`;
  $("results").hidden = true;

  try {
    const res = await fetch("/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    records = data.results;
    showResults(data);
    $("status").textContent = "Done.";
  } catch (err) {
    $("status").textContent = "Error: " + err.message;
  } finally {
    $("extractBtn").disabled = files.length === 0;
  }
});

function showResults(data) {
  const cards = $("cards");
  cards.innerHTML = "";
  records.forEach((r, i) => cards.appendChild(makeCard(r, i)));

  const errors = $("errors");
  errors.innerHTML = "";
  data.errors.forEach((e) => {
    const p = document.createElement("p");
    p.className = "err";
    p.textContent = `${e.file}: ${e.error}`;
    errors.appendChild(p);
  });

  const avg = records.length
    ? (records.reduce((s, r) => s + r.confidence, 0) / records.length).toFixed(1) : 0;
  $("summary").textContent = `${records.length} processed, average confidence ${avg}%`;
  $("results").hidden = false;
}

function makeCard(r, i) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = r.file;
  const badge = document.createElement("span");
  badge.className = "badge " + r.status;
  badge.textContent = `${r.status.replace("_", " ")}, ${r.confidence}% confidence, ${r.word_count} words`;
  title.appendChild(badge);
  card.appendChild(title);

  const cols = document.createElement("div");
  cols.className = "cols";

  const rawBox = makeBox("Raw OCR text", r.raw_text, true);
  const cleanBox = makeBox("Clean text (editable)", r.clean_text, false);
  cleanBox.area.addEventListener("input", () => {     // keep edits in the dataset
    records[i].clean_text = cleanBox.area.value;
    records[i].word_count = cleanBox.area.value.split(/\s+/).filter(Boolean).length;
  });
  cols.appendChild(rawBox.wrap);
  cols.appendChild(cleanBox.wrap);
  card.appendChild(cols);

  // Separate sections for what was kept out of the clean text
  card.appendChild(makeChips("Links found", r.urls, "No links found."));
  card.appendChild(makeChips("Junk symbols found (kept out of the clean text)",
    r.symbols.map((s) => `${s.symbol}  x${s.count}`), "No junk symbols found."));

  const txtBtn = document.createElement("button");
  txtBtn.className = "light";
  txtBtn.textContent = "Download .txt";
  txtBtn.addEventListener("click", () =>
    download(r.file.replace(/\.[^.]+$/, "") + ".txt", records[i].clean_text, "text/plain"));
  card.appendChild(txtBtn);
  return card;
}

function makeBox(label, text, readonly) {
  const wrap = document.createElement("div");
  const lab = document.createElement("label");
  lab.textContent = label;
  const area = document.createElement("textarea");
  area.rows = 8;
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

// ---- dataset downloads ----
function csvCell(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

$("csvBtn").addEventListener("click", () => {
  const header = ["file", "status", "confidence", "word_count", "clean_text", "urls", "symbols"];
  const rows = records.map((r) => header.map((h) => {
    if (h === "urls") return csvCell(r.urls.join(" | "));
    if (h === "symbols") return csvCell(r.symbols.map((s) => `${s.symbol} x${s.count}`).join(" "));
    return csvCell(r[h]);
  }).join(","));
  download("dataset.csv", "\ufeff" + [header.join(","), ...rows].join("\n"), "text/csv");
});

$("jsonBtn").addEventListener("click", () =>
  download("dataset.json", JSON.stringify(records, null, 2), "application/json"));

function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}