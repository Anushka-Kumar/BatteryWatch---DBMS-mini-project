"use client";

import { useEffect, useState } from "react";

type DiagnosticReport = {
  id: string;
  battery_id: number | string;
  diagnosis: string;
  observations: string[];
  temperature_status: string;
  recommendations: string[];
  analysis_date: string;
  risk_level: string;
  brand?: string;
  model?: string;
};

type RegisteredLaptop = {
  laptop_id: number;
  brand: string;
  model: string;
  battery_id: number | null;
};

export default function DiagnosticReportsPage() {
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [laptops, setLaptops] = useState<RegisteredLaptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedLaptopId, setSelectedLaptopId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observationsText, setObservationsText] = useState("");
  const [temperatureStatus, setTemperatureStatus] = useState("NORMAL");
  const [recommendationsText, setRecommendationsText] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");
  const [newRiskLevel, setNewRiskLevel] = useState("Low");

  async function fetchReports() {
    try {
      const response = await fetch("/api/diagnostic-reports", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load reports.");
      }

      const mapped: DiagnosticReport[] = result.data.map(
        (row: Record<string, unknown>) => ({
          id: String(row.id ?? row._id),
          battery_id: row.battery_id as number | string,
          diagnosis: String(row.diagnosis ?? ""),
          observations: Array.isArray(row.observations)
            ? row.observations.map(String)
            : [],
          temperature_status: String(row.temperature_status ?? ""),
          recommendations: Array.isArray(row.recommendations)
            ? row.recommendations.map(String)
            : [],
          analysis_date: String(row.analysis_date ?? ""),
          risk_level: String(row.risk_level ?? "Unknown"),
          brand: row.brand ? String(row.brand) : undefined,
          model: row.model ? String(row.model) : undefined,
        })
      );

      setReports(mapped);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load diagnostic reports. Check the API route.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLaptops() {
    try {
      const response = await fetch("/api/laptops", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Unable to load registered laptops.");
      }

      const available: RegisteredLaptop[] = result.data.filter(
        (item: RegisteredLaptop) => item.battery_id !== null
      );

      setLaptops(available);

      if (available.length > 0) {
        setSelectedLaptopId(String(available[0].laptop_id));
      }
    } catch (err) {
      console.error("Failed to fetch laptops:", err);
    }
  }

  useEffect(() => {
    fetchReports();
    fetchLaptops();
  }, []);

  function resetForm() {
    setEditingId(null);
    setDiagnosis("");
    setObservationsText("");
    setTemperatureStatus("NORMAL");
    setRecommendationsText("");
    setAnalysisDate("");
    setNewRiskLevel("Low");

    if (laptops.length > 0) {
      setSelectedLaptopId(String(laptops[0].laptop_id));
    }

    setShowForm(false);
  }

  function editReport(report: DiagnosticReport) {
    const laptop = laptops.find(
      (item) => Number(item.battery_id) === Number(report.battery_id)
    );

    setEditingId(report.id);
    setSelectedLaptopId(laptop ? String(laptop.laptop_id) : "");
    setDiagnosis(report.diagnosis);
    setObservationsText(report.observations.join("\n"));
    setTemperatureStatus(report.temperature_status);
    setRecommendationsText(report.recommendations.join("\n"));
    setAnalysisDate(report.analysis_date.slice(0, 10));
    setNewRiskLevel(report.risk_level);

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedLaptop = laptops.find(
      (item) => item.laptop_id === Number(selectedLaptopId)
    );

    if (!selectedLaptop || selectedLaptop.battery_id === null) {
      alert("Please select a registered laptop with an assigned battery.");
      return;
    }

    const observations = observationsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const recommendations = recommendationsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      !diagnosis.trim() ||
      !analysisDate ||
      observations.length === 0 ||
      recommendations.length === 0 ||
      !temperatureStatus.trim()
    ) {
      alert("Please complete all diagnostic report fields.");
      return;
    }

    const body = {
      battery_id: selectedLaptop.battery_id,
      diagnosis: diagnosis.trim(),
      observations,
      temperature_status: temperatureStatus,
      recommendations,
      analysis_date: analysisDate,
      risk_level: newRiskLevel,
    };

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/diagnostic-reports?id=${encodeURIComponent(editingId)}`
          : "/api/diagnostic-reports",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save report.");
      }

      if (editingId) {
        setReports((current) =>
          current.map((report) =>
            report.id === editingId
              ? {
                  ...report,
                  ...body,
                  brand: selectedLaptop.brand,
                  model: selectedLaptop.model,
                }
              : report
          )
        );

        alert("Diagnostic report updated successfully!");
      } else {
        const newReport: DiagnosticReport = {
          id: result.id,
          ...body,
          brand: selectedLaptop.brand,
          model: selectedLaptop.model,
        };

        setReports((current) => [newReport, ...current]);
        alert("Diagnostic report saved to MongoDB!");
      }

      resetForm();
    } catch (err) {
      console.error("Save report error:", err);
      alert(
        err instanceof Error ? err.message : "Unable to save diagnostic report."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport(report: DiagnosticReport) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete diagnostic report ${report.id}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/diagnostic-reports?id=${encodeURIComponent(report.id)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete report.");
      }

      setReports((current) =>
        current.filter((item) => item.id !== report.id)
      );

      if (editingId === report.id) {
        resetForm();
      }

      alert("Diagnostic report deleted successfully!");
    } catch (err) {
      console.error("Delete report error:", err);
      alert(
        err instanceof Error ? err.message : "Unable to delete report."
      );
    }
  }

  const filteredReports = reports.filter((report) => {
    const searchableText = [
      report.id,
      report.battery_id,
      report.diagnosis,
      report.risk_level,
      report.temperature_status,
      report.brand ?? "",
      report.model ?? "",
      ...report.observations,
      ...report.recommendations,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesRisk =
      riskFilter === "All" ||
      report.risk_level.toLowerCase() === riskFilter.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  const lowRisk = reports.filter(
    (r) => r.risk_level.toLowerCase() === "low"
  ).length;

  const mediumRisk = reports.filter(
    (r) => r.risk_level.toLowerCase() === "medium"
  ).length;

  const highRisk = reports.filter(
    (r) =>
      r.risk_level.toLowerCase() === "high" ||
      r.risk_level.toLowerCase() === "critical"
  ).length;

  function riskStyle(risk: string) {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-emerald-50 text-emerald-700";
      case "medium":
        return "bg-amber-50 text-amber-700";
      case "high":
      case "critical":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-5 text-slate-800 md:p-10">
      <a
        href="/"
        className="mb-8 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        ← Back to Dashboard
      </a>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            BatteryWatch / Diagnostics
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Diagnostic Reports
          </h1>

          <p className="mt-2 text-slate-500">
            Review battery diagnoses, observations and recommendations.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setShowForm(true);
            }
          }}
          className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
        >
          {showForm ? "Cancel" : "+ Add Diagnostic Report"}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={saveReport}
          className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            {editingId ? "Edit Diagnostic Report" : "Create Diagnostic Report"}
          </h2>

          <label className="text-sm font-medium sm:col-span-2">
            Select Laptop
            <select
              required
              value={selectedLaptopId}
              onChange={(event) => setSelectedLaptopId(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              {laptops.length === 0 && (
                <option value="">No registered laptops with batteries</option>
              )}

              {laptops.map((item) => (
                <option
                  key={item.laptop_id}
                  value={String(item.laptop_id)}
                >
                  {item.brand} {item.model}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Diagnosis
            <input
              required
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Enter diagnosis"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Analysis date
            <input
              required
              type="date"
              value={analysisDate}
              onChange={(event) => setAnalysisDate(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Risk level
            <select
              value={newRiskLevel}
              onChange={(event) => setNewRiskLevel(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Temperature status
            <select
              value={temperatureStatus}
              onChange={(event) => setTemperatureStatus(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option value="NORMAL">NORMAL</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Observations (one per line)
            <textarea
              required
              rows={3}
              value={observationsText}
              onChange={(event) => setObservationsText(event.target.value)}
              placeholder={"Battery capacity has decreased\nCharging temperature is elevated"}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Recommendations (one per line)
            <textarea
              required
              rows={3}
              value={recommendationsText}
              onChange={(event) => setRecommendationsText(event.target.value)}
              placeholder={"Monitor battery health\nAvoid excessive heating"}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving || laptops.length === 0}
              className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Save Diagnostic Report"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total reports",
            value: reports.length,
            color: "text-slate-900",
          },
          { label: "Low risk", value: lowRisk, color: "text-emerald-600" },
          {
            label: "Medium risk",
            value: mediumRisk,
            color: "text-amber-600",
          },
          { label: "High / Critical risk", value: highRisk, color: "text-red-600" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-slate-900">
          Diagnostic history
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Reports loaded from MongoDB.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reports..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="All">All risk levels</option>
            <option value="Low">Low risk</option>
            <option value="Medium">Medium risk</option>
            <option value="High">High risk</option>
            <option value="Critical">Critical risk</option>
          </select>
        </div>

        {loading && (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading diagnostic reports from MongoDB...
          </p>
        )}

        {error && (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && filteredReports.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            No matching diagnostic reports found.
          </p>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <div className="mt-6 space-y-5">
            {filteredReports.map((report) => (
              <article
                key={report.id}
                className="rounded-xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Report {report.id}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Battery{" "}
                      {String(report.battery_id).startsWith("BAT")
                        ? report.battery_id
                        : `BAT${String(report.battery_id).padStart(3, "0")}`}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {report.brand && report.model
                        ? `${report.brand} ${report.model}`
                        : "Laptop details unavailable"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyle(report.risk_level)}`}
                  >
                    {report.risk_level} risk
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Diagnosis
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {report.diagnosis}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Temperature status
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {report.temperature_status}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="font-semibold text-slate-800">
                    Observations
                  </h4>

                  {report.observations.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                      {report.observations.map((item, index) => (
                        <li key={`${report.id}-obs-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No observations recorded.
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <h4 className="font-semibold text-slate-800">
                    Recommendations
                  </h4>

                  {report.recommendations.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                      {report.recommendations.map((item, index) => (
                        <li key={`${report.id}-rec-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No recommendations recorded.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    Analysis date:{" "}
                    {report.analysis_date
                      ? report.analysis_date.slice(0, 10)
                      : "Not available"}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => editReport(report)}
                      className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteReport(report)}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-slate-400">
        BatteryWatch · Laptop Battery Health &amp; Degradation Analysis
      </footer>
    </main>
  );
}