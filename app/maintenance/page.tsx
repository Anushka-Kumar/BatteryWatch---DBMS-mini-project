
"use client";

import { useState } from "react";

type Maintenance = {
  id: string;
  battery: string;
  laptop: string;
  date: string;
  issue: string;
  action: string;
  cost: number;
  centre: string;
  location: string;
  status: "Completed" | "Pending";
};

const initialRecords: Maintenance[] = [
  {
    id: "MNT001",
    battery: "BAT001",
    laptop: "Dell Inspiron 15",
    date: "2026-08-12",
    issue: "Battery draining quickly",
    action: "Battery diagnostics and calibration",
    cost: 1200,
    centre: "Dell Service Centre",
    location: "Bengaluru",
    status: "Completed",
  },
  {
    id: "MNT002",
    battery: "BAT002",
    laptop: "HP Pavilion 14",
    date: "2026-09-04",
    issue: "Overheating during charging",
    action: "Cooling system inspection",
    cost: 1800,
    centre: "HP Service Centre",
    location: "Bengaluru",
    status: "Completed",
  },
  {
    id: "MNT003",
    battery: "BAT003",
    laptop: "Lenovo IdeaPad Slim 5",
    date: "2026-10-20",
    issue: "Rapid capacity degradation",
    action: "Battery replacement recommended",
    cost: 0,
    centre: "Lenovo Service Centre",
    location: "Bengaluru",
    status: "Pending",
  },
];

export default function MaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [battery, setBattery] = useState("BAT001");
  const [laptop, setLaptop] = useState("Dell Inspiron 15");
  const [date, setDate] = useState("");
  const [issue, setIssue] = useState("");
  const [action, setAction] = useState("");
  const [cost, setCost] = useState("0");
  const [centre, setCentre] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"Completed" | "Pending">("Pending");

  const filtered = records.filter((record) => {
    const matchesSearch =
      `${record.id} ${record.battery} ${record.laptop} ${record.issue} ${record.centre}`
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesSearch && (filter === "All" || record.status === filter);
  });

  const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
  const pendingCount = records.filter(
    (record) => record.status === "Pending"
  ).length;

  function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(cost);
    if (!Number.isFinite(amount) || amount < 0) {
      alert("Enter a valid non-negative service cost.");
      return;
    }

    const newRecord: Maintenance = {
      id: `MNT${String(Date.now()).slice(-6)}`,
      battery,
      laptop,
      date,
      issue: issue.trim(),
      action: action.trim(),
      cost: amount,
      centre: centre.trim(),
      location: location.trim(),
      status,
    };

    setRecords((current) => [newRecord, ...current]);
    setDate("");
    setIssue("");
    setAction("");
    setCost("0");
    setCentre("");
    setLocation("");
    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-5 text-slate-800 md:p-10">
      <a href="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to Dashboard
      </a>

      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            BatteryWatch / Service
          </p>
          <h1 className="mt-2 text-3xl font-bold">Maintenance Records</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track battery issues, service actions and maintenance expenses.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
        >
          {showForm ? "Cancel" : "+ Add Maintenance"}
        </button>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total records</p>
          <p className="mt-3 text-3xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pending maintenance</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Recorded service cost</p>
          <p className="mt-3 text-3xl font-bold">
            ₹{totalCost.toLocaleString("en-IN")}
          </p>
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={addRecord}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">New maintenance record</h2>

          <label className="text-sm font-medium">
            Battery
            <select
              value={battery}
              onChange={(event) => {
                const id = event.target.value;
                setBattery(id);
                const names: Record<string, string> = {
                  BAT001: "Dell Inspiron 15",
                  BAT002: "HP Pavilion 14",
                  BAT003: "Lenovo IdeaPad Slim 5",
                  BAT004: "ASUS VivoBook 15",
                };
                setLaptop(names[id]);
              }}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option value="BAT001">BAT001</option>
              <option value="BAT002">BAT002</option>
              <option value="BAT003">BAT003</option>
              <option value="BAT004">BAT004</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Laptop
            <input readOnly value={laptop} className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 p-3" />
          </label>

          <label className="text-sm font-medium">
            Service date
            <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-200 p-3" />
          </label>

          <label className="text-sm font-medium">
            Service cost (₹)
            <input required type="number" min="0" value={cost} onChange={(event) => setCost(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-200 p-3" />
          </label>

          <label className="text-sm font-medium">
            Issue description
            <input required value={issue} onChange={(event) => setIssue(event.target.value)} placeholder="Describe the issue" className="mt-2 block w-full rounded-lg border border-slate-200 p-3" />
          </label>

          <label className="text-sm font-medium">
            Action taken
            <input required value={action} onChange={(event) => setAction(event.target.value)} placeholder="Describe the service" className="mt-2 block w-full rounded-lg border border-slate-200 p-3" />
          </label>

          <label className="text-sm font-medium">
            Service centre
            <input required value={centre} onChange={(event) => setCentre(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-200 p-3" />
          </label>

          <label className="text-sm font-medium">
            Location
            <input required value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-200 p-3" />
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as "Completed" | "Pending")} className="mt-2 block w-full rounded-lg border border-slate-200 p-3">
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <button type="submit" className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white sm:col-span-2">
            Save Record
          </button>
        </form>
      )}

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-bold">Service history</h2>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, battery, issue or service centre..." className="min-w-0 flex-1 rounded-lg border border-slate-200 p-3 text-sm" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <option>All</option>
            <option>Completed</option>
            <option>Pending</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-4">Record ID</th>
                <th className="p-4">Battery</th>
                <th className="p-4">Date</th>
                <th className="p-4">Issue</th>
                <th className="p-4">Action taken</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Service centre</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="border-b border-slate-100">
                  <td className="p-4 font-semibold">{record.id}</td>
                  <td className="p-4">
                    {record.battery}
                    <p className="mt-1 text-xs text-slate-400">{record.laptop}</p>
                  </td>
                  <td className="p-4">{record.date}</td>
                  <td className="p-4">{record.issue}</td>
                  <td className="p-4">{record.action}</td>
                  <td className="p-4">₹{record.cost.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    {record.centre}
                    <p className="mt-1 text-xs text-slate-400">{record.location}</p>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No matching records.</p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Illustrative demo data only; records are not yet saved to MySQL.
        </p>
      </section>
    </main>
  );
}
