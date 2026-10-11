// Central School Database Socket & Storage Engine
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
  }
};
