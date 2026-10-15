// ==========================================
// SCHOOL DATABASE & CLOUD SYNC ENGINE
// File: js/school-db.js
// ==========================================

// APNA STEP 1 WALA WEB APP URL YAHAN PASTE KAREIN
var CLOUD_SYNC_URL = "https://script.google.com/macros/s/AKfycbwRDQuXVyKGKfCI-kifRPb-vzb8Uv2AIv7YzMSihcP5iKPlR9BJj-DVSSDp8q_VWTij/exec";

// Smart Class Normalizer: '5', 'Class 5', 'Class-5', 'Nur & Play' sabko match karega
function normalizeClassKey(cls) {
  return String(cls || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isMatchingClass(a, b) {
  var k1 = normalizeClassKey(a);
  var k2 = normalizeClassKey(b);
  if (!k1 || !k2) return false;
  if (k1 === k2 || k1 === ("class" + k2) || ("class" + k1) === k2) return true;
  if ((k1.includes("nur") || k1.includes("play")) && (k2.includes("nur") || k2.includes("play"))) return true;
  return false;
}

var SchoolDB = {
  // Fix for dashboard-app.js crash
  ADS_PPT: [
    { title: "Admissions Open", desc: "Welcome to Assent Public School Session 2026-2027. Admissions are open!", img: "" }
  ],
  CONFIG: {
    ADS_PPT: [
      { title: "Admissions Open", desc: "Welcome to Assent Public School Session 2026-2027. Admissions are open!", img: "" }
    ]
  },

  getStudents: function() {
    try {
      return JSON.parse(localStorage.getItem("ak_school_students") || "[]");
    } catch(e) {
      return [];
    }
  },

  getStudentsByClass: function(cls) {
    var list = this.getStudents();
    if (!cls || cls === "All") return list;
    return list.filter(function(s) {
      return isMatchingClass(s.className || s.class, cls);
    });
  },

  getMarks: function() {
    try {
      return JSON.parse(localStorage.getItem("ak_school_marks") || "[]");
    } catch(e) {
      return [];
    }
  },

  getMarksByClass: function(cls, term) {
    var marks = this.getMarks();
    return marks.filter(function(m) {
      var cOk = isMatchingClass(m.className || m.class, cls);
      var tOk = term ? (String(m.term).toLowerCase() === String(term).toLowerCase()) : true;
      return cOk && tOk;
    });
  },

  updateStudent: function(stu) {
    var list = this.getStudents();
    var idx = list.findIndex(function(x) {
      return String(x.id || x.regNo) === String(stu.id || stu.regNo);
    });
    if (idx !== -1) {
      list[idx] = Object.assign({}, list[idx], stu);
    } else {
      list.push(stu);
    }
    localStorage.setItem("ak_school_students", JSON.stringify(list));

    if (CLOUD_SYNC_URL) {
      try {
        fetch(CLOUD_SYNC_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStudentDetails", student: stu })
        });
      } catch(e) {}
    }
  },

  syncFromCloud: async function() {
    if (!CLOUD_SYNC_URL) return;

    // 1. Fetch Students
    try {
      var res = await fetch(CLOUD_SYNC_URL + "?action=getStudents");
      var json = await res.json();
      if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem("ak_school_students", JSON.stringify(json.data));
        console.log("Fetched Students from Cloud Sheet: " + json.data.length);
      }
    } catch(err) {
      console.warn("Students fetch issue:", err);
    }

    // 2. Fetch Marks
    try {
      var mRes = await fetch(CLOUD_SYNC_URL + "?action=getMarks");
      var mJson = await mRes.json();
      if (mJson && mJson.data && Array.isArray(mJson.data) && mJson.data.length > 0) {
        localStorage.setItem("ak_school_marks", JSON.stringify(mJson.data));
        console.log("Fetched Marks from Cloud Sheet: " + mJson.data.length);
      }
    } catch(err) {
      console.warn("Marks fetch issue:", err);
    }
  }
};

window.SchoolDB = SchoolDB;
window.schoolDB = SchoolDB;
SchoolDB.syncFromCloud();
