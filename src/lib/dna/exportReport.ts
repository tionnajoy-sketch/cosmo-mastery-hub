/* ─── DNA Progress Report PDF Export ─── */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MILESTONES } from "./milestones";

export interface ExportEvent {
  created_at: string;
  field: string;
  from_value: string;
  to_value: string;
  delta: number | null;
  note: string;
  lesson_context: { term_title?: string | null; step_label?: string | null } | null;
}

export interface ExportArgs {
  studentName: string;
  dnaCode: string;
  engagement: number;
  retention: number;
  confidence: number;
  events: ExportEvent[];
  unlockedMilestoneKeys: string[];
}

export function exportDNAReport({
  studentName,
  dnaCode,
  engagement,
  retention,
  confidence,
  events,
  unlockedMilestoneKeys,
}: ExportArgs): void {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString();

  // Header
  doc.setFillColor(38, 22, 75);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("My Learning DNA Progress Report", 14, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${studentName || "Student"}  •  ${today}`, 14, 21);

  // DNA Code block
  doc.setTextColor(20, 20, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Current DNA Code", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.text(dnaCode || "----", 14, 50);

  // Metrics
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Live Metrics", 14, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Engagement:  ${Math.round(engagement)} / 100`, 14, 72);
  doc.text(`Retention:   ${Math.round(retention)} / 100`, 14, 78);
  doc.text(`Confidence:  ${Math.round(confidence)} / 100`, 14, 84);

  // Milestones
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Milestones Unlocked", 14, 96);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const unlocked = MILESTONES.filter((m) => unlockedMilestoneKeys.includes(m.key));
  if (unlocked.length === 0) {
    doc.text("No milestones unlocked yet — keep learning!", 14, 104);
  } else {
    unlocked.forEach((m, i) => {
      doc.text(`• ${m.title} — ${m.description}`, 14, 104 + i * 6);
    });
  }

  const startY = 112 + Math.max(unlocked.length, 1) * 6;

  // Events table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DNA Change History", 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [["Date", "Metric", "Change", "Lesson", "Note"]],
    body: events.map((e) => [
      new Date(e.created_at).toLocaleDateString(),
      e.field.charAt(0).toUpperCase() + e.field.slice(1),
      e.delta !== null
        ? `${e.from_value} → ${e.to_value} (${e.delta > 0 ? "+" : ""}${e.delta})`
        : `${e.from_value} → ${e.to_value}`,
      [e.lesson_context?.term_title, e.lesson_context?.step_label].filter(Boolean).join(" • ") || "—",
      e.note || "",
    ]),
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [38, 22, 75], textColor: 255 },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 38 }, 3: { cellWidth: 42 }, 4: { cellWidth: "auto" as any } },
    margin: { left: 14, right: 14 },
  });

  // Footer on every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "TJ Anderson Layer Method™: Core Cross Agent™  •  © 2026 Tionna Anderson",
      14,
      290
    );
    doc.text(`Page ${i} / ${pageCount}`, 190, 290, { align: "right" });
  }

  doc.save(`dna-progress-${today.replace(/\//g, "-")}.pdf`);
}
