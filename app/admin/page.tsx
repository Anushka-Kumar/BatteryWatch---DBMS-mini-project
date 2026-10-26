"use client";

import { useEffect, useState } from "react";

type User = {
  user_id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  created_at?: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/auth/users", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.error || "Unable to load users.");
        }

        const userList = result.users ?? result.data ?? [];
        setUsers(Array.isArray(userList) ? userList : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load users."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "40px",
        color: "#142238",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            background: "#14263d",
            color: "white",
            padding: "28px",
            borderRadius: "14px",
            marginBottom: "28px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "30px" }}>
            BatteryWatch — Admin
          </h1>
          <p style={{ color: "#cbd5e1", marginBottom: 0 }}>
            Registered user management
          </p>
        </div>

        <section
          style={{
            background: "white",
            borderRadius: "14px",
            padding: "28px",
            boxShadow: "0 2px 8px #0000000d",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Registered Users</h2>
          <p style={{ color: "#64748b" }}>
            User accounts stored in the BatteryWatch database.
          </p>

          {loading && <p>Loading users...</p>}

          {error && (
            <p
              style={{
                padding: "14px",
                background: "#fef2f2",
                color: "#b91c1c",
                borderRadius: "8px",
              }}
            >
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <div
                style={{
                  background: "#ecfdf5",
                  padding: "18px",
                  borderRadius: "10px",
                  margin: "20px 0",
                }}
              >
                Total registered users: <strong>{users.length}</strong>
              </div>

              {users.length === 0 ? (
                <p>No users were returned by the API.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["User ID", "Name", "Email", "Phone", "Role", "Created At"].map(
                          (heading) => (
                            <th
                              key={heading}
                              style={{
                                padding: "14px",
                                borderBottom: "1px solid #e2e8f0",
                              }}
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user.user_id}>
                          <td style={cellStyle}>{user.user_id}</td>
                          <td style={cellStyle}>{user.name}</td>
                          <td style={cellStyle}>{user.email}</td>
                          <td style={cellStyle}>{user.phone || "—"}</td>
                          <td style={cellStyle}>{user.role || "—"}</td>
                          <td style={cellStyle}>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid #e2e8f0",
};
