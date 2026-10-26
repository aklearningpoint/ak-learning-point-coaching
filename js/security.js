// Production-Grade Malpractice Shield (Optimized for Mobile Gestures & Button Taps)

const SecurityShield = {
  isActive: false,
  isReady: false,
  warningCount: 0,
  maxWarnings: 1,
  violationCallback: null,
  lastActionTime: 0,

  activate(onViolationCallback) {
    this.isActive = true;
    this.isReady = false;
    this.warningCount = 0;
    this.violationCallback = onViolationCallback;
    this.lastActionTime = Date.now();

    // 1. Enter Fullscreen Mode
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen bypassed:", e);
    }

    // 2. Strict CSS Lockout (No text selection, no copy)
    document.documentElement.style.userSelect = "none";
    document.documentElement.style.webkitUserSelect = "none";
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    // 3. Block Context Menu, Selection & Copy-Paste Shortcuts
    document.addEventListener("contextmenu", this.blockAction, true);
    document.addEventListener("copy", this.blockAction, true);
    document.addEventListener("cut", this.blockAction, true);
    document.addEventListener("paste", this.blockAction, true);
    document.addEventListener("selectstart", this.blockAction, true);
    window.addEventListener("keydown", this.handleKeyBlock, true);

    // 4. Grace Period: 2.5 seconds warmup (Taaki Chrome ka "Swipe down to exit" bubble nikal jaye)
    setTimeout(() => {
      if (this.isActive) {
        this.isReady = true;
      }
    }, 2500);

    // 5. TRAP 1: Tab Switch, Minimize & AI Assistant (document.hidden check)
    this.visibilityHandler = () => {
      if (document.hidden && this.isActive && this.isReady) {
        this.handleThreat("Screen minimize ya doosri app open karne ki koshish ki gayi!");
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler, true);

    // 6. TRAP 2: App Switch & Background Departure
    this.pageHideHandler = () => {
      if (this.isActive && this.isReady) {
        this.handleThreat("Screen change ya browser background me bheja gaya!");
      }
    };
    window.addEventListener("pagehide", this.pageHideHandler, true);

    // 7. TRAP 3: Fullscreen Exit Trap (Student swipe karke bahar nikle toh)
    this.fullscreenHandler = () => {
      var isFS = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFS && this.isActive && this.isReady) {
        // Sirf tab trigger karein agar test chalu ho
        this.handleThreat("Fullscreen mode exit hua! Test secure window me hi dena aniwarya hai.");
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch (e) {}
      }
    };
    document.addEventListener("fullscreenchange", this.fullscreenHandler, true);
    document.addEventListener("webkitfullscreenchange", this.fullscreenHandler, true);
  },

  blockAction(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  handleKeyBlock(e) {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
      (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
      (e.ctrlKey && (e.key === "c" || e.key === "C"))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  },

  handleThreat(reason) {
    if (!this.isActive || !this.isReady) return;

    // Double-fire debounce (1.5 second ke andar do baar fire na ho)
    var now = Date.now();
    if (now - this.lastActionTime < 1500) return;
    this.lastActionTime = now;

    this.warningCount++;
    if (this.warningCount <= this.maxWarnings) {
      alert("⚠️ MALPRACTICE WARNING (1/1):\n" + reason + "\n\nAb agar aapne dubara screen change ki ya app minimize kiya, toh test TURANT AUTO-SUBMIT ho jayega!");
    } else {
      this.isActive = false;
      alert("🚨 TEST TERMINATED!\nExam rules violate karne ke karan aapka test auto-submit kiya ja raha hai.");
      if (this.violationCallback) {
        this.violationCallback();
      }
    }
  },

  deactivate() {
    this.isActive = false;
    this.isReady = false;
    this.warningCount = 0;

    document.documentElement.style.userSelect = "auto";
    document.documentElement.style.webkitUserSelect = "auto";
    document.body.style.userSelect = "auto";
    document.body.style.webkitUserSelect = "auto";

    document.removeEventListener("contextmenu", this.blockAction, true);
    document.removeEventListener("copy", this.blockAction, true);
    document.removeEventListener("cut", this.blockAction, true);
    document.removeEventListener("paste", this.blockAction, true);
    document.removeEventListener("selectstart", this.blockAction, true);
    window.removeEventListener("keydown", this.handleKeyBlock, true);

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler, true);
    }
    if (this.pageHideHandler) {
      window.removeEventListener("pagehide", this.pageHideHandler, true);
    }
    if (this.fullscreenHandler) {
      document.removeEventListener("fullscreenchange", this.fullscreenHandler, true);
      document.removeEventListener("webkitfullscreenchange", this.fullscreenHandler, true);
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
};
