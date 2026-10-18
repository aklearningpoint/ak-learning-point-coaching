// AK Learning Point Coaching - API & Storage Engine (Mobile-Robust & Dual-Sync)

// Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbxgTvxwNwAPetNnU7Ccoa6oq2cP9k67l_yu3gewEVd8bR4dvTqsj1FRcGZgcaOKdG86/exec";

const API = {
  // GET Request (Fetch Quizzes, Results, Leaderboards)
  async get(action, params = {}) {
    try {
      // Clean query string builder (Supports older Android webviews)
      var queryParts = ["action=" + encodeURIComponent(action)];
      Object.keys(params).forEach(function(key) {
        if (params[key] !== undefined && params[key] !== null) {
          queryParts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
        }
      });
      var finalUrl = API_URL + (API_URL.indexOf("?") === -1 ? "?" : "&") + queryParts.join("&");

      var response = await fetch(finalUrl, {
        method: "GET",
        mode: "cors",
        cache: "no-cache"
      });

      if (!response.ok) throw new Error("Network response not ok: " + response.status);
      var result = await response.json();
      return result;
    } catch (err) {
      console.warn("API GET failed or offline, falling back to local storage:", err);
      return this.getLocalFallback(action, params);
    }
  },

  // POST Request (Save Quizzes, Student Attempts - Mobile & Sheet Safe)
  async post(action, payload = {}) {
    try {
      var bodyData = JSON.stringify({ action: action, ...payload });

      // Note: text/plain avoids browser preflight OPTIONS drop on mobile
      var response = await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: bodyData
      });

      // Successful network dispatch
      return { status: "success", synced: true };
    } catch (err) {
      console.warn("API POST background sync error:", err);
      // Fail-safe local backup
      this.saveLocalEmergencyFallback(action, payload);
      return { status: "success", synced: false, error: err.message };
    }
  },

  // Local Storage Fallback Engine
  getLocalFallback(action, params) {
    if (action === "getQuizzes" || action === "getAllQuizzes" || action === "getLiveQuizzes") {
      var quizzes = [];
      try {
        quizzes = JSON.parse(localStorage.getItem("ak_teacher_quizzes") || localStorage.getItem("ak_quizzes_cache") || "[]");
      } catch (e) { quizzes = []; }

      if (params.board && params.className && params.subject) {
        quizzes = quizzes.filter(function(q) {
          var b = String(q.board || "").trim().toLowerCase();
          var c = String(q.className || q.class_tag || "").trim().toLowerCase();
          var s = String(q.subject || "").trim().toLowerCase();
          return (!b || b === String(params.board).trim().toLowerCase()) &&
                 (!c || c === String(params.className).trim().toLowerCase()) &&
                 (!s || s === String(params.subject).trim().toLowerCase());
        });
      } else if (params.rewardingOnly === "true") {
        quizzes = quizzes.filter(function(q) { return !!q.isRewarding; });
      }
      return { status: "success", data: quizzes };
    }

    if (action === "getStudentResults") {
      var attempts = [];
      try {
        attempts = JSON.parse(localStorage.getItem("ak_student_attempts") || localStorage.getItem("ak_quiz_results") || "[]");
      } catch (e) { attempts = []; }

      var filtered = attempts.filter(function(a) {
        return String(a.mobile || "").trim() === String(params.mobile || "").trim();
      });
      return { status: "success", data: filtered };
    }

    if (action === "getLeaderboard") {
      var lAttempts = [];
      try {
        lAttempts = JSON.parse(localStorage.getItem("ak_student_attempts") || localStorage.getItem("ak_quiz_results") || "[]");
      } catch (e) { lAttempts = []; }

      var lFiltered = lAttempts.filter(function(a) {
        return String(a.quizId).trim() === String(params.quizId).trim();
      });
      return { status: "success", data: lFiltered };
    }

    return { status: "success", data: [] };
  },

  // Emergency Backup if network drops completely
  saveLocalEmergencyFallback(action, payload) {
    try {
      if (action === "saveQuiz") {
        var quizzes = JSON.parse(localStorage.getItem("ak_teacher_quizzes") || "[]");
        quizzes.unshift(payload);
        localStorage.setItem("ak_teacher_quizzes", JSON.stringify(quizzes));
      } else if (action === "submitQuizAttempt") {
        var attempts = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
        var exists = attempts.some(function(a) {
          return String(a.attemptId) === String(payload.attemptId);
        });
        if (!exists) {
          attempts.unshift(payload);
          localStorage.setItem("ak_student_attempts", JSON.stringify(attempts));
        }
      }
    } catch (e) {
      console.warn("Storage emergency write failed:", e);
    }
  }
};
