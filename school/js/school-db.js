// Central School Database Socket & Storage Engine with Cloud Sheet Sync
const CLOUD_SYNC_URL = "APNA_DEPLOYED_WEB_APP_URL_YAHAN_PASTE_KAREIN";

const SchoolDB = {
  KEYS: {
    CONFIG: "sch_config",
    STUDENTS: "sch_students",
    TEACHERS: "sch_teachers",
    EXAM_PLANS: "sch_exam_plans",
    MARKS: "sch_marks",
    RESULTS_PUBLISHED: "sch_published_terms",
    ADS_PPT: "sch_ads_ppt",
    STUDY_VIDEOS: "sch_study_videos",
    STUDY_MATERIALS: "sch_study_materials"
  },

  get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage error:", e);
    }

    // Auto-Sync Hook: Agar Students list update hui toh Google Sheet me push karein
    if (key === this.KEYS.STUDENTS && CLOUD_SYNC_URL && !CLOUD_SYNC_URL.includes("APNA_DEPLOYED")) {
      this.pushToGoogleSheet("Students", val);
    }
  },

  // Sibling Discovery Engine by Register Number
  getStudentsByRegisterNo(regNo) {
    const list = this.get(this.KEYS.STUDENTS, []);
    return list.filter(s => String(s.regNo).trim() === String(regNo).trim() && s.status !== "BLOCKED");
  },

  // Auto-Roll Allocation for Locked Class
  getNextRoll(className) {
    const list = this.get(this.KEYS.STUDENTS, []);
    const activeClassStudents = list.filter(s => s.className === className && s.status !== "BLOCKED");
    return activeClassStudents.length + 1;
  },

  // Soft Delete & Automatic Roll Re-Indexing
  softDeleteAndReindex(studentId, className) {
    let list = this.get(this.KEYS.STUDENTS, []);
    const idx = list.findIndex(s => s.id === studentId);
    if (idx !== -1) {
      list[idx].status = "BLOCKED";
      
      // Active students in this class re-index
      let currentRoll = 1;
      list.forEach(s => {
        if (s.className === className && s.status !== "BLOCKED") {
          s.rollNo = currentRoll++;
        }
      });
      this.set(this.KEYS.STUDENTS, list);
    }
  },

  // --- CLOUD SHEET INTEGRATION ENGINE ---

  // Google Sheet me data bhejna (Auto columns mapping)
  async pushToGoogleSheet(tabName, dataList) {
    if (!Array.isArray(dataList)) return;
    try {
      await fetch(CLOUD_SYNC_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabName: tabName,
          data: dataList
        })
      });
      console.log("Auto-synced " + tabName + " to Google Sheet.");
    } catch (err) {
      console.error("Cloud push failed:", err);
    }
  },

  // Google Sheet se data laana (Cross-device persistence)
  async pullFromGoogleSheet(tabName, localKey) {
    if (!CLOUD_SYNC_URL || CLOUD_SYNC_URL.includes("APNA_DEPLOYED")) return;
    try {
      const res = await fetch(CLOUD_SYNC_URL + "?tabName=" + encodeURIComponent(tabName));
      const result = await res.json();
      if (result && result.success && result.data && result.data.length > 0) {
        localStorage.setItem(localKey, JSON.stringify(result.data));
        console.log("Fetched " + tabName + " from Cloud Sheet:", result.data.length);
      }
    } catch (err) {
      console.warn("Cloud pull failed:", err);
    }
  }
};

// Page load hone par Google Sheet se sync check
window.addEventListener("DOMContentLoaded", function () {
  SchoolDB.pullFromGoogleSheet("Students", SchoolDB.KEYS.STUDENTS);
});
