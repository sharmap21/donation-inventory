import React from "react";
import "./App.css";

/*
  Donation Inventory App (React)
  - Add / Edit / Delete donations
  - Filter by type
  - Summary for a selected type
  - Statistics: total number of donations + total dollars for "money"
  - Basic validation
  - Persists to localStorage (no server required)
*/

const LS_KEY = "donations.v1";
const TYPES = ["money", "food", "clothing", "toys", "other"];

export default function App() {
  // ---- State ----
  const [donations, setDonations] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = React.useState({
    id: null, // when not null, edit mode
    donor: "",
    type: "",
    value: "",
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  });

  const [filterType, setFilterType] = React.useState("all");
  const [summaryType, setSummaryType] = React.useState("money");

  // ---- Persist to localStorage ----
  React.useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(donations));
  }, [donations]);

  // ---- Handlers ----
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function resetForm() {
    setForm({
      id: null,
      donor: "",
      type: "",
      value: "",
      date: new Date().toISOString().slice(0, 10),
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const donor = form.donor.trim();
    const type = form.type;
    const valueNum = Number(form.value);
    const date = form.date;

    // Basic validation
    if (!donor || !type || !date || !valueNum || valueNum <= 0) {
      alert("Please fill all fields with valid values.");
      return;
    }

    if (form.id) {
      // Edit existing
      setDonations((prev) =>
        prev.map((d) =>
          d.id === form.id ? { ...d, donor, type, value: valueNum, date } : d
        )
      );
    } else {
      // New donation
      const id =
        (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
        String(Date.now());
      const newItem = { id, donor, type, value: valueNum, date };
      setDonations((prev) => [newItem, ...prev]);
    }

    resetForm();
  }

  function handleEdit(id) {
    const d = donations.find((x) => x.id === id);
    if (!d) return;
    setForm({
      id: d.id,
      donor: d.donor,
      type: d.type,
      value: String(d.value),
      date: d.date,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!window.confirm("Delete this donation?")) return;
    setDonations((prev) => prev.filter((x) => x.id !== id));
  }

  // ---- Derived data ----
  const filtered =
    filterType === "all"
      ? donations
      : donations.filter((d) => d.type === filterType);

  const statCount = donations.length;
  const statMoney = donations
    .filter((d) => d.type === "money")
    .reduce((sum, d) => sum + Number(d.value || 0), 0);

  const summaryItems = donations.filter((d) => d.type === summaryType);
  const summaryCount = summaryItems.length;
  const summaryTotal = summaryItems.reduce(
    (acc, d) => acc + Number(d.value || 0),
    0
  );

  // ---- UI ----
  return (
    <main className="container">
      <h1>Donation Inventory</h1>

      {/* Form */}
      <section className="card">
        <h2>{form.id ? "Edit Donation" : "Add Donation"}</h2>
        <form onSubmit={handleSubmit} className="grid">
          <label>
            Donor&apos;s Name
            <input
              type="text"
              name="donor"
              placeholder="Jane Doe"
              value={form.donor}
              onChange={handleChange}
            />
          </label>

          <label>
            Type of Donation
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="">Select type</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {capitalize(t)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Quantity / Amount
            <input
              type="number"
              name="value"
              min="1"
              step="1"
              placeholder="e.g., 50"
              value={form.value}
              onChange={handleChange}
            />
          </label>

          <label>
            Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </label>

          <div className="actions">
            <button type="submit">
              {form.id ? "Save Changes" : "Add Donation"}
            </button>
            {form.id && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                title="Cancel edit"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {form.type === "money" && (
          <p className="hint">
            For <strong>Money</strong>, the value is treated as dollars.
          </p>
        )}
      </section>

      {/* Filters & Summary */}
      <section className="card">
        <h2>Filter &amp; Summary</h2>
        <div className="grid">
          <label>
            Filter by Type
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {capitalize(t)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Summary for Type
            <select
              value={summaryType}
              onChange={(e) => setSummaryType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {capitalize(t)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="summary">
          <strong>Summary for “{capitalize(summaryType)}”</strong>
          <div>
            Count: <b>{summaryCount}</b> — Total{" "}
            {summaryType === "money" ? "Amount ($):" : "Quantity:"}{" "}
            <b>{summaryTotal}</b>
          </div>
        </div>
      </section>

      {/* Donation List */}
      <section className="card">
        <h2>Donations</h2>
        {filtered.length === 0 ? (
          <p className="muted">No donations to show.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Type</th>
                <th>Qty/Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.donor}</td>
                  <td>{capitalize(d.type)}</td>
                  <td>{d.type === "money" ? `$${d.value}` : d.value}</td>
                  <td>{d.date}</td>
                  <td className="row-actions">
                    <button onClick={() => handleEdit(d.id)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(d.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Statistics */}
      <section className="card">
        <h2>Statistics</h2>
        <ul className="stats">
          <li>
            <strong>Total number of donations:</strong> {statCount}
          </li>
          <li>
            <strong>Total amount donated (money):</strong> ${statMoney}
          </li>
        </ul>
      </section>
    </main>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
