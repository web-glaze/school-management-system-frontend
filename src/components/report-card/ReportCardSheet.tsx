"use client";

import type { CSSProperties, SyntheticEvent } from "react";
import { format } from "date-fns";
export const REPORT_ASSETS = {
  schoolLogo: "/report-card/school-logo.png",
  signVicePrincipal: "/report-card/sign-vice-principal.png",
  signPrincipal: "/report-card/sign-principal.png",
};

export const REPORT_SCHOOL = {
  address: "Village Horawalla, Near Sahaspur, Dehradun - 248197, India",
};

const GREEN = "#9cc63b";
const PAGE1_GRADIENT = "linear-gradient(180deg, #f8f8cf 0%, #fcfce0 42%, #fdfdee 70%, #f9f9d2 100%)";
const CO_SCHOLASTIC_TITLE = "CO-SCHOLASTIC AREAS";
const CO_SCHOLASTIC_SUBTITLE = "PASTORAL FEEDBACK";
const APPEND_EXAMINATION = true;
const SHOW_OVERALL = false;

/* ===================================================================== */

const SHEET_ID = "report-card-sheet";
const PAGE_W = 794;
const PAGE_H = 1122;
const SERIF = "inherit";
const GEORGIA = "inherit";
const SANS = "inherit";

type GradeBandLike = { grade: string; minPercentage: number | string; maxPercentage: number | string; displayOrder: number | string };

export interface ReportCardSheetProps {
  report: {
    scope: "INDIVIDUAL" | "COMBINED";
    reportData?: Record<string, unknown>;
    teacherRemarks?: Record<string, unknown>;
    coScholasticMarks?: Record<string, string>;
    student: { firstName: string; lastName: string; admissionNo: string; dob?: string | Date | null };
    session: { name: string };
    enrollment: { class?: { name: string } | null; section?: { name: string } | null };
    examGroup?: { name: string } | null;
    template?: {
      showPerformanceGraph?: boolean;
      showOverallGrade?: boolean;
      sections?: { key: string; isEnabled: boolean }[];
      coScholasticRows?: { id: string; label: string; displayOrder: number }[];
    } | null;
  };
  remarkFields: { key: string; label: string }[];
  gradeBands?: GradeBandLike[];
}

/* ---------------------------------------------------------------------
   helpers
--------------------------------------------------------------------- */

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isClassTeacherKey(key: string) {
  return key.replace(/[^a-z]/gi, "").toLowerCase() === "classteacher";
}

function formatDob(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : format(date, "dd/MM/yyyy");
}

function readAttendance(data: Record<string, unknown>) {
  const raw = data.attendance;
  if (typeof raw === "string" && raw.trim()) return raw;
  const obj = readObject(raw);
  const present = obj.present ?? obj.daysPresent;
  const total = obj.total ?? obj.workingDays ?? obj.totalDays;
  if (present != null && total != null) return `${present}/${total}`;
  return "—";
}

function bandLabel(band: GradeBandLike) {
  return Number(band.minPercentage) <= 0 ? `${Number(band.maxPercentage)} & Below` : `${Number(band.minPercentage)}-${Number(band.maxPercentage)}`;
}

function hideOnError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = "none";
}

/* ---------------------------------------------------------------------
   shared styles
--------------------------------------------------------------------- */

const pageStyle: CSSProperties = {
  width: PAGE_W,
  minHeight: PAGE_H,
  boxSizing: "border-box",
  padding: "40px 42px 72px",
  background: "#fff",
  color: "#000",
  fontFamily: SERIF,
  flexShrink: 0,
};

const frameBase: CSSProperties = {
  border: `3px solid ${GREEN}`,
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minHeight: PAGE_H - 112,
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
};

const th: CSSProperties = {
  fontWeight: 700,
  fontSize: 10.5,
  textAlign: "center",
  padding: "6px 4px",
  borderBottom: "1px solid #d4d4d4",
  verticalAlign: "middle",
  lineHeight: 1.15,
};

const td: CSSProperties = {
  fontSize: 11.5,
  textAlign: "center",
  padding: "6px 4px",
  borderBottom: "1px solid #d4d4d4",
};

