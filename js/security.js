// Production-Grade Malpractice Shield with Grace Period & Warning Buffer

const SecurityShield = {
  isActive: false,
  isReady: false,
  warningCount: 0,
  maxWarnings: 1, // 1 warning milegi, dusri baar me submit hoga

  activate(onViolationCallback) {
    this.isActive = true;
    this.isReady = false;
    this.warningCount = 0;

    // 1. Force Fullscreen
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

    // 2. Strict CSS Lockout (No text selection, no copy)
    document.documentElement.style.userSelect = "none";
    document.documentElement.style.webkitUserSelect = "none";
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    // 3. Block Context Menu & Copy Paste
    document.addEventListener("contextmenu", this.blockAction, true);
    document.addEventListener("copy", this.blockAction, true);
    document.addEventListener("cut", this.blockAction, true);
    document.addEventListener("paste", this.blockAction, true);
    document.addEventListener("selectstart", this.blockAction, true);
    window.addEventListener("keydown", this.handleKeyBlock, true);

    // 4. Grace Period: Pehle 4 second tak koi switch detection trigger nahi hoga
    // (Taaki keyboard dismiss aur fullscreen prompt settle ho jaye)
    setTimeout(() => {
      if (this.isActive) {
        this.isReady = true;
      }
    }, 4000);

    // 5. Tab Switch & Minimize Detection (Only after Grace Period)
    window.addEventListener("blur", () => {
      this.handleThreat("Screen switch ya tab switch detect hua hai!", onViolationCallback);
    }, true);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.handleThreat("Tab switch ya app minimize detect hua hai!", onViolationCallback);
      }
    }, true);
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

  handleThreat(reason, callback) {
    // Agar test start hue 4 second nahi hue hain, toh ignore karein
    if (!this.isActive || !this.isReady) return;

    this.warningCount++;
    if (this.warningCount <= this.maxWarnings) {
      alert("⚠️ WARNING (" + this.warningCount + "/2): " + reason + "\nDubara switch karne par test auto-submit ho jayega!");
    } else {
      this.isActive = false;
      alert("🚨 TEST TERMINATED: Baar-baar switch karne ki wajah se aapka test submit kiya ja raha hai.");
      if (callback) callback();
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

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
};
