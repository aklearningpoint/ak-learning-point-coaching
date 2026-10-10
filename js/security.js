// Anti-Cheat & Fullscreen Protection Guard for AK Learning Point Coaching

const SecurityShield = {
  isActive: false,

  activate(onViolationCallback) {
    this.isActive = true;

    // 1. Fullscreen Activation
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }

    // 2. Disable Text Selection, Copy, Cut & Right-Click
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.addEventListener("contextmenu", this.blockAction);
    document.addEventListener("copy", this.blockAction);
    document.addEventListener("cut", this.blockAction);

    // 3. DevTools & Key Block (F12, Ctrl+U, PrintScreen, Ctrl+Shift+I)
    window.addEventListener("keydown", (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "u") ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        return false;
      }
    });

    // 4. Tab Switch & Screen Blur Auto-Submit Trigger
    window.addEventListener("blur", () => {
      if (this.isActive && onViolationCallback) {
        alert("Alert: Window switch ya screen minimize detect hua hai! Test auto-submit kiya ja raha hai.");
        onViolationCallback();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.isActive && onViolationCallback) {
        alert("Alert: Tab switch karne ke karan test submit kiya ja raha hai!");
        onViolationCallback();
      }
    });
  },

  blockAction(e) {
    e.preventDefault();
    return false;
  },

  deactivate() {
    this.isActive = false;
    document.body.style.userSelect = "auto";
    document.body.style.webkitUserSelect = "auto";
    document.removeEventListener("contextmenu", this.blockAction);
    document.removeEventListener("copy", this.blockAction);
    document.removeEventListener("cut", this.blockAction);

    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
};