/* ---------------------------------------------------------------------
   small pieces
--------------------------------------------------------------------- */

function InfoBand({ name, admissionNo, attendance, dob, classSection, top }: { name: string; admissionNo: string; attendance: string; dob: string; classSection?: string; top: boolean }) {
  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "88px 132px 92px 84px 92px 1fr",
    padding: "12px 12px 12px 66px",
    borderTop: top ? `2px solid ${GREEN}` : undefined,
    borderBottom: `2px solid ${GREEN}`,
    fontSize: 11.5,
    lineHeight: "18px",
  };
  const label: CSSProperties = { fontWeight: 700, whiteSpace: "nowrap" };
  const value: CSSProperties = { paddingRight: 8, minWidth: 0, overflowWrap: "anywhere" };

  return (
    <div style={grid}>
      <span style={label}>{top ? "Student's Name" : "Students'Name"}</span>
      <span style={value}>: {name}</span>
      <span style={label}>Admission No.</span>
      <span style={{ ...value, gridColumn: "4 / span 3" }}>: {admissionNo}</span>

      <span style={label}>Attendance</span>
      <span style={value}>: {attendance}</span>
      <span style={label}>Date of Birth</span>
      <span style={value}>: {dob}</span>
      {classSection ? (
        <>
          <span style={label}>Class/Section</span>
          <span style={value}>: {classSection}</span>
        </>
      ) : (
        <>
          <span />
          <span />
        </>
      )}
    </div>
  );
}

const SERIES_COLORS: [string, string][] = [
  ["#a9d4f5", "#ffffff"],
  ["#f5b400", "#fff2c0"],
  ["#9fdcb3", "#ffffff"],
  ["#f5a9a9", "#ffffff"],
  ["#c9b8f0", "#ffffff"],
];

