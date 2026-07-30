// ============================================================
// TrafficWatch AI — Report Generation Engine
import { useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";
//
// Generates professional PDF, CSV, and JSON reports with
// clear source labeling for all data types.
// ============================================================

import { supabase } from "@/supabase/client";
import type { Incident, Evidence, AIAnalysis, ANPRScan, Profile, InvolvedPerson } from "@/supabase/types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── Types ──────────────────────────────────────────────

export type ReportFormat = "pdf" | "csv" | "json";
export type ReportScope = "full" | "summary" | "evidence" | "ai_analysis";

export interface ReportOptions {
  incidentId: string;
  format: ReportFormat;
  scope: ReportScope;
  includeEvidence: boolean;
  includeAIAnalysis: boolean;
  includeSignatures: boolean;
  sourceLabeling: boolean;
  officerNotes?: string;
}

export interface ReportData {
  incident: Incident | null;
  evidence: Evidence[];
  aiAnalyses: AIAnalysis[];
  anprScans: ANPRScan[];
  persons: InvolvedPerson[];
  officer: Profile | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  assignments: any[];
  countyData: { county?: string; code?: string } | null;
}

export interface ReportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  filename?: string;
  htmlContent?: string;
  data?: ReportData;
  error?: string;
}

// ─── Source label constants ─────────────────────────────

export const SOURCE_LABELS = {
  original_evidence: { label: "📁 Original Evidence", badge: "bg-blue-500/10 text-blue-500" },
  ai_generated: { label: "🤖 AI-Generated Analysis", badge: "bg-purple-500/10 text-purple-500" },
  officer_entered: { label: "👮 Officer-Entered Information", badge: "bg-amber-500/10 text-amber-500" },
  verified: { label: "✅ Verified Information", badge: "bg-emerald-500/10 text-emerald-500" },
  system: { label: "⚙️ System Record", badge: "bg-slate-500/10 text-slate-500" },
} as const;

export type SourceType = keyof typeof SOURCE_LABELS;

// ─── Data fetching ──────────────────────────────────────

export async function fetchReportData(incidentId: string): Promise<ReportData> {
    const [
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      incidentRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      evidenceRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      aiRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      anprRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      personsRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      officerRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      logsRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignmentsRes,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      countyRes,
    ] = await Promise.allSettled([
      supabase.from("incidents").select("*").eq("id", incidentId).single(),
      supabase.from("evidence").select("*").eq("incident_id", incidentId).order("uploaded_at", { ascending: false }),
      supabase.from("ai_analyses").select("*").eq("incident_id", incidentId).order("created_at", { ascending: false }),
      supabase.from("anpr_scans").select("*").eq("incident_id", incidentId).order("scanned_at", { ascending: false }),
      supabase.from("involved_persons").select("*").eq("incident_id", incidentId),
      supabase.from("profiles").select("*").limit(1).single(),
      supabase.from("incident_logs").select("*").eq("incident_id", incidentId).order("created_at", { ascending: false }).limit(50),
      supabase.from("incident_assignments").select("*").eq("incident_id", incidentId),
      supabase.from("liberia_counties").select("name, code").limit(1),
    ]);

  // Extract incident first to get officer_id
  const incident = (incidentRes.status === "fulfilled" ? incidentRes.value.data : null) as Incident | null;

  // Fetch officer separately with the correct ID
  let officer: Profile | null = null;
  if (incident?.officer_id) {
    const officerRes2 = await supabase.from("profiles").select("*").eq("id", incident.officer_id).single();
    if (officerRes2.data) officer = officerRes2.data as Profile;
  }

  // Build county match from incident location
  let countyData: { county?: string; code?: string } | null = null;
  if (incident?.location_address && countyRes.status === "fulfilled" && countyRes.value.data) {
    const counties = countyRes.value.data as any[];
    const matched = counties.find(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) =>
        incident.location_address?.toLowerCase().includes(c.name?.toLowerCase() || "") ||
        incident.location_address?.toLowerCase().includes(c.code?.toLowerCase() || "")
    );
    if (matched) countyData = { county: matched.name, code: matched.code };
  }

  return {
    incident,
    evidence: (evidenceRes.status === "fulfilled" ? evidenceRes.value.data : []) as Evidence[],
    aiAnalyses: (aiRes.status === "fulfilled" ? aiRes.value.data : []) as AIAnalysis[],
    anprScans: (anprRes.status === "fulfilled" ? anprRes.value.data : []) as ANPRScan[],
    persons: (personsRes.status === "fulfilled" ? personsRes.value.data : []) as InvolvedPerson[],
    officer,
    logs: (logsRes.status === "fulfilled" ? logsRes.value.data ?? [] : []),
    assignments: (assignmentsRes.status === "fulfilled" ? assignmentsRes.value.data ?? [] : []),
    countyData,
  };
}

