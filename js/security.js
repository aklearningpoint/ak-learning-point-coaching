// Production-Grade Malpractice Shield (With AI Overlay & Home Gesture Trap)

const SecurityShield = {
  isActive: false,
  isReady: false,
  warningCount: 0,
  maxWarnings: 1,
  violationCallback: null,

  activate(onViolationCallback) {
    this.isActive = true;
    this.isReady = false;
    this.warningCount = 0;
    this.violationCallback = onViolationCallback;

    // 1. Enter Fullscreen Mode
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request bypassed:", e);
    }

    // 2. Strict CSS Lockout (No text selection, no copy, no drag)
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

    // 4. Quick 1-Second Warmup (Pehle 4s tha jo bypass ho jata tha)
    setTimeout(() => {
      if (this.isActive) {
        this.isReady = true;
      }
    }, 1200);

    // 5. TRAP 1: Tab Switch & App Minimize (visibilitychange)
    this.visibilityHandler = () => {
      if (document.hidden && this.isActive && this.isReady) {
        this.handleThreat("Tab switch ya app minimize detect hua hai!");
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler, true);

    // 6. TRAP 2: Fullscreen Exit Trap (Back gesture ya screen exit detect karega)
    this.fullscreenHandler = () => {
      var isFS = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFS && this.isActive && this.isReady) {
        this.handleThreat("Fullscreen mode band kiya gaya! Test secure window me hi dena aniwarya hai.");
        // Try re-entering fullscreen immediately
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch (e) {}
      }
    };
    document.addEventListener("fullscreenchange", this.fullscreenHandler, true);
    document.addEventListener("webkitfullscreenchange", this.fullscreenHandler, true);

    // 7. TRAP 3: AI Assistant / Overlay / Home Gesture Trap (Smart Blur)
    this.blurHandler = (e) => {
      // Agar focus document ke kisi valid button ya radio par gaya hai toh ignore karein
      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "BUTTON")) {
        return;
      }
      if (this.isActive && this.isReady) {
        this.handleThreat("Screen focus lose hua! (AI Assistant, Split-Screen ya Floating Window detect hui)");
      }
    };
    window.addEventListener("blur", this.blurHandler, true);

    // 8. TRAP 4: Mobile Pagehide / App Switch
    this.pageHideHandler = () => {
      if (this.isActive && this.isReady) {
        this.handleThreat("Screen change ya browser background me bheja gaya!");
      }
    };
    window.addEventListener("pagehide", this.pageHideHandler, true);
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

    this.warningCount++;
    if (this.warningCount <= this.maxWarnings) {
      alert("⚠️ MALPRACTICE WARNING (1/1):\n" + reason + "\n\nAb agar aapne dubara Home button dabaya, AI on kiya ya screen switch ki, toh test TURANT AUTO-SUBMIT ho jayega!");
    } else {
      this.isActive = false;
      alert("🚨 TEST TERMINATED!\nCheating/Malpractice rules violate karne ke karan aapka test yahin freeze karke submit kiya ja raha hai.");
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
    if (this.fullscreenHandler) {
      document.removeEventListener("fullscreenchange", this.fullscreenHandler, true);
      document.removeEventListener("webkitfullscreenchange", this.fullscreenHandler, true);
    }
    if (this.blurHandler) {
      window.removeEventListener("blur", this.blurHandler, true);
    }
    if (this.pageHideHandler) {
      window.removeEventListener("pagehide", this.pageHideHandler, true);
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
};
