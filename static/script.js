const $ = (id) => document.getElementById(id);
let selectedFile = null;

//choose a file: click or drag & drop
const dz = $("dropzone");
dz.addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => setFile(e.target.files[0]));
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("hover"); });
dz.addEventListener("dragleave", () => dz.classList.remove("hover"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("hover");
  setFile(e.dataTransfer.files[0]);
});

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    $("status").textContent = "Please choose an image file.";
    return;
  }
  selectedFile = file;
  $("preview").src = URL.createObjectURL(file);   // instant local preview
  $("preview").hidden = false;
  $("dropText").textContent = file.name;
  $("extractBtn").disabled = false;
  $("status").textContent = "";
}

//send the image to Flask
$("extractBtn").addEventListener("click", async () => {
  const form = new FormData();
  form.append("image", selectedFile);          // name must match request.files.get("image")

  $("extractBtn").disabled = true;
  $("status").textContent = "Reading the image...";
  $("results").hidden = true;

  try {
    const res = await fetch("/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showResults(data);
    $("status").textContent = "Done.";
  } catch (err) {
    $("status").textContent = "Error: " + err.message;
  } finally {
    $("extractBtn").disabled = false;
  }
});

function showResults(d) {
  $("output").value = d.cleaned_text;
  $("meta").textContent = `${d.word_count} words, ${d.confidence}% confidence`;

  const found = $("found");
  found.innerHTML = "";
  addGroup(found, "Keywords", d.keywords);
  addGroup(found, "People, places, organizations", d.entities.map((e) => e.text));
  for (const [name, items] of Object.entries(d.patterns)) addGroup(found, name, items);
  if (!found.children.length) found.textContent = "Nothing structured found.";
  $("results").hidden = false;
}

function addGroup(parent, title, items) {
  if (!items || !items.length) return;
  const div = document.createElement("div");
  div.className = "group";
  const label = document.createElement("b");
  label.textContent = title;
  div.appendChild(label);
  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item;                   // textContent keeps it safe from injected HTML
    div.appendChild(chip);
  });
  parent.appendChild(div);
}

//copy and download
$("copyBtn").addEventListener("click", () => navigator.clipboard.writeText($("output").value));
$("downloadBtn").addEventListener("click", () => {
  const blob = new Blob([$("output").value], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "extracted.txt";
  a.click();
});