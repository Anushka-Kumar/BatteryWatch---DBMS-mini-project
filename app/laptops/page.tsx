"use client";

import { useEffect, useState } from "react";

type Laptop = {
  laptop_id: number;
  user_id: number;
  brand: string;
  model: string;
  os: string;
  purchase_date: string | null;
  serial_no: string;
  battery_id: number | null;
  type_id: number | null;
  initial_capacity: number | null;
  current_capacity: number | null;
  install_date: string | null;
};

export default function LaptopsPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [brand, setBrand] = useState("Dell");
  const [model, setModel] = useState("");
  const [os, setOs] = useState("Windows 11");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [userId, setUserId] = useState("");
  const [batteryTypeId, setBatteryTypeId] = useState("1");
  const [initialCapacity, setInitialCapacity] = useState("50000");
  const [currentCapacity, setCurrentCapacity] = useState("50000");
  const [batteryInstallDate, setBatteryInstallDate] = useState("");

  async function fetchLaptops() {
    try {
      setLoadError("");

      const response = await fetch("/api/laptops", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load laptops.");
      }

      setLaptops(result.data);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load laptops."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserRole() {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const result = await response.json();

      if (response.ok && result.user) {
        setIsAdmin(result.user.role === "admin");
      }
    } catch (error) {
      console.error("Unable to fetch user role:", error);
    }
  }

  useEffect(() => {
    fetchLaptops();
    fetchUserRole();
  }, []);

  function resetForm() {
    setEditingId(null);
    setBrand("Dell");
    setModel("");
    setOs("Windows 11");
    setPurchaseDate("");
    setSerialNo("");
    setUserId("");
    setBatteryTypeId("1");
    setInitialCapacity("50000");
    setCurrentCapacity("50000");
    setBatteryInstallDate("");
    setShowForm(false);
  }

  function startEditing(laptop: Laptop) {
    setMessage("");
    setEditingId(laptop.laptop_id);
    setBrand(laptop.brand);
    setModel(laptop.model);
    setOs(laptop.os || "Windows 11");
    setPurchaseDate(
      laptop.purchase_date
        ? String(laptop.purchase_date).slice(0, 10)
        : ""
    );
    setSerialNo(laptop.serial_no || "");
    setUserId(String(laptop.user_id));
    setBatteryTypeId(String(laptop.type_id || 1));
    setInitialCapacity(String(laptop.initial_capacity ?? ""));
    setCurrentCapacity(String(laptop.current_capacity ?? ""));
    setBatteryInstallDate(
      laptop.install_date
        ? String(laptop.install_date).slice(0, 10)
        : ""
    );
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveLaptop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!editingId && !isAdmin && !userId) {
      // Normal users do not need to enter a user ID.
      setUserId("");
    }

    setSaving(true);

    try {
      const payload = {
        ...(editingId ? { laptop_id: editingId } : {}),
        ...(isAdmin ? { user_id: Number(userId) } : {}),
        brand,
        model: model.trim(),
        os,
        purchase_date: purchaseDate,
        serial_no: serialNo.trim(),
        type_id: Number(batteryTypeId),
        initial_capacity: Number(initialCapacity),
        current_capacity: Number(currentCapacity),
        battery_install_date: batteryInstallDate,
      };

      const response = await fetch("/api/laptops", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save laptop.");
      }

      setMessage(
        editingId
          ? "Laptop and battery updated successfully!"
          : "Laptop and battery registered successfully!"
      );

      resetForm();
      await fetchLaptops();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save laptop."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteLaptop(laptop: Laptop) {
    const confirmed = window.confirm(
      `PERMANENTLY DELETE LAP${String(laptop.laptop_id).padStart(3, "0")} - ${laptop.brand} ${laptop.model}?\n\nThis will permanently delete:\n• Laptop and battery\n• Charging sessions\n• Maintenance records\n• Failure records\n• Battery health history\n• Diagnostic reports\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(
        `/api/laptops?laptop_id=${laptop.laptop_id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete laptop.");
      }

      setMessage("Laptop and all associated records deleted successfully!");

      if (editingId === laptop.laptop_id) {
        resetForm();
      }

      await fetchLaptops();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete laptop."
      );
    }
  }

  const filteredLaptops = laptops.filter((laptop) =>
    `LAP${String(laptop.laptop_id).padStart(3, "0")} ${laptop.brand} ${laptop.model}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const assignedBatteries = laptops.filter(
    (laptop) => laptop.battery_id !== null
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-5 text-slate-800 md:p-10">
      <a
        href="/"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Back to Dashboard
      </a>

      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            BatteryWatch / Inventory
          </p>
          <h1 className="mt-2 text-3xl font-bold">Laptops</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage registered laptops and their details.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setMessage("");
              setEditingId(null);
              setShowForm(true);
            }
          }}
          className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {showForm ? "Cancel" : "+ Add Laptop"}
        </button>
      </header>

      {message && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {loadError && (
        <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveLaptop}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            {editingId ? "Edit Laptop" : "Register a Laptop"}
          </h2>

          {isAdmin && (
            <label className="text-sm font-medium">
              User ID
              <input
                required
                type="number"
                min="1"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Enter existing user ID"
                className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
              />
            </label>
          )}

          <label className="text-sm font-medium">
            Brand
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option>Dell</option>
              <option>HP</option>
              <option>Lenovo</option>
              <option>ASUS</option>
              <option>Acer</option>
              <option>Apple</option>
              <option>Other</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Model
            <input
              required
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="e.g. Inspiron 15"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Operating system
            <select
              value={os}
              onChange={(event) => setOs(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option>Windows 11</option>
              <option>Windows 10</option>
              <option>macOS</option>
              <option>Linux</option>
              <option>Other</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Purchase date
            <input
              required
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Battery type
            <select
              required
              value={batteryTypeId}
              onChange={(event) => setBatteryTypeId(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option value="1">Lithium-ion</option>
              <option value="2">Lithium-polymer</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Initial battery capacity (mWh)
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={initialCapacity}
              onChange={(event) => setInitialCapacity(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Current battery capacity (mWh)
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={currentCapacity}
              onChange={(event) => setCurrentCapacity(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Battery installation date
            <input
              required
              type="date"
              value={batteryInstallDate}
              onChange={(event) => setBatteryInstallDate(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Serial number
            <input
              required
              value={serialNo}
              onChange={(event) => setSerialNo(event.target.value)}
              placeholder="Enter unique laptop serial number"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Register Laptop"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total laptops</p>
          <p className="mt-2 text-3xl font-bold">{laptops.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Different brands</p>
          <p className="mt-2 text-3xl font-bold">
            {new Set(laptops.map((laptop) => laptop.brand)).size}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Assigned batteries</p>
          <p className="mt-2 text-3xl font-bold">{assignedBatteries}</p>
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-bold">Laptop Inventory</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search, edit and delete registered devices.
        </p>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by ID, brand, or model..."
          className="mt-5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
        />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-4">Laptop ID</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Model</th>
                <th className="p-4">Operating system</th>
                <th className="p-4">Purchase date</th>
                <th className="p-4">Battery ID</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredLaptops.map((laptop) => (
                <tr
                  key={laptop.laptop_id}
                  className="border-b border-slate-100"
                >
                  <td className="p-4 font-semibold">
                    LAP{String(laptop.laptop_id).padStart(3, "0")}
                  </td>
                  <td className="p-4">{laptop.brand}</td>
                  <td className="p-4">{laptop.model}</td>
                  <td className="p-4">{laptop.os}</td>
                  <td className="p-4">
                    {laptop.purchase_date
                      ? String(laptop.purchase_date).slice(0, 10)
                      : "—"}
                  </td>
                  <td className="p-4">
                    {laptop.battery_id
                      ? `BAT${String(laptop.battery_id).padStart(3, "0")}`
                      : "Not assigned"}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(laptop)}
                        className="rounded-md border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteLaptop(laptop)}
                        className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading laptops from MySQL...
            </p>
          )}

          {!loading && filteredLaptops.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No laptops match your search.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Laptop and battery records are managed through the BatteryWatch API.
        </p>
      </section>
    </main>
  );
}