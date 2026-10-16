// ==========================================================
// YOUTUBE VIDEO PPTX EXPORTER FOR AK LEARNING POINT
// File: js/quiz-pptx-exporter.js (Zero-Conflict Plug & Play)
// ==========================================================

function generateYouTubeQuizPPT(quizTitle, questionsList) {
  if (typeof PptxGenJS === "undefined") {
    alert("PPT Generator library load nahi hui hai! Kripya internet connection check karein.");
    return;
  }

  if (!questionsList || !Array.isArray(questionsList) || questionsList.length === 0) {
    alert("Export karne ke liye koi questions nahi mile!");
    return;
  }

  var pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // YouTube Standard 1920x1080 Aspect Ratio

  var cleanTitle = (quizTitle || "AK_Learning_Quiz").replace(/[^a-zA-Z0-9_\-]/g, "_");

  // Title Slide for YouTube Intro
  var titleSlide = pptx.addSlide();
  titleSlide.background = { color: '0F172A' }; // Dark Slate Navy

  titleSlide.addText("AK LEARNING POINT COACHING", {
    x: 0.8, y: 1.5, w: 11.7, h: 0.8,
    fontSize: 28, color: 'D4AF37', bold: true, align: 'center'
  });

  titleSlide.addText(quizTitle || "Objective Practice Set", {
    x: 0.8, y: 2.5, w: 11.7, h: 1.2,
    fontSize: 36, color: 'FFFFFF', bold: true, align: 'center'
  });

  titleSlide.addText("Complete Chapter MCQs • Fast Revision & Explanation", {
    x: 0.8, y: 4.0, w: 11.7, h: 0.6,
    fontSize: 18, color: '94A3B8', align: 'center'
  });

  // Loop through questions
  questionsList.forEach(function(q, idx) {
    var qNum = idx + 1;
    var questionText = q.question || q.q || "Question text unavailable";
    var optA = q.optionA || q.a || (q.options ? q.options[0] : "");
    var optB = q.optionB || q.b || (q.options ? q.options[1] : "");
    var optC = q.optionC || q.c || (q.options ? q.options[2] : "");
    var optD = q.optionD || q.d || (q.options ? q.options[3] : "");
    var correct = String(q.correctOption || q.answer || q.correct || "A").trim().toUpperCase();
    var explanation = q.explanation || q.solution || q.note || "";

    // -------------------------------------------------------------------
    // SLIDE 1: QUESTION + OPTIONS (For YouTube Recording & Countdown)
    // -------------------------------------------------------------------
    var s1 = pptx.addSlide();
    s1.background = { color: '0F172A' };

    // Top Brand Ribbon
    s1.addText("AK LEARNING POINT • " + (quizTitle || "SPECIAL QUIZ"), {
      x: 0.6, y: 0.3, w: 9.0, h: 0.4,
      fontSize: 13, color: 'D4AF37', bold: true
    });
    s1.addText("⏱️ 10 SECONDS", {
      x: 10.0, y: 0.3, w: 2.7, h: 0.4,
      fontSize: 12, color: 'F59E0B', bold: true, align: 'right'
    });

    // Question Box
    s1.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.85, w: 12.1, h: 1.7,
      fontSize: 21, color: 'FFFFFF', bold: true,
      fill: { color: '1E293B' }, align: 'left', valign: 'middle',
      margin: 10
    });

    // 4 Options (A, B on Top Row, C, D on Bottom Row)
    s1.addText("(A) " + optA, { x: 0.6, y: 2.8, w: 5.9, h: 1.0, fontSize: 17, color: 'FFFFFF', fill: { color: '334155' }, margin: 8 });
    s1.addText("(B) " + optB, { x: 6.8, y: 2.8, w: 5.9, h: 1.0, fontSize: 17, color: 'FFFFFF', fill: { color: '334155' }, margin: 8 });
    s1.addText("(C) " + optC, { x: 0.6, y: 4.1, w: 5.9, h: 1.0, fontSize: 17, color: 'FFFFFF', fill: { color: '334155' }, margin: 8 });
    s1.addText("(D) " + optD, { x: 6.8, y: 4.1, w: 5.9, h: 1.0, fontSize: 17, color: 'FFFFFF', fill: { color: '334155' }, margin: 8 });

    // -------------------------------------------------------------------
    // SLIDE 2: CORRECT ANSWER REVEAL & EXPLANATION (For Teacher Solution)
    // -------------------------------------------------------------------
    var s2 = pptx.addSlide();
    s2.background = { color: '0F172A' };

    s2.addText("QUESTION " + qNum + " • ANSWER REVEAL", {
      x: 0.6, y: 0.3, w: 12.1, h: 0.4,
      fontSize: 13, color: '22C55E', bold: true
    });

    // Question mini bar
    s2.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.8, w: 12.1, h: 1.1,
      fontSize: 17, color: '94A3B8', fill: { color: '1E293B' }, margin: 8
    });

    // Correct Answer Card
    var correctText = (correct === "A" ? optA : correct === "B" ? optB : correct === "C" ? optC : optD);
    s2.addText("✅ CORRECT ANSWER: (" + correct + ") " + correctText, {
      x: 0.6, y: 2.1, w: 12.1, h: 1.1,
      fontSize: 22, color: 'FFFFFF', bold: true, fill: { color: '166534' }, margin: 10
    });

    // Solution Concept
    var explanationText = explanation ? ("💡 Concept / Solution:\n" + explanation) : "💡 Concept: Remember this fundamental definition for upcoming Board/School exams.";
    s2.addText(explanationText, {
      x: 0.6, y: 3.4, w: 12.1, h: 2.0,
      fontSize: 16, color: 'F1F5F9', fill: { color: '1E293B' }, margin: 10
    });
  });

  // Outro Slide
  var endSlide = pptx.addSlide();
  endSlide.background = { color: '0F172A' };
  endSlide.addText("Thanks For Watching!", { x: 0.8, y: 2.0, w: 11.7, h: 1.0, fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' });
  endSlide.addText("Like • Share • Subscribe to AK Learning Point", { x: 0.8, y: 3.2, w: 11.7, h: 0.8, fontSize: 20, color: 'D4AF37', bold: true, align: 'center' });

  // Trigger Instant Download
  pptx.writeFile({ fileName: cleanTitle + "_YouTube_16x9.pptx" });
}
