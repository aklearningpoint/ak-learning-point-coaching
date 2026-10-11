// Strict Malpractice Shield & Fullscreen Lock Guard

const SecurityShield = {
  isActive: false,
  violationTriggered: false,

  activate(onViolationCallback) {
    this.isActive = true;
    this.violationTriggered = false;

    // 1. Force Fullscreen on document body/element
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.warn("Fullscreen blocked:", err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }

    // 2. Strict CSS Lockout (Zero text selection, no copy, no dragging)
    document.documentElement.style.userSelect = "none";
    document.documentElement.style.webkitUserSelect = "none";
    document.documentElement.style.webkitTouchCallout = "none";
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    // 3. Block Context Menu, Drag & Copy/Paste
    document.addEventListener("contextmenu", this.blockAction, true);
    document.addEventListener("copy", this.blockAction, true);
    document.addEventListener("cut", this.blockAction, true);
    document.addEventListener("paste", this.blockAction, true);
    document.addEventListener("selectstart", this.blockAction, true);
    document.addEventListener("dragstart", this.blockAction, true);

    // 4. Keyboard Shortcuts Block (F12, DevTools, Ctrl+U, PrintScreen, Alt+Tab traps)
    window.addEventListener("keydown", this.handleKeyBlock, true);

    // 5. Screen Switch & Tab Change Trap (Blur + Visibility Change)
    window.addEventListener("blur", () => {
      this.triggerViolation("Window switch ya tab switch detect hua hai!", onViolationCallback);
    }, true);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.triggerViolation("Tab switch ya screen minimize detect hui hai!", onViolationCallback);
      }
    }, true);

    // 6. Fullscreen Exit Detection (Agar student Esc dabakar fullscreen se nikle)
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && this.isActive) {
        this.triggerViolation("Fullscreen band karne par test auto-submit kiya ja raha hai!", onViolationCallback);
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
      (e.ctrlKey && (e.key === "c" || e.key === "C")) ||
      (e.ctrlKey && (e.key === "v" || e.key === "V")) ||
      (e.ctrlKey && (e.key === "a" || e.key === "A")) ||
      e.key === "PrintScreen"
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  },

  triggerViolation(message, callback) {
    if (this.isActive && !this.violationTriggered) {
      this.violationTriggered = true;
      alert("⚠️ MALPRACTICE ALERT: " + message);
      if (callback) callback();
    }
  },

  deactivate() {
    this.isActive = false;
    this.violationTriggered = false;

    // Reset styles
    document.documentElement.style.userSelect = "auto";
    document.documentElement.style.webkitUserSelect = "auto";
    document.documentElement.style.webkitTouchCallout = "default";
    document.body.style.userSelect = "auto";
    document.body.style.webkitUserSelect = "auto";

    // Remove listeners
    document.removeEventListener("contextmenu", this.blockAction, true);
    document.removeEventListener("copy", this.blockAction, true);
    document.removeEventListener("cut", this.blockAction, true);
    document.removeEventListener("paste", this.blockAction, true);
    document.removeEventListener("selectstart", this.blockAction, true);
    document.removeEventListener("dragstart", this.blockAction, true);
    window.removeEventListener("keydown", this.handleKeyBlock, true);

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
};
