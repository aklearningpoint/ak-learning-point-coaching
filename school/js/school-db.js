// ==========================================
// SCHOOL DATABASE & CLOUD SYNC ENGINE - ASSENT PUBLIC SCHOOL
// File: js/school-db.js
// ==========================================

var CLOUD_SYNC_URL = "https://script.google.com/macros/s/AKfycbwIKnHHCjTXrh_rJjA--9v16W0jPdrN-xpqVFqOhJzUxycYf5r_vu31jxHH7oT878788Q/exec";

// Smart Class Normalizer: Class 3, 4, 5 (numeric 3, 4, 5 ya "Class 5") ko handle karta hai
function normalizeClassName(cls) {
  return String(cls || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchClass(classA, classB) {
  var a = normalizeClassName(classA);
  var b = normalizeClassName(classB);
  if (!a || !b) return false;
  if (a === b || a === ("class" + b) || ("class" + a) === b) return true;
  if ((a.includes("nur") || a.includes("play")) && (b.includes("nur") || b.includes("play"))) return true;
  return false;
}

var schoolDB = {
  // 1. GET ALL STUDENTS
  getStudents: function() {
    try {
      return JSON.parse(localStorage.getItem("ak_school_students") || "[]");
    } catch(e) {
      return [];
    }
  },

  // 2. GET STUDENTS BY CLASS (Smart match for 3, 4, 5, UKG, Nur, etc.)
  getStudentsByClass: function(targetClass) {
    var all = this.getStudents();
    if (!targetClass || targetClass === "All") return all;
    return all.filter(function(s) {
      return matchClass(s.className || s.class, targetClass);
    });
  },

  // 3. GET ALL MARKS
  getMarks: function() {
    try {
      return JSON.parse(localStorage.getItem("ak_school_marks") || "[]");
    } catch(e) {
      return [];
    }
  },

  // 4. GET MARKS BY CLASS & TERM
  getMarksByClass: function(targetClass, term) {
    var all = this.getMarks();
    return all.filter(function(m) {
      var cMatch = matchClass(m.className || m.class, targetClass);
      var tMatch = term ? (String(m.term).toLowerCase() === String(term).toLowerCase()) : true;
      return cMatch && tMatch;
    });
  },

  // 5. UPDATE SINGLE STUDENT RECORD
  updateStudent: function(studentObj) {
    var list = this.getStudents();
    var idx = list.findIndex(function(s) {
      return String(s.id || s.regNo) === String(studentObj.id || studentObj.regNo);
    });
    if (idx !== -1) {
      list[idx] = Object.assign({}, list[idx], studentObj);
    } else {
      list.push(studentObj);
    }
    localStorage.setItem("ak_school_students", JSON.stringify(list));
  },

  // 6. SAVE STUDENT MARKS
  saveMarks: function(marksRecord) {
    var marksList = this.getMarks();
    var idx = marksList.findIndex(function(m) {
      return String(m.studentId) === String(marksRecord.studentId) && String(m.term) === String(marksRecord.term);
    });
    if (idx !== -1) {
      marksList[idx] = Object.assign({}, marksList[idx], marksRecord);
    } else {
      marksList.push(marksRecord);
    }
    localStorage.setItem("ak_school_marks", JSON.stringify(marksList));

    // Cloud Sync
    if (CLOUD_SYNC_URL) {
      try {
        fetch(CLOUD_SYNC_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "saveMarks", marks: marksRecord })
        });
      } catch(e) {}
    }
  },

  // 7. FETCH ALL DATA FROM CLOUD SHEET
  syncFromCloud: async function() {
    if (!CLOUD_SYNC_URL) return;

    // Fetch Students
    try {
      var res = await fetch(CLOUD_SYNC_URL + "?action=getStudents");
      var json = await res.json();
      if (json && json.data && Array.isArray(json.data)) {
        localStorage.setItem("ak_school_students", JSON.stringify(json.data));
        console.log("Fetched Students from Cloud Sheet: " + json.data.length);
      }
    } catch(err) {
      console.warn("Could not fetch students from Cloud:", err);
    }

    // Fetch Marks
    try {
      var resMarks = await fetch(CLOUD_SYNC_URL + "?action=getMarks");
      var jsonMarks = await resMarks.json();
      if (jsonMarks && jsonMarks.data && Array.isArray(jsonMarks.data)) {
        localStorage.setItem("ak_school_marks", JSON.stringify(jsonMarks.data));
        console.log("Fetched Marks from Cloud Sheet: " + jsonMarks.data.length);
      }
    } catch(err) {
      console.warn("Could not fetch marks from Cloud:", err);
    }
  }
};

// Immediate background fetch
schoolDB.syncFromCloud();

// Dono casing support karega: schoolDB aur SchoolDB
window.schoolDB = schoolDB;
window.SchoolDB = schoolDB;
