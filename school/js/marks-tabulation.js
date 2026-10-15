// =========================================================================
// MASTER TABULATION REGISTER, SUBJECT MATRIX & DUAL ENTRY ENGINE (LEVEL 2)
// File: js/marks-tabulation.js - Assent Public School
// =========================================================================

const SUBJECT_RULES = {
  "Nur & Play": { base: ["Hindi", "English", "Math"], baseMax: 100, drawingMax: 50 },
  "LKG":        { base: ["Hindi", "English", "Math"], baseMax: 100, drawingMax: 50 },
  "UKG":        { base: ["Hindi", "English", "Math", "EVS"], baseMax: 100, drawingMax: 50 },
  "1":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "2":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "3":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "4":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "5":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 }
};

let currentClass = "Nur & Play";
let currentTerm = "Term 1";

// -------------------------------------------------------------
// Compatibility & Fallback Database Layer (Zero Crash Guarantee)
// -------------------------------------------------------------
function getLocalKey(key, fallback) {
  if (typeof SchoolDB !== "undefined" && typeof SchoolDB.get === "function") {
    try {
      return SchoolDB.get(key, fallback);
    } catch (e) {}
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocalKey(key, value) {
  if (typeof SchoolDB !== "undefined" && typeof SchoolDB.set === "function") {
    try {
      SchoolDB.set(key, value);
      return;
    } catch (e) {}
  }
  localStorage.setItem(key, JSON.stringify(value));
}

// Smart Normalizer for Class Identification (e.g., '3', 'Class 3', 'Nur & Play')
function normalizeClassKey(cls) {
  return String(cls || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchClassNames(a, b) {
  const k1 = normalizeClassKey(a);
  const k2 = normalizeClassKey(b);
  if (!k1 || !k2) return false;
  if (k1 === k2 || k1 === ("class" + k2) || ("class" + k1) === k2) return true;
  if ((k1.includes("nur") || k1.includes("play")) && (k2.includes("nur") || k2.includes("play"))) return true;
  return false;
}

function getAllStudents() {
  if (typeof SchoolDB !== "undefined" && typeof SchoolDB.getStudents === "function") {
    const list = SchoolDB.getStudents();
    if (list && list.length > 0) return list;
  }
  return getLocalKey("ak_school_students", []);
}

function getAllMarks() {
  return getLocalKey("ak_school_tabulation_marks", {});
}

function saveAllMarks(marksObj) {
  setLocalKey("ak_school_tabulation_marks", marksObj);
}

// -------------------------------------------------------------
// Subject & Marks Rules Engine
// -------------------------------------------------------------
function getActiveSubjects(cls, term) {
  let rule = SUBJECT_RULES[cls];
  if (!rule) {
    const num = String(cls).replace(/[^0-9]/g, "");
    rule = SUBJECT_RULES[num] || { base: ["Hindi", "English", "Math"], baseMax: 100, drawingMax: 50 };
  }
  const list = [...rule.base];
  if (term === "Term 2" || term === "Term 3") {
    list.push("Drawing");
  }
  return list;
}

function getMaxMarksForSubject(subject) {
  return subject === "Drawing" ? 50 : 100;
}

// -------------------------------------------------------------
// 1. Initialization
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  handleClassTermChange();
  checkPublishStatus();
});

function handleClassTermChange() {
  const classEl = document.getElementById("marksClassSelect");
  const termEl = document.getElementById("marksTermSelect");
  if (classEl) currentClass = classEl.value;
  if (termEl) currentTerm = termEl.value;

  const subTitle = document.getElementById("ledgerSubTitle");
  if (subTitle) {
    subTitle.innerText = `Class: ${currentClass} • ${currentTerm}`;
  }
  
  populateModeAStudents();
  populateModeBSubjects();
  renderTabulationLedger();
  checkPublishStatus();
}

// -------------------------------------------------------------
// 2. Mode Switching UI
// -------------------------------------------------------------
function switchEntryModeUI() {
  const mode = document.getElementById("entryModeSelect").value;
  const uiA = document.getElementById("uiModeA");
  const uiB = document.getElementById("uiModeB");

  if (mode === "modeA") {
    if (uiA) uiA.style.display = "block";
    if (uiB) uiB.style.display = "none";
    loadStudentMarksForModeA();
  } else {
    if (uiA) uiA.style.display = "none";
    if (uiB) uiB.style.display = "block";
    renderModeBTable();
  }
}

// -------------------------------------------------------------
// 3. Mode A: Student-Wise Matrix
// -------------------------------------------------------------
function populateModeAStudents() {
  const students = getAllStudents();
  const classStudents = students.filter(s => matchClassNames(s.className || s.class, currentClass) && s.status !== "BLOCKED");
  const sel = document.getElementById("modeAStudentSelect");
  if (!sel) return;
  sel.innerHTML = "";

  if (classStudents.length === 0) {
    sel.innerHTML = `<option value="">No students in ${currentClass}</option>`;
    return;
  }

  classStudents.sort((a, b) => (parseInt(a.rollNo || a.roll, 10) || 0) - (parseInt(b.rollNo || b.roll, 10) || 0));

  classStudents.forEach(s => {
    sel.innerHTML += `<option value="${s.id || s.regNo}">Roll ${s.rollNo || s.roll} - ${s.name}</option>`;
  });

  loadStudentMarksForModeA();
}

function loadStudentMarksForModeA() {
  const sel = document.getElementById("modeAStudentSelect");
  if (!sel) return;
  const studentId = sel.value;
  const subjects = getActiveSubjects(currentClass, currentTerm);
  const container = document.getElementById("modeASubjectsForm");
  if (!container) return;
  container.innerHTML = "";

  if (!studentId) return;

  const marksDB = getAllMarks();
  const studentMarks = (marksDB[studentId] && marksDB[studentId][currentTerm]) ? marksDB[studentId][currentTerm] : {};

  subjects.forEach(sub => {
    const max = getMaxMarksForSubject(sub);
    const score = studentMarks[sub] !== undefined ? studentMarks[sub] : "";
    container.innerHTML += `
      <div class="sub-input-card" style="margin-bottom:10px;">
        <label><b>${sub}</b> (Max: ${max})</label>
        <input type="number" id="modeA_sub_${sub}" class="input-ctrl" max="${max}" min="0" value="${score}" placeholder="Marks">
      </div>
    `;
  });
}

function saveAndNextModeA() {
  const sel = document.getElementById("modeAStudentSelect");
  if (!sel) return;
  const studentId = sel.value;
  if (!studentId) return;

  const subjects = getActiveSubjects(currentClass, currentTerm);
  const marksDB = getAllMarks();
  if (!marksDB[studentId]) marksDB[studentId] = {};
  if (!marksDB[studentId][currentTerm]) marksDB[studentId][currentTerm] = {};

  const recordPayload = { studentId: studentId, className: currentClass, term: currentTerm };

  subjects.forEach(sub => {
    const el = document.getElementById("modeA_sub_" + sub);
    const val = el && el.value !== "" ? parseFloat(el.value) : 0;
    marksDB[studentId][currentTerm][sub] = val;
    recordPayload[sub.toLowerCase()] = val;
  });

  saveAllMarks(marksDB);
  syncMarksToCloud(recordPayload);

  // Jump to Next Student automatically
  if (sel.selectedIndex < sel.options.length - 1) {
    sel.selectedIndex += 1;
    loadStudentMarksForModeA();
  } else {
    alert("Marks updated! You have reached the end of the class roster.");
  }
  renderTabulationLedger();
}

// -------------------------------------------------------------
// 4. Mode B: Rapid Subject Column Entry
// -------------------------------------------------------------
function populateModeBSubjects() {
  const subjects = getActiveSubjects(currentClass, currentTerm);
  const sel = document.getElementById("modeBSubjectSelect");
  if (!sel) return;
  sel.innerHTML = "";
  subjects.forEach(sub => {
    sel.innerHTML += `<option value="${sub}">${sub} (Max: ${getMaxMarksForSubject(sub)})</option>`;
  });
  renderModeBTable();
}

function renderModeBTable() {
  const sel = document.getElementById("modeBSubjectSelect");
  if (!sel || !sel.value) return;
  const sub = sel.value;
  const max = getMaxMarksForSubject(sub);
  const students = getAllStudents();
  const classStudents = students.filter(s => matchClassNames(s.className || s.class, currentClass) && s.status !== "BLOCKED");
  const marksDB = getAllMarks();
  const tbody = document.getElementById("modeBTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (classStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#64748b;">No students enrolled in Class ${currentClass}.</td></tr>`;
    return;
  }

  classStudents.sort((a, b) => (parseInt(a.rollNo || a.roll, 10) || 0) - (parseInt(b.rollNo || b.roll, 10) || 0));

  classStudents.forEach(s => {
    const sid = s.id || s.regNo;
    const score = (marksDB[sid] && marksDB[sid][currentTerm] && marksDB[sid][currentTerm][sub] !== undefined)
      ? marksDB[sid][currentTerm][sub] : "";
    tbody.innerHTML += `
      <tr>
        <td><b>Roll ${s.rollNo || s.roll}</b></td>
        <td>${s.name}</td>
        <td><input type="number" class="input-ctrl-sm modeB-score-input" data-sid="${sid}" data-name="${s.name}" data-roll="${s.rollNo || s.roll}" value="${score}" max="${max}" min="0" style="max-width:110px;"></td>
        <td>${max}</td>
      </tr>
    `;
  });
}

function saveModeBAllMarks() {
  const sel = document.getElementById("modeBSubjectSelect");
  if (!sel) return;
  const sub = sel.value;
  const inputs = document.querySelectorAll(".modeB-score-input");
  const marksDB = getAllMarks();

  inputs.forEach(inp => {
    const sid = inp.getAttribute("data-sid");
    const val = inp.value;
    if (!marksDB[sid]) marksDB[sid] = {};
    if (!marksDB[sid][currentTerm]) marksDB[sid][currentTerm] = {};
    const finalScore = val !== "" ? parseFloat(val) : 0;
    marksDB[sid][currentTerm][sub] = finalScore;

    syncMarksToCloud({
      studentId: sid,
      name: inp.getAttribute("data-name"),
      rollNo: inp.getAttribute("data-roll"),
      className: currentClass,
      term: currentTerm,
      [sub.toLowerCase()]: finalScore
    });
  });

  saveAllMarks(marksDB);
  alert("Column marks for " + sub + " saved successfully!");
  renderTabulationLedger();
}

// -------------------------------------------------------------
// 5. Master Tabulation Engine (Rank & Percentage Logic)
// -------------------------------------------------------------
function renderTabulationLedger() {
  const subjects = getActiveSubjects(currentClass, currentTerm);
  const students = getAllStudents();
  const classStudents = students.filter(s => matchClassNames(s.className || s.class, currentClass) && s.status !== "BLOCKED");
  const marksDB = getAllMarks();

  let maxPossibleTotal = 0;
  subjects.forEach(sub => maxPossibleTotal += getMaxMarksForSubject(sub));

  // Build Table Headers
  const thead = document.getElementById("tabulationHead");
  if (thead) {
    let theadHtml = `<tr><th>Roll</th><th>Student Name</th>`;
    subjects.forEach(sub => theadHtml += `<th>${sub}</th>`);
    theadHtml += `<th>Grand Total (${maxPossibleTotal})</th><th>Percentage (%)</th><th>Rank</th></tr>`;
    thead.innerHTML = theadHtml;
  }

  // Compute Scores
  const studentRows = classStudents.map(s => {
    const sid = s.id || s.regNo;
    const sMarks = (marksDB[sid] && marksDB[sid][currentTerm]) ? marksDB[sid][currentTerm] : {};
    let grandTotal = 0;
    const scores = {};

    subjects.forEach(sub => {
      const val = sMarks[sub] !== undefined ? sMarks[sub] : 0;
      scores[sub] = val;
      grandTotal += val;
    });

    const percentage = maxPossibleTotal > 0 ? ((grandTotal / maxPossibleTotal) * 100).toFixed(2) : 0;
    return { student: s, scores, grandTotal, percentage: parseFloat(percentage) };
  });

  // Assign Class Ranks
  studentRows.sort((a, b) => b.grandTotal - a.grandTotal);
  studentRows.forEach((row, idx) => { row.rank = idx + 1; });

  // Re-sort back by Roll Number for orderly Ledger view
  studentRows.sort((a, b) => (parseInt(a.student.rollNo || a.student.roll, 10) || 0) - (parseInt(b.student.rollNo || b.student.roll, 10) || 0));

  // Render Table Rows
  const tbody = document.getElementById("tabulationBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (studentRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${subjects.length + 5}" style="text-align:center; padding:20px; color:#64748b;">No student records found. Select or enroll students first.</td></tr>`;
    return;
  }

  studentRows.forEach(row => {
    let trHtml = `<tr><td><b>${row.student.rollNo || row.student.roll}</b></td><td>${row.student.name}</td>`;
    subjects.forEach(sub => {
      trHtml += `<td>${row.scores[sub]}</td>`;
    });
    trHtml += `<td><b>${row.grandTotal}</b></td><td><b>${row.percentage}%</b></td><td><span class="rank-tag" style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:12px; font-weight:700;">Rank ${row.rank}</span></td></tr>`;
    tbody.innerHTML += trHtml;
  });
}

// -------------------------------------------------------------
// 6. Fee Protection: Result Publishing Toggle
// -------------------------------------------------------------
function checkPublishStatus() {
  const publishedList = getLocalKey("ak_school_results_published", {});
  const key = `${currentClass}_${currentTerm}`;
  const btn = document.getElementById("btnPublishToggle");
  if (!btn) return;

  if (publishedList[key]) {
    btn.className = "btn-publish-live";
    btn.innerHTML = `<i class="fa fa-globe"></i> Result Status: PUBLISHED LIVE`;
  } else {
    btn.className = "btn-publish-draft";
    btn.innerHTML = `<i class="fa fa-eye-slash"></i> Result Status: DRAFT (Locked)`;
  }
}

function toggleResultPublish() {
  const publishedList = getLocalKey("ak_school_results_published", {});
  const key = `${currentClass}_${currentTerm}`;

  if (publishedList[key]) {
    delete publishedList[key];
    alert(`Results for ${currentClass} ${currentTerm} have been HIDDEN from student portal.`);
  } else {
    publishedList[key] = true;
    alert(`Results for ${currentClass} ${currentTerm} are now PUBLISHED LIVE for students!`);
  }

  setLocalKey("ak_school_results_published", publishedList);
  checkPublishStatus();
}

function printLandscapeLedger() {
  window.print();
}

// -------------------------------------------------------------
// 7. Background Cloud Sync Helper
// -------------------------------------------------------------
function syncMarksToCloud(marksPayload) {
  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL) {
    try {
      fetch(CLOUD_SYNC_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveMarks", marks: marksPayload })
      });
    } catch (e) {}
  }
}

// A4 Landscape Direct PDF Generator
function downloadLedgerPDF() {
  const element = document.getElementById("ledgerPrintWrapper");
  if (!element) {
    alert("Ledger table nahi mili!");
    return;
  }

  const sig = document.getElementById("pdfSignatureRow");
  if (sig) sig.style.display = "flex";

  const opt = {
    margin:       [8, 8, 8, 8],
    filename:     `Assent_Ledger_${currentClass.replace(/\s+/g, '_')}_${currentTerm.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    if (sig) sig.style.display = "";
  }).catch((err) => {
    console.error("PDF generation error:", err);
    if (sig) sig.style.display = "";
    alert("PDF generate nahi ho saka, kripya Print option use karein.");
  });
}