function PerformanceChart({ labels, series }: { labels: string[]; series: { name: string; values: (number | null)[] }[] }) {
  const W = 571;
  const H = 234;
  const L = 46;
  const R = W - 14;
  const T = 36;
  const B = 166;
  const plotH = B - T;
  const groupW = (R - L) / Math.max(labels.length, 1);
  const barW = Math.min((groupW * 0.86) / series.length, groupW * 0.43);

  const legendBase = series.map((s) => ({ ...s, w: 12 + s.name.length * 5 + 14 }));
  const legendW = legendBase.reduce((sum, item) => sum + item.w, 0) + 10;
  const legendStart = (L + R) / 2 - legendW / 2 + 8;
  const legendItems = legendBase.map((item, i) => ({
    ...item,
    x: legendStart + legendBase.slice(0, i).reduce((sum, prev) => sum + prev.w, 0),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", fontFamily: SANS }}>
      <defs>
        {SERIES_COLORS.map(([top, bottom], i) => (
          <linearGradient key={i} id={`rc-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="100%" stopColor={bottom} />
          </linearGradient>
        ))}
      </defs>

      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="#f2f2f2" stroke="#cfcfcf" />
      <text x={W / 2} y="22" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#666" letterSpacing="0.5">
        PERFORMANCE ANALYSIS
      </text>

      <rect x={L} y={T} width={R - L} height={plotH} fill="#fff" stroke="#444" strokeWidth="0.8" />

      {[0, 20, 40, 60, 80, 100].map((v) => {
        const y = B - (v / 100) * plotH;
        return (
          <g key={v}>
            {v > 0 && v < 100 && <line x1={L} x2={R} y1={y} y2={y} stroke="#d0d0d0" strokeWidth="0.6" />}
            <text x={L - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#555">
              {v}
            </text>
          </g>
        );
      })}

      <text x="12" y={(T + B) / 2} transform={`rotate(-90 12 ${(T + B) / 2})`} textAnchor="middle" fontSize="8" fontWeight="700" fill="#666">
        MARKS
      </text>

      {labels.map((label, gi) => {
        const startX = L + gi * groupW + (groupW - barW * series.length) / 2;
        const shown = label.length > 16 ? `${label.slice(0, 15)}…` : label;

        return (
          <g key={`${label}-${gi}`}>
            {series.map((s, si) => {
              const raw = s.values[gi];
              if (raw == null) return null;
              const value = Math.max(0, Math.min(raw, 100));
              const h = (value / 100) * plotH;
              const x = startX + si * barW;
              const y = B - h;

              return (
                <g key={si}>
                  <rect x={x} y={y} width={barW} height={h} fill={`url(#rc-grad-${si % SERIES_COLORS.length})`} stroke="#333" strokeWidth="0.8" />
                  <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8.5" fill="#333">
                    {Math.round(raw)}
                  </text>
                </g>
              );
            })}
            <text x={L + gi * groupW + groupW / 2} y={B + 13} textAnchor="middle" fontSize="7.5" fill="#666">
              {shown.toUpperCase()}
            </text>
          </g>
        );
      })}

      <text x={(L + R) / 2} y={B + 27} textAnchor="middle" fontSize="8" fontWeight="700" fill="#666">
        SUBJECTS
      </text>

      <rect x={(L + R) / 2 - legendW / 2} y={B + 33} width={legendW} height="17" fill="#fff" stroke="#bbb" />
      {legendItems.map((item, i) => {
        const x = item.x;

        return (
          <g key={i}>
            <rect x={x} y={B + 38} width="7" height="7" fill={`url(#rc-grad-${i % SERIES_COLORS.length})`} stroke="#555" strokeWidth="0.6" />
            <text x={x + 11} y={B + 45} fontSize="8" fill="#555">
              {item.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------------------------------------------------------------
   main component
--------------------------------------------------------------------- */

export default function ReportCardSheet({ report, remarkFields, gradeBands = [] }: ReportCardSheetProps) {
  const data = readObject(report.reportData);
  const isCombined = report.scope === "COMBINED";
  const subjects = readArray(data.subjects).map(readObject);
  const groups = isCombined ? readArray(data.groups).map(readObject) : [];
  const overall = readObject(data.overall);

  const sectionOn = (key: string) => {
    const row = (report.template?.sections ?? []).find((item) => item.key === key);
    return row ? row.isEnabled : true;
  };

  const name = `${report.student.firstName} ${report.student.lastName}`.trim();
  const attendance = sectionOn("ATTENDANCE") ? readAttendance(data) : "—";
  const dob = formatDob(report.student.dob);
  const classSection = [report.enrollment.class?.name, report.enrollment.section?.name].filter(Boolean).join(" - ") || "—";

  let title = "FINAL REPORT";
  if (!isCombined) {
    const groupName = (report.examGroup?.name ?? "Report Card").toUpperCase();
    title = APPEND_EXAMINATION && !groupName.includes("EXAM") && groupName !== "REPORT CARD" ? `${groupName} EXAMINATION` : groupName;
  }

  /* ----- scholastic columns (Theory, Periodic Test, ...) ----- */
  const columns: { name: string; max: number | null }[] = [];
  subjects.forEach((subject) => {
    readArray(subject.components)
      .map(readObject)
      .forEach((component) => {
        const columnName = String(component.name ?? "");
        if (!columnName || columns.some((col) => col.name === columnName)) return;
        const max = Number(component.maximumMarks);
        columns.push({ name: columnName, max: Number.isFinite(max) ? max : null });
      });
  });

  const maxTotals = Array.from(new Set(subjects.map((subject) => subject.maxTotal).filter((v) => v != null)));
  const maxTotalLabel = maxTotals.length === 1 ? String(maxTotals[0]) : "";

  const cellValue = (subject: Record<string, unknown>, columnName: string) => {
    const component = readArray(subject.components)
      .map(readObject)
      .find((item) => String(item.name ?? "") === columnName);
    if (!component) return "—";
    if (component.isAbsent) return "AB";
    return component.marksObtained != null ? String(component.marksObtained) : "—";
  };

  /* ----- performance chart data ----- */
  let chartLabels: string[] = [];
  let chartSeries: { name: string; values: (number | null)[] }[] = [];

  if (!isCombined) {
    const history = readArray(data.history).map(readObject);

    if (history.length > 0) {
      chartLabels = Array.from(new Set(history.flatMap((entry) => readArray(entry.subjects).map((item) => String(readObject(item).subjectName ?? "")))));
      chartSeries = history.map((entry) => ({
        name: String(entry.examGroupName ?? ""),
        values: chartLabels.map((label) => {
          const point = readArray(entry.subjects)
            .map(readObject)
            .find((item) => String(item.subjectName ?? "") === label);
          const value = point?.percentage;
          return value != null && Number.isFinite(Number(value)) ? Number(value) : null;
        }),
      }));
    }
  }

  if (chartSeries.length === 0) {
    chartLabels = subjects.map((subject) => String(subject.subjectName ?? ""));
    chartSeries = [
      {
        name: isCombined ? "Final" : (report.examGroup?.name ?? "Result"),
        values: subjects.map((subject) => {
          const value = isCombined ? subject.weightedPercentage : subject.percentage;
          return value != null && Number.isFinite(Number(value)) ? Number(value) : null;
        }),
      },
    ];
  }

  const showGraph = Boolean(report.template?.showPerformanceGraph) && sectionOn("PERFORMANCE_GRAPH") && subjects.length > 0;

  /* ----- grade range table ----- */
  const embeddedBands = readArray(data.gradeBands).map(readObject) as unknown as GradeBandLike[];
  const bands = [...(gradeBands.length > 0 ? gradeBands : embeddedBands)].sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

  /* ----- remarks ----- */
  const remarks = readObject(report.teacherRemarks);
  const remarkText = (key: string) => {
    const value = remarks[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const classTeacherField = remarkFields.find((field) => isClassTeacherKey(field.key));
  const otherRemarkFields = remarkFields.filter((field) => !isClassTeacherKey(field.key));

  /* ----- co-scholastic ----- */
  const coRows = [...(report.template?.coScholasticRows ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const signatures = [
    { label: "Vice Principal", src: REPORT_ASSETS.signVicePrincipal },
    { label: "Principal", src: REPORT_ASSETS.signPrincipal },
  ];

  return (
    <div id={SHEET_ID} style={{ width: PAGE_W, margin: "0 auto" }}>
      {/* =================================================== PAGE 1 */}
      <div className="rc-page" style={{ ...pageStyle, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.25)" }}>
        <div
          style={{
            ...frameBase,
            backgroundImage: PAGE1_GRADIENT,
          }}
        >
          {/* header */}
          <div style={{ position: "relative", textAlign: "center", paddingTop: 44 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={REPORT_ASSETS.schoolLogo} alt="School logo" onError={hideOnError} style={{ height: 115, display: "inline-block" }} />
            <div style={{ fontFamily: GEORGIA, fontSize: 11.5, fontWeight: 600, marginTop: 8, paddingLeft: 14 }}>{REPORT_SCHOOL.address}</div>
          </div>

          {/* title */}
          <div style={{ textAlign: "center", marginTop: 62 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>ACADEMIC SESSION - {report.session.name}</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <InfoBand name={name} admissionNo={report.student.admissionNo} attendance={attendance} dob={dob} classSection={classSection} top />
          </div>

          {/* scholastic table */}
          {sectionOn("MARKS_TABLE") && (
            <div style={{ margin: "23px 66px 0", border: "1px solid #cfcfcf", background: "rgba(255,255,255,0.35)" }}>
              <div style={{ textAlign: "center", fontWeight: 700, fontSize: 11.5, padding: "10px 0", borderBottom: "1px solid #d4d4d4" }}>SCHOLASTIC AREA</div>

              {isCombined && groups.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: "left", paddingLeft: 8 }}>EXAM GROUP</th>
                      <th style={th}>WEIGHTAGE</th>
                      <th style={th}>ACHIEVED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group, index) => (
                      <tr key={index}>
                        <td style={{ ...td, textAlign: "left", paddingLeft: 8 }}>{String(group.examGroupName ?? "—")}</td>
                        <td style={td}>{group.weightagePercent != null ? `${group.weightagePercent}%` : "—"}</td>
                        <td style={td}>{group.percentage != null ? `${group.percentage}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "20%" }} />
                  {isCombined ? (
                    <col />
                  ) : (
                    <>
                      {columns.map((col) => (
                        <col key={col.name} style={{ width: `${60 / Math.max(columns.length, 1)}%` }} />
                      ))}
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                    </>
                  )}
                </colgroup>

                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: "left", paddingLeft: 8, height: 40 }}>SUBJECTS</th>
                    {isCombined ? (
                      <th style={th}>WEIGHTED %</th>
                    ) : (
                      <>
                        {columns.map((col) => (
                          <th key={col.name} style={th}>
                            {col.name.toUpperCase()}
                          </th>
                        ))}
                        <th style={th}>TOTAL</th>
                        <th style={th}>GRADE</th>
                      </>
                    )}
                  </tr>

                  {!isCombined && columns.length > 0 && (
                    <tr>
                      <th style={th} />
                      {columns.map((col) => (
                        <th key={col.name} style={th}>
                          {col.max ?? ""}
                        </th>
                      ))}
                      <th style={th}>{maxTotalLabel}</th>
                      <th style={th} />
                    </tr>
                  )}
                </thead>

                <tbody>
                  {subjects.map((subject, index) => (
                    <tr key={index}>
                      <td style={{ ...td, textAlign: "left", paddingLeft: 8, height: 27 }}>{String(subject.subjectName ?? "—").toUpperCase()}</td>
                      {isCombined ? (
                        <td style={td}>{subject.weightedPercentage != null ? `${subject.weightedPercentage}%` : "—"}</td>
                      ) : (
                        <>
                          {columns.map((col) => (
                            <td key={col.name} style={td}>
                              {cellValue(subject, col.name)}
                            </td>
                          ))}
                          <td style={td}>{subject.obtainedTotal != null ? String(subject.obtainedTotal) : "—"}</td>
                          <td style={td}>{typeof subject.grade === "string" && subject.grade ? subject.grade : "—"}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {SHOW_OVERALL && report.template?.showOverallGrade !== false && (
            <div style={{ margin: "10px 66px 0", fontSize: 11.5, fontWeight: 700 }}>
              Overall: {overall.percentage != null ? `${overall.percentage}%` : "—"} &nbsp; Grade: {String(overall.grade ?? "—")}
            </div>
          )}

          {/* class teacher remark */}
          {sectionOn("REMARKS") && classTeacherField && (
            <div style={{ margin: "30px 66px 0", border: "1px solid #bdbdbd", padding: "6px 6px", fontSize: 11.5, fontWeight: 700, lineHeight: 1.35, background: "rgba(255,255,255,0.35)" }}>
              {classTeacherField.label} : {remarkText(classTeacherField.key)}
            </div>
          )}

          {/* grade ranges */}
          {sectionOn("GRADE_TABLE") && bands.length > 0 && (
            <table style={{ margin: "14px 66px 0", width: "calc(100% - 132px)", borderCollapse: "collapse", fontSize: 9.5, fontWeight: 700, border: "1px solid #cfcfcf", background: "rgba(255,255,255,0.35)" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "2px 4px" }}>MARKS RANGE</td>
                  {bands.map((band, index) => (
                    <td key={index} style={{ padding: "2px 4px", textAlign: "center" }}>
                      {bandLabel(band)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "2px 4px" }}>GRADE</td>
                  {bands.map((band, index) => (
                    <td key={index} style={{ padding: "2px 4px", textAlign: "center" }}>
                      {band.grade}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* =================================================== PAGE 2 */}
      <div className="rc-page" style={{ ...pageStyle, boxShadow: "0 1px 6px rgba(0,0,0,0.25)" }}>
        <div style={{ ...frameBase, backgroundImage: PAGE1_GRADIENT }}>
          <div style={{ paddingTop: 30 }}>
            <InfoBand name={name} admissionNo={report.student.admissionNo} attendance={attendance} dob={dob} top={false} />
          </div>

          {/* co-scholastic grades */}
          {sectionOn("CO_SCHOLASTIC") && coRows.length > 0 && (
            <table style={{ margin: "22px auto 0", width: 250, borderCollapse: "collapse", fontSize: 10.5, border: "1px solid #bdbdbd", background: "rgba(255,255,255,0.6)" }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ padding: "3px 4px", fontWeight: 700, borderBottom: "1px solid #bdbdbd" }}>
                    {CO_SCHOLASTIC_TITLE}
                  </th>
                </tr>
                <tr>
                  <th style={{ padding: "2px 4px", fontWeight: 700, borderBottom: "1px solid #bdbdbd", borderRight: "1px solid #bdbdbd" }}>{CO_SCHOLASTIC_SUBTITLE}</th>
                  <th style={{ padding: "2px 4px", fontWeight: 700, borderBottom: "1px solid #bdbdbd", width: 48 }}>GRADE</th>
                </tr>
              </thead>
              <tbody>
                {coRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: "1.5px 4px", borderBottom: "1px solid #e0e0e0", borderRight: "1px solid #bdbdbd" }}>{row.label}</td>
                    <td style={{ padding: "1.5px 4px", borderBottom: "1px solid #e0e0e0", textAlign: "center" }}>{report.coScholasticMarks?.[row.label] || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* performance chart */}
          {showGraph && (
            <div style={{ margin: "26px 56px 0" }}>
              <PerformanceChart labels={chartLabels} series={chartSeries} />
            </div>
          )}

          {/* other remarks */}
          {sectionOn("REMARKS") && otherRemarkFields.length > 0 && (
            <table style={{ margin: "0 56px", marginTop: showGraph ? 0 : 22, width: "calc(100% - 112px)", borderCollapse: "collapse", fontSize: 10.5, background: "rgba(255,255,255,0.6)" }}>
              <tbody>
                {otherRemarkFields.map((field) => (
                  <tr key={field.key}>
                    <td style={{ width: 112, padding: "5px 5px", border: "1px solid #c4c4c4", verticalAlign: "top", textTransform: "uppercase", lineHeight: 1.3 }}>{field.label}</td>
                    <td style={{ padding: "5px 5px", border: "1px solid #c4c4c4", verticalAlign: "top", lineHeight: 1.35, whiteSpace: "pre-wrap" }}>{remarkText(field.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* signatures */}
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-around", alignItems: "flex-end", padding: "24px 48px 18px" }}>
            {signatures.map((item) => (
              <div key={item.label} style={{ textAlign: "center", minWidth: 110 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.src ? <img src={item.src} alt="" onError={hideOnError} style={{ height: 54, display: "block", margin: "0 auto 2px" }} /> : <div style={{ height: 54 }} />}
                <div style={{ fontSize: 15 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Print / Save as PDF — prints exactly what is on screen, 2 x A4 pages
--------------------------------------------------------------------- */

export function printReportCardSheet(fileName = "Report Card") {
  const sheet = document.getElementById(SHEET_ID);
  if (!sheet) return;

  const PRINT_ID = "report-card-print-root";

  // Print from the page itself so the font is exactly the same as on screen
  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.id = PRINT_ID;
  clone.innerHTML = clone.innerHTML.replace(/rc-grad-/g, "rc-print-grad-");
  clone.style.display = "none";
  document.body.appendChild(clone);

  const style = document.createElement("style");
  style.textContent = `
    @page { size: A4; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: visible !important; height: auto !important; }
      body > *:not(#${PRINT_ID}) { display: none !important; }
      #${PRINT_ID} { display: block !important; width: ${PAGE_W}px; margin: 0 !important; }
      #${PRINT_ID} .rc-page { margin: 0 !important; box-shadow: none !important; break-inside: avoid; }
      #${PRINT_ID} .rc-page:first-child { break-after: page; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
  document.head.appendChild(style);

  // The browser uses the page title as the default PDF file name
  const previousTitle = document.title;
  document.title = fileName;

  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    document.title = previousTitle;
    clone.remove();
    style.remove();
  };
  window.addEventListener("afterprint", cleanup);

  setTimeout(() => window.print(), 300);
}