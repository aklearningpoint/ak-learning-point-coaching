// Dashboard & Public School Wall Engine
window.addEventListener("DOMContentLoaded", () => {
  loadLiveAdsAndNotices();
  loadRespectedTeachers();
  loadStudyVideos();
});

// 1. Live Ads & Marquee
function loadLiveAdsAndNotices() {
  const adsData = SchoolDB.get(SchoolDB.KEYS.ADS_PPT, null);
  const marqueeText = document.getElementById("liveNoticeText");
  if (adsData && adsData.marquee && marqueeText) {
    marqueeText.innerText = adsData.marquee;
  }
}

// 2. Respected Teachers Public Directory
function loadRespectedTeachers() {
  const container = document.getElementById("teacherCardsContainer");
  if (!container) return;

  const teachers = SchoolDB.get(SchoolDB.KEYS.TEACHERS, [
    {
      name: "M. K. Aryan",
      designation: "Director & Senior Faculty",
      classes: "Classes 1 to 5",
      subject: "Mathematics & Guidance",
      photo: "assets/avatar.png"
    },
    {
      name: "S. K. Singh",
      designation: "Principal",
      classes: "All Classes",
      subject: "Science & Administration",
      photo: "assets/avatar.png"
    }
  ]);

  container.innerHTML = "";
  teachers.forEach(t => {
    container.innerHTML += `
      <div class="teacher-public-card">
        <div class="teacher-details-left">
          <h3 class="teacher-name-bold">${t.name}</h3>
          <p class="teacher-desig-sub">${t.designation || 'Faculty'}</p>
          <div class="teacher-info-pills">
            <span><b>Class:</b> ${t.classes || 'All'}</span>
            <span><b>Subject:</b> ${t.subject || 'All Subjects'}</span>
          </div>
        </div>
        <div class="teacher-photo-right">
          <img src="${t.photo || 'assets/avatar.png'}" alt="${t.name}">
        </div>
      </div>
    `;
  });
}

// 3. YouTube Concept Videos Hub
function loadStudyVideos() {
  const container = document.getElementById("videoFeedContainer");
  if (!container) return;

  const videos = SchoolDB.get(SchoolDB.KEYS.STUDY_VIDEOS, [
    { title: "Solar System & Planets - Class 3-5", group: "Class 3-5", videoId: "libKVRa01L8" },
    { title: "English Alphabet & Phonetics", group: "Nur & Play", videoId: "hq3yfQnllfQ" }
  ]);

  container.innerHTML = "";
  videos.forEach(v => {
    let embedUrl = v.videoId.includes("http") ? v.videoId : `https://www.youtube.com/embed/${v.videoId}`;
    container.innerHTML += `
      <div class="video-card">
        <div class="video-frame">
          <iframe src="${embedUrl}" title="${v.title}" frameborder="0" allowfullscreen></iframe>
        </div>
        <div class="video-meta">
          <h4>${v.title}</h4>
          <span class="badge-group">${v.group}</span>
        </div>
      </div>
    `;
  });
}
