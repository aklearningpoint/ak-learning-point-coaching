// Strict Hierarchy Parser & Auto-Metadata Question Paper Controller

const CLASS_SUBJECT_CATALOG = {
  "Nur & Play": ["Hindi", "English", "Math", "Drawing"],
  "LKG":        ["Hindi", "English", "Math", "Drawing"],
  "UKG":        ["Hindi", "English", "Math", "EVS", "Drawing"],
  "1":          ["Hindi", "English", "Math", "Science", "SST", "Drawing"],
  "2":          ["Hindi", "English", "Math", "Science", "SST", "Drawing"],
  "3":          ["Hindi", "English", "Math", "Science", "SST", "Drawing"],
  "4":          ["Hindi", "English", "Math", "Science", "SST", "Drawing"],
  "5":          ["Hindi", "English", "Math", "Science", "SST", "Drawing"]
};

window.addEventListener("DOMContentLoaded", () => {
  populateSubjectDropdown();
  syncPaperMeta();
});

function populateSubjectDropdown() {
  const cls = document.getElementById("qpClass").value;
  const list = CLASS_SUBJECT_CATALOG[cls] || [];
  const sel = document.getElementById("qpSubject");
  sel.innerHTML = "";
  list.forEach(sub => {
    sel.innerHTML += `<option value="${sub}">${sub}</option>`;
  });
}

function syncPaperMeta() {
  const cls = document.getElementById("qpClass").value;
  const sub = document.getElementById("qpSubject").value;
  const term = document.getElementById("qpTerm").value;
  const time = document.getElementById("qpTime").value;

  // 1. Auto Full Marks Detection
  const fm = (sub === "Drawing") ? 50 : 100;
  document.getElementById("qpFullMarks").value = fm;

  // 2. Auto Date Fetch from Exam Planner
  const plans = SchoolDB.get(SchoolDB.KEYS.EXAM_PLANS, {});
  let scheduledDate = "";
  if (plans[cls] && plans[cls][term] && plans[cls][term].schedule) {
    scheduledDate = plans[cls][term].schedule[sub] || "";
  }
  
  if (scheduledDate) {
    document.getElementById("qpDate").value = scheduledDate;
  }

  const userDate = document.getElementById("qpDate").value;

  // 3. Update Preview Header Elements
  document.getElementById("previewTermBadge").innerText = `EXAMINATION: ${term.toUpperCase()} (2026-2027)`;
  document.getElementById("previewClass").innerText = cls;
  document.getElementById("previewSubject").innerText = sub;
  document.getElementById("previewFM").innerText = fm;
  document.getElementById("previewTime").innerText = time;
  document.getElementById("previewDate").innerText = userDate || "___________";
}

document.getElementById("qpClass").addEventListener("change", () => {
  populateSubjectDropdown();
  syncPaperMeta();
});

// Strict Hierarchical Sequencing Parser
function parseAndRenderPaper() {
  const raw = document.getElementById("rawQuestionText").value.trim();
  const bodyContainer = document.getElementById("previewBody");
  bodyContainer.innerHTML = "";

  if (!raw) {
    bodyContainer.innerHTML = "<p><i>No questions entered. Paste questions above and click Format.</i></p>";
    return;
  }

  const lines = raw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  let parsedStructure = [];
  let currentParent = null;

  // Regex patterns
  const parentPattern = /^(q\.?\s*\d+|question\s*\d+|\d+\.)/i;
  const subPattern = /^(\([a-z0-9]+\)|[a-z]\.|\([ivx]+\)|[ivx]+\.)/i;

  lines.forEach(line => {
    if (parentPattern.test(line)) {
      if (currentParent) parsedStructure.push(currentParent);
      currentParent = { title: line, subItems: [] };
    } else if (subPattern.test(line)) {
      if (currentParent) {
        currentParent.subItems.push(line);
      } else {
        currentParent = { title: "Questions:", subItems: [line] };
      }
    } else {
      if (currentParent && currentParent.subItems.length > 0) {
        currentParent.subItems.push(line);
      } else if (currentParent) {
        currentParent.title += " " + line;
      } else {
        currentParent = { title: line, subItems: [] };
      }
    }
  });

  if (currentParent) parsedStructure.push(currentParent);

  // Render parsed tree into DOM with sequence preservation
  parsedStructure.forEach(pq => {
    const parentDiv = document.createElement("div");
    parentDiv.className = "qp-parent-q";

    const titleDiv = document.createElement("div");
    titleDiv.className = "qp-parent-title";
    titleDiv.innerText = pq.title;
    parentDiv.appendChild(titleDiv);

    if (pq.subItems.length > 0) {
      const isShort = pq.subItems.every(item => item.length < 50);
      const subList = document.createElement("div");
      subList.className = "qp-sub-list" + (isShort && pq.subItems.length >= 4 ? " two-col-grid" : "");

      pq.subItems.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "qp-sub-item";
        itemDiv.innerText = item;
        subList.appendChild(itemDiv);
      });

      parentDiv.appendChild(subList);
    }

    bodyContainer.appendChild(parentDiv);
  });
}