// ─── Generate a complete HTML report string ─────────────

export function buildReportHtml(data: ReportData, options: ReportOptions): string {
  const { incident, evidence, aiAnalyses, anprScans, persons, officer, logs, countyData } = data;
  const { scope, includeEvidence, includeAIAnalysis, sourceLabeling } = options;

  const now = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const severityColor = (s: string) => {
    switch (s) {
      case "critical": return "#ef4444";
      case "serious": return "#f97316";
      case "moderate": return "#3b82f6";
      case "minor": return "#22c55e";
      default: return "#6b7280";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "draft": case "closed": case "archived": return "#6b7280";
      case "under_review": case "escalated": return "#f97316";
      case "confirmed": case "resolved": return "#22c55e";
      default: return "#3b82f6";
    }
  };

  const sourceTag = (type: SourceType) => {
    if (!sourceLabeling) return "";
    const info = SOURCE_LABELS[type];
    return `<span style="display:inline-block;font-size:10px;padding:2px 8px;border-radius:4px;background:${type === "original_evidence" ? "#dbeafe" : type === "ai_generated" ? "#f3e8ff" : type === "officer_entered" ? "#fef3c7" : type === "verified" ? "#d1fae5" : "#f1f5f9"};color:${type === "original_evidence" ? "#2563eb" : type === "ai_generated" ? "#9333ea" : type === "officer_entered" ? "#d97706" : type === "verified" ? "#059669" : "#475569"};margin-left:6px;vertical-align:middle;">${info.label}</span>`;
  };

  const sections: string[] = [];

  // ── CSS ──
  sections.push(`<style>
    @page { margin: 20mm 15mm; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5; font-size: 11px; }
    .report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1e293b; }
    .report-header h1 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px; }
    .report-header .subtitle { font-size: 11px; color: #64748b; margin: 2px 0; }
    .report-header .badge-row { margin-top: 8px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:4px; font-size:10px; font-weight:600; text-transform:uppercase; margin:0 4px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 700; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .field { padding: 6px 8px; background: #f8fafc; border-radius: 4px; }
    .field-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 11px; font-weight: 500; margin-top: 2px; }
    .desc-block { padding: 10px; background: #f8fafc; border-radius: 6px; margin-top: 8px; }
    .desc-block p { margin: 0; font-size: 11px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
    th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
    .severity-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:4px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
    .confidence-bar { display:inline-block; height:6px; border-radius:3px; margin-right:6px; }
    .page-break { page-break-before: always; }
    .signature-block { margin-top: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 6px; }
    .signature-line { margin: 12px 0; border-top: 1px solid #94a3b8; width: 250px; padding-top: 4px; font-size: 10px; color: #64748b; }
    .watermark { position: relative; }
    .data-source { font-size: 9px; color: #64748b; font-style: italic; margin-top: 4px; }
  </style>`);

  // ── Header ──
  const statusBadge = incident?.status || "unknown";
  const sevBadge = incident?.severity || "unknown";
  sections.push(`<div class="report-header">
    <h1>Liberia National Police — Traffic Incident Report</h1>
    <div class="subtitle">${incident?.id || "N/A"} | Generated: ${now}</div>
    <div class="subtitle">${countyData?.county || ""}${countyData?.county ? " County" : ""}${incident?.location_address ? ` | ${incident.location_address}` : ""}</div>
    <div class="badge-row">
      <span class="badge" style="background:${statusColor(statusBadge)}15;color:${statusColor(statusBadge)};border:1px solid ${statusColor(statusBadge)}30;">${statusBadge.replace(/_/g, " ")}</span>
      <span class="badge" style="background:${severityColor(sevBadge)}15;color:${severityColor(sevBadge)};border:1px solid ${severityColor(sevBadge)}30;">${sevBadge}</span>
      <span class="badge" style="background:#1e293b;color:white;">CONFIDENTIAL — LAW ENFORCEMENT USE ONLY</span>
    </div>
  </div>`);

  // ── 1. Incident Summary ──
  if (scope === "full" || scope === "summary") {
    sections.push(`<div class="section">
      <div class="section-title">📋 Incident Summary ${sourceTag("officer_entered")}</div>
      ${incident ? `
      <div class="grid-2">
        <div class="field"><div class="field-label">Violation Type</div><div class="field-value">${incident.title || "N/A"}</div></div>
        <div class="field"><div class="field-label">License Plate</div><div class="field-value">${incident.vehicle_plate || "N/A"}</div></div>
        <div class="field"><div class="field-label">Vehicle</div><div class="field-value">${[incident.vehicle_color, incident.vehicle_type].filter(Boolean).join(" ") || "N/A"}</div></div>
        <div class="field"><div class="field-label">Severity</div><div class="field-value"><span class="severity-dot" style="background:${severityColor(incident.severity)}"></span>${incident.severity}</div></div>
        <div class="field"><div class="field-label">Location</div><div class="field-value">${incident.location_address || "N/A"}</div></div>
        <div class="field"><div class="field-label">Date & Time</div><div class="field-value">${incident.created_at ? new Date(incident.created_at).toLocaleString() : "N/A"}</div></div>
        <div class="field"><div class="field-label">Reporting Officer</div><div class="field-value">${officer?.full_name || "N/A"}</div></div>
        <div class="field"><div class="field-label">Badge Number</div><div class="field-value">${officer?.badge_number || "N/A"}</div></div>
      </div>` : `<p>No incident data available.</p>`}
      ${incident?.description ? `
      <div class="desc-block">
        <div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Officer Description ${sourceTag("officer_entered")}</div>
        <p>${incident.description}</p>
      </div>` : ""}
      ${incident?.officer_notes ? `
      <div class="desc-block" style="background:#fef3c7;margin-top:8px;">
        <div style="font-size:9px;color:#d97706;text-transform:uppercase;margin-bottom:4px;">Confidential Officer Notes ${sourceTag("officer_entered")}</div>
        <p>${incident.officer_notes}</p>
      </div>` : ""}
    </div>`);

    // ── Officer / Station Info ──
    if (officer) {
      sections.push(`<div class="section">
        <div class="section-title">👮 Reporting Officer Details ${sourceTag("officer_entered")}</div>
        <div class="grid-2">
          <div class="field"><div class="field-label">Name</div><div class="field-value">${officer.full_name || "N/A"}</div></div>
          <div class="field"><div class="field-label">Badge #</div><div class="field-value">${officer.badge_number || "N/A"}</div></div>
          <div class="field"><div class="field-label">Station</div><div class="field-value">${officer.station || "N/A"}</div></div>
          <div class="field"><div class="field-label">Role</div><div class="field-value">${officer.role?.replace(/_/g, " ") || "N/A"}</div></div>
          <div class="field"><div class="field-label">Department</div><div class="field-value">${officer.department || "N/A"}</div></div>
          <div class="field"><div class="field-label">Phone</div><div class="field-value">${officer.phone || "N/A"}</div></div>
        </div>
      </div>`);
    }
  }

  // ── 2. AI Analysis Results ──
  if ((scope === "full" || scope === "ai_analysis") && includeAIAnalysis && aiAnalyses.length > 0) {
    sections.push(`<div class="section ${scope === "ai_analysis" && evidence.length === 0 ? "" : ""}">
      <div class="section-title">🧠 AI Analysis Results ${sourceTag("ai_generated")}</div>
      <p class="data-source">⚠️ These results are AI-generated and require officer review before use as evidence.</p>
      ${aiAnalyses.map((a, i) => `
      <div style="padding:10px;background:#faf5ff;border-radius:6px;margin-bottom:10px;border:1px solid #e9d5ff;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:12px;">Analysis #${i + 1}</strong>
          <span style="font-size:9px;color:#64748b;">${a.created_at ? new Date(a.created_at).toLocaleString() : "N/A"}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;">
          <div><strong>Violation:</strong> ${a.violation_type || "N/A"}</div>
          <div><strong>Confidence:</strong> ${a.confidence_score != null ? `${Math.round(a.confidence_score * 100)}%` : "N/A"}</div>
          <div><strong>Vehicle:</strong> ${[a.vehicle_color, a.vehicle_type, a.vehicle_make, a.vehicle_model].filter(Boolean).join(" ") || "N/A"}</div>
          <div><strong>License Plate:</strong> ${a.license_plate || "Not detected"} ${a.license_plate_confidence != null ? `(${Math.round(a.license_plate_confidence)}%)` : ""}</div>
          <div><strong>Severity:</strong> ${a.severity || "N/A"}</div>
          <div><strong>Provider:</strong> ${a.provider_id || "N/A"}</div>
        </div>
        ${a.detected_objects ? `<div style="margin-top:6px;font-size:10px;"><strong>Detected Objects:</strong> ${JSON.stringify(a.detected_objects)}</div>` : ""}
        ${a.ai_summary ? `<div style="margin-top:6px;padding:6px;background:white;border-radius:4px;font-size:10px;">${a.ai_summary}</div>` : ""}
        <div style="margin-top:6px;display:flex;gap:8px;font-size:10px;">
          <span><strong>Status:</strong> ${a.is_confirmed === true ? "✅ Confirmed by Officer" : a.is_confirmed === false ? "❌ Rejected by Officer" : "⏳ Pending Review"}</span>
          ${a.reviewed_by ? `<span><strong>Reviewed by:</strong> ${a.reviewed_by}</span>` : ""}
        </div>
      </div>`).join("")}
    </div>`);
  }

  // ── 3. AI Analysis Not Available ──
  if (includeAIAnalysis && aiAnalyses.length === 0 && (scope === "full" || scope === "ai_analysis")) {
    sections.push(`<div class="section">
      <div class="section-title">🧠 AI Analysis</div>
      <p style="color:#64748b;font-size:11px;">No AI analysis results available for this incident.</p>
    </div>`);
  }

  // ── 4. ANPR Results ──
  if ((scope === "full" || scope === "ai_analysis") && includeAIAnalysis && anprScans.length > 0) {
    sections.push(`<div class="section">
      <div class="section-title">🔍 ANPR — Automatic Number Plate Recognition ${sourceTag("ai_generated")}</div>
      <table>
        <thead><tr><th>Plate Text</th><th>Normalized</th><th>Confidence</th><th>Verified</th><th>Date/Time</th></tr></thead>
        <tbody>
          ${anprScans.map(s => `
          <tr>
            <td><strong>${s.plate_text}</strong></td>
            <td>${s.normalized_plate || s.plate_text}</td>
            <td><span class="confidence-bar" style="width:${s.plate_confidence}px;background:${s.plate_confidence > 80 ? "#22c55e" : s.plate_confidence > 50 ? "#f97316" : "#ef4444"}"></span>${Math.round(s.plate_confidence)}%</td>
            <td>${s.officer_verified ? "✅ Verified" : s.officer_corrected_text ? `✏️ Corrected: ${s.officer_corrected_text}` : "⏳ Pending"}</td>
            <td>${new Date(s.scanned_at).toLocaleString()}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`);
  }

  // ── 5. Evidence ──
  if ((scope === "full" || scope === "evidence") && includeEvidence && evidence.length > 0) {
    sections.push(`<div class="section ${scope === "evidence" ? "" : "page-break"}">
      <div class="section-title">📁 Digital Evidence ${sourceTag("original_evidence")}</div>
      <p class="data-source">All evidence below is original uploaded content with cryptographic hash verification.</p>
      <table>
        <thead><tr><th>ID</th><th>Type</th><th>Description</th><th>Size</th><th>Uploaded</th><th>Hash (SHA-256)</th></tr></thead>
        <tbody>
          ${evidence.map(e => `
          <tr>
            <td>${e.id?.substring(0, 8) || "N/A"}</td>
            <td><span style="text-transform:uppercase;font-size:9px;padding:2px 6px;border-radius:3px;background:${e.type === "photo" ? "#dbeafe" : e.type === "video" ? "#f3e8ff" : e.type === "document" ? "#fef3c7" : "#f1f5f9"};">${e.type}</span></td>
            <td>${e.description || "—"}</td>
            <td>${e.file_size ? (e.file_size / 1024 / 1024).toFixed(1) + " MB" : "—"}</td>
            <td>${e.uploaded_at ? new Date(e.uploaded_at).toLocaleString() : "—"}</td>
            <td style="font-family:monospace;font-size:8px;">${e.sha256_hash ? e.sha256_hash.substring(0, 16) + "..." : "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <p class="data-source">Cryptographic hashes enable integrity verification of original evidence.</p>
    </div>`);
  }

  // ── 6. Involved Persons ──
  if ((scope === "full" || scope === "summary") && persons.length > 0) {
    sections.push(`<div class="section">
      <div class="section-title">👥 Involved Persons ${sourceTag("officer_entered")}</div>
      <table>
        <thead><tr><th>Name</th><th>Role</th><th>ID Type</th><th>ID Number</th><th>Phone</th></tr></thead>
        <tbody>
          ${persons.map(p => `
          <tr>
            <td><strong>${p.full_name}</strong></td>
            <td>${p.role}</td>
            <td>${p.id_type.replace(/_/g, " ")}</td>
            <td>${p.id_number || "—"}</td>
            <td>${p.phone || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`);
  }

  // ── 7. Case Timeline & Activity Log ──
  if (scope === "full" && logs.length > 0) {
    sections.push(`<div class="section">
      <div class="section-title">📅 Case Timeline ${sourceTag("system")}</div>
      <table>
        <thead><tr><th>Date/Time</th><th>Action</th><th>Performed By</th></tr></thead>
        <tbody>
          ${logs.slice(0, 30).map(log => `
          <tr>
            <td style="white-space:nowrap;">${log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
            <td>${log.action || "—"}</td>
            <td>${log.performed_by?.substring(0, 8) || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`);
  }

  // ── 8. Signatures ──
  if (options.includeSignatures) {
    sections.push(`<div class="section page-break">
      <div class="section-title">✍️ Digital Signatures & Certification</div>
      <div class="signature-block">
        <p style="font-size:11px;margin-bottom:12px;">I hereby certify that the information contained in this report is true and accurate to the best of my knowledge.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div>
            <div class="signature-line">Reporting Officer: ${officer?.full_name || "________________"}</div>
            <div style="font-size:10px;color:#64748b;">Badge #: ${officer?.badge_number || "________________"}</div>
            <div style="font-size:10px;color:#64748b;">Date: ${now}</div>
          </div>
          <div>
            <div class="signature-line">Supervising Officer: ________________</div>
            <div style="font-size:10px;color:#64748b;">Badge #: ________________</div>
            <div style="font-size:10px;color:#64748b;">Date: ________________</div>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">
          <p style="font-size:9px;color:#94a3b8;"><strong>Document Control:</strong> This document was generated by TrafficWatch AI on ${now}. All AI-generated content is clearly labeled and requires officer verification before use as legal evidence.</p>
        </div>
      </div>
    </div>`);
  }

  // ── 9. Source Labeling Legend ──
  if (sourceLabeling) {
    sections.push(`<div class="section" style="margin-top:16px;">
      <div class="section-title" style="font-size:10px;">📌 Source Labeling Legend</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:9px;">
        <span style="padding:3px 8px;background:#dbeafe;color:#2563eb;border-radius:3px;">📁 Original Evidence</span>
        <span style="padding:3px 8px;background:#f3e8ff;color:#9333ea;border-radius:3px;">🤖 AI-Generated Analysis</span>
        <span style="padding:3px 8px;background:#fef3c7;color:#d97706;border-radius:3px;">👮 Officer-Entered Information</span>
        <span style="padding:3px 8px;background:#d1fae5;color:#059669;border-radius:3px;">✅ Verified Information</span>
        <span style="padding:3px 8px;background:#f1f5f9;color:#475569;border-radius:3px;">⚙️ System Record</span>
      </div>
    </div>`);
  }

  // ── Footer ──
  sections.push(`<div class="footer">
    <p>TrafficWatch AI — Liberia National Police Traffic Division | ${now}</p>
    <p>This document is CONFIDENTIAL and intended for law enforcement use only.</p>
    <p>Report ID: ${options.incidentId}-RPT-${Date.now().toString(36).toUpperCase()}</p>
  </div>`);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Traffic Incident Report - ${incident?.id || options.incidentId}</title></head><body>${sections.join("\n")}</body></html>`;
}

// ─── Generate PDF ───────────────────────────────────────

export async function generatePdf(data: ReportData, options: ReportOptions): Promise<ReportResult> {
  try {
    const html = buildReportHtml(data, options);

    // Create a temporary div to render HTML for html2canvas
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "800px";
    container.style.background = "#ffffff";
    document.body.appendChild(container);

    // Wait for rendering
    await new Promise((r) => setTimeout(r, 300));

    // Capture the content
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 800,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 190; // mm (A4 width minus margins)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 297; // A4 height in mm
    const margin = 10;

    let heightLeft = imgHeight;
    let position = margin;
    let page = 1;

    // Add first page
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    // Add subsequent pages if content overflows
    while (heightLeft > 0) {
      position = margin - (pageHeight - margin * 2) * page;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
      page++;
    }

    // Add page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Page ${i} of ${totalPages} | ${data.incident?.id || options.incidentId} | Confidential`,
        margin,
        287
      );
    }

    const filename = `TrafficWatch_Report_${data.incident?.id || options.incidentId}_${Date.now()}.pdf`;
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      blob,
      url,
      filename,
      htmlContent: html,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: `PDF generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

// ─── Generate CSV ───────────────────────────────────────

export function generateCsv(data: ReportData, options: ReportOptions): ReportResult {
  try {
    const { incident, evidence, aiAnalyses, anprScans, persons } = data;
    const rows: string[][] = [];
    const addRow = (...cells: string[]) => rows.push(cells.map((c) => `"${(c || "").replace(/"/g, '""')}"`));

    // Header
    addRow("TrafficWatch AI — Incident Report CSV Export");
    addRow("Generated:", new Date().toLocaleString());
    addRow("Incident ID:", incident?.id || options.incidentId);
    addRow("");

    // Incident summary
    addRow("=== INCIDENT SUMMARY ===");
    addRow("Field", "Value", "Source");
    addRow("Violation Type", incident?.title || "", "Officer-Entered");
    addRow("License Plate", incident?.vehicle_plate || "", "Officer-Entered");
    addRow("Vehicle", [incident?.vehicle_color, incident?.vehicle_type].filter(Boolean).join(" ") || "", "Officer-Entered");
    addRow("Severity", incident?.severity || "", "Officer-Entered");
    addRow("Status", incident?.status || "", "System");
    addRow("Location", incident?.location_address || "", "Officer-Entered");
    addRow("Date/Time", incident?.created_at || "", "System");
    addRow("Officer", data.officer?.full_name || "", "Officer-Entered");
    addRow("Badge #", data.officer?.badge_number || "", "Officer-Entered");
    addRow("Station", data.officer?.station || "", "Officer-Entered");
// eslint-disable-next-line
    incident?.description ? addRow("Description", incident.description, "Officer-Entered") : null;
    addRow("");

    // AI Analysis
    if (options.includeAIAnalysis && aiAnalyses.length > 0) {
      addRow("=== AI ANALYSIS RESULTS (AI-Generated — Requires Review) ===");
      addRow("Analysis ID", "Violation Type", "Confidence", "Vehicle", "License Plate", "Plate Confidence", "Severity", "Provider", "Confirmed", "Date/Time");
      aiAnalyses.forEach((a) => {
        addRow(
          a.id || "",
          a.violation_type || "",
          a.confidence_score != null ? `${Math.round(a.confidence_score * 100)}%` : "",
          [a.vehicle_color, a.vehicle_type, a.vehicle_make, a.vehicle_model].filter(Boolean).join(" ") || "",
          a.license_plate || "",
          a.license_plate_confidence != null ? `${Math.round(a.license_plate_confidence)}%` : "",
          a.severity || "",
          a.provider_id || "",
          a.is_confirmed === true ? "Confirmed" : a.is_confirmed === false ? "Rejected" : "Pending",
          a.created_at || ""
        );
      });
      addRow("");
    }

    // ANPR
    if (options.includeAIAnalysis && anprScans.length > 0) {
      addRow("=== ANPR SCANS (AI-Generated — Requires Review) ===");
      addRow("Plate Text", "Normalized", "Confidence", "Vehicle Type", "Color", "Verified", "Corrected", "Date/Time");
      anprScans.forEach((s) => {
        addRow(
          s.plate_text,
          s.normalized_plate || s.plate_text,
          `${Math.round(s.plate_confidence)}%`,
          s.vehicle_type || "",
          s.vehicle_color || "",
          s.officer_verified ? "Yes" : "No",
          s.officer_corrected_text || "",
          s.scanned_at || ""
        );
      });
      addRow("");
    }

    // Evidence
    if (options.includeEvidence && evidence.length > 0) {
      addRow("=== DIGITAL EVIDENCE (Original Files) ===");
      addRow("ID", "Type", "Description", "Size (MB)", "MIME Type", "SHA-256 Hash", "Uploaded", "Status");
      evidence.forEach((e) => {
        addRow(
          e.id?.substring(0, 8) || "",
          e.type || "",
          e.description || "",
          e.file_size ? (e.file_size / 1024 / 1024).toFixed(2) : "",
          e.mime_type || "",
          e.sha256_hash || "",
          e.uploaded_at || "",
          e.evidence_status || ""
        );
      });
      addRow("");
    }

    // Persons
    if (persons.length > 0) {
      addRow("=== INVOLVED PERSONS ===");
      addRow("Name", "Role", "ID Type", "ID Number", "Phone", "Email");
      persons.forEach((p) => {
        addRow(p.full_name, p.role, p.id_type, p.id_number || "", p.phone || "", p.email || "");
      });
    }

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = `TrafficWatch_Report_${data.incident?.id || options.incidentId}_${Date.now()}.csv`;

    return { success: true, blob, url, filename, data };
  } catch (err) {
    return { success: false, error: `CSV generation failed: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

// ─── Generate JSON ──────────────────────────────────────

export function generateJson(data: ReportData, options: ReportOptions): ReportResult {
  try {
    const exportData = {
      report: {
        generated_at: new Date().toISOString(),
        incident_id: data.incident?.id || options.incidentId,
        format: "json",
        source_labeling: options.sourceLabeling,
      },
      metadata: {
        generator: "TrafficWatch AI Report Engine",
        version: "1.0",
        agency: "Liberia National Police Traffic Division",
        classification: "CONFIDENTIAL — Law Enforcement Use Only",
      },
      incident: data.incident
        ? {
            id: data.incident.id,
            type: data.incident.title,
            description: data.incident.description,
            plate: data.incident.vehicle_plate,
            vehicle: {
              type: data.incident.vehicle_type,
              color: data.incident.vehicle_color,
            },
            location: {
              address: data.incident.location_address,
              lat: data.incident.location_lat,
              lng: data.incident.location_lng,
              county: data.countyData?.county || null,
            },
            severity: data.incident.severity,
            status: data.incident.status,
            created_at: data.incident.created_at,
            updated_at: data.incident.updated_at,
            _source: "officer_entered" as const,
          }
        : null,
      officer: data.officer
        ? {
            id: data.officer.id,
            name: data.officer.full_name,
            badge: data.officer.badge_number,
            station: data.officer.station,
            role: data.officer.role,
            department: data.officer.department,
            _source: "officer_entered" as const,
          }
        : null,
      ai_analysis: options.includeAIAnalysis
        ? data.aiAnalyses.map((a) => ({
            id: a.id,
            violation_type: a.violation_type,
            confidence: a.confidence_score,
            vehicle: {
              type: a.vehicle_type,
              color: a.vehicle_color,
              make: a.vehicle_make,
              model: a.vehicle_model,
            },
            license_plate: a.license_plate,
            license_plate_confidence: a.license_plate_confidence,
            detected_objects: a.detected_objects,
            ai_summary: a.ai_summary,
            severity: a.severity,
            provider: a.provider_id,
            is_confirmed: a.is_confirmed,
            reviewed_by: a.reviewed_by,
            reviewed_at: a.reviewed_at,
            created_at: a.created_at,
            _source: "ai_generated" as const,
          }))
        : [],
      anpr_scans: options.includeAIAnalysis
        ? data.anprScans.map((s) => ({
            id: s.id,
            plate_text: s.plate_text,
            normalized_plate: s.normalized_plate,
            confidence: s.plate_confidence,
            vehicle_type: s.vehicle_type,
            vehicle_color: s.vehicle_color,
            officer_verified: s.officer_verified,
            officer_corrected_text: s.officer_corrected_text,
            scanned_at: s.scanned_at,
            _source: ("ai_generated" as const),
          }))
        : [],
      evidence: options.includeEvidence
        ? data.evidence.map((e) => ({
            id: e.id,
            type: e.type,
            description: e.description,
            file_size: e.file_size,
            mime_type: e.mime_type,
            sha256_hash: e.sha256_hash,
            captured_at: e.captured_at,
            capture_location: e.capture_lat != null ? { lat: e.capture_lat, lng: e.capture_lng } : null,
            uploaded_at: e.uploaded_at,
            officer_id: e.officer_id,
            evidence_status: e.evidence_status,
            _source: "original_evidence" as const,
          }))
        : [],
      involved_persons: data.persons.map((p) => ({
        name: p.full_name,
        role: p.role,
        id_type: p.id_type,
        id_number: p.id_number,
        phone: p.phone,
        email: p.email,
        _source: "officer_entered" as const,
      })),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      activity_log: data.logs.map((l: any) => ({
        action: l.action,
        performed_by: l.performed_by,
        timestamp: l.created_at,
        _source: "system" as const,
      })),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = `TrafficWatch_Report_${data.incident?.id || options.incidentId}_${Date.now()}.json`;

    return { success: true, blob, url, filename, data };
  } catch (err) {
    return { success: false, error: `JSON generation failed: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

// ─── Unified Report Generator ───────────────────────────

export async function generateReport(options: ReportOptions): Promise<ReportResult> {
  try {
    // Fetch data
    const data = await fetchReportData(options.incidentId);

    if (!data.incident) {
      return { success: false, error: "Incident not found." };
    }

    // Generate based on format
    switch (options.format) {
      case "pdf":
        return await generatePdf(data, options);
      case "csv":
        return generateCsv(data, options);
      case "json":
        return generateJson(data, options);
      default:
        return { success: false, error: `Unsupported format: ${options.format}` };
    }
  } catch (err) {
    return {
      success: false,
      error: `Report generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

// ─── Save report to history ─────────────────────────────

export async function saveReportHistory(
  incidentId: string,
  userId: string,
  options: ReportOptions,
  reportUrl?: string,
  fileSize?: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("save_report_history", {
      p_incident_id: incidentId,
      p_generated_by: userId,
      p_report_type: options.scope,
      p_format: options.format,
      p_title: `Incident Report - ${incidentId}`,
      p_file_url: reportUrl || null,
      p_file_size: fileSize || null,
      p_include_evidence: options.includeEvidence,
      p_include_ai_analysis: options.includeAIAnalysis,
      p_include_signatures: options.includeSignatures,
      p_source_labeling: options.sourceLabeling,
      p_officer_notes: options.officerNotes || null,
    });

    if (error) throw error;
    return data as string;
  } catch (err) {
    console.error("[ReportGenerator] Failed to save report history:", err);
    return null;
  }
}
