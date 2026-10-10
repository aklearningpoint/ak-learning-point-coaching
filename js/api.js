// AK Learning Point Coaching - API & Storage Engine

// APNA NAYA GOOGLE APPS SCRIPT WEB APP URL YAHAIN PASTE KIJIYE
const API_URL = "https://script.google.com/macros/s/AKfycbxgTvxwNwAPetNnU7Ccoa6oq2cP9k67l_yu3gewEVd8bR4dvTqsj1FRcGZgcaOKdG86/exec";

const API = {
  // GET Request (Fetch Quizzes, Results, Leaderboards)
  async get(action, params = {}) {
    try {
      const url = new URL(API_URL);
      url.searchParams.append("action", action);
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });

      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors"
      });

      if (!response.ok) throw new Error("Network response not ok");
      return await response.json();
    } catch (err) {
      console.warn("API GET failed or offline, falling back to local storage:", err);
      return this.getLocalFallback(action, params);
    }
  },

  // POST Request (Save Quizzes, Attempts, Student Data)
  async post(action, payload = {}) {
    // 1. Instant Local Persistence (Zero-delay UI guarantee)
    this.saveLocalFallback(action, payload);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // Google Apps Script Web App direct integration
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action, ...payload })
      });
      return { status: "success", synced: true };
    } catch (err) {
      console.warn("API POST background sync error:", err);
      return { status: "success", synced: false };
    }
  },

  // Local Storage Fallback Engine
  getLocalFallback(action, params) {
    if (action === "getQuizzes") {
      let quizzes = JSON.parse(localStorage.getItem("ak_teacher_quizzes") || "[]");
      if (params.board && params.className && params.subject) {
        quizzes = quizzes.filter(q => 
          (!q.board || q.board.toLowerCase() === params.board.toLowerCase()) &&
          (!q.className || q.className.toLowerCase() === params.className.toLowerCase()) &&
          (!q.subject || q.subject.toLowerCase() === params.subject.toLowerCase())
        );
      } else if (params.rewardingOnly === "true") {
        quizzes = quizzes.filter(q => q.isRewarding);
      }
      return { status: "success", data: quizzes };
    }

    if (action === "getStudentResults") {
      const attempts = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
      const filtered = attempts.filter(a => String(a.mobile).trim() === String(params.mobile).trim());
      return { status: "success", data: filtered };
    }

    if (action === "getLeaderboard") {
      const attempts = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
      const filtered = attempts.filter(a => a.quizId === params.quizId);
      return { status: "success", data: filtered };
    }

    return { status: "success", data: [] };
  },

  saveLocalFallback(action, payload) {
    try {
      if (action === "saveQuiz") {
        let quizzes = JSON.parse(localStorage.getItem("ak_teacher_quizzes") || "[]");
        quizzes.unshift(payload);
        localStorage.setItem("ak_teacher_quizzes", JSON.stringify(quizzes));
      } else if (action === "submitQuizAttempt") {
        let attempts = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
        attempts.unshift(payload);
        localStorage.setItem("ak_student_attempts", JSON.stringify(attempts));
      }
    } catch (e) {
      console.warn("localStorage quota exceeded or disabled", e);
    }
  }
};
