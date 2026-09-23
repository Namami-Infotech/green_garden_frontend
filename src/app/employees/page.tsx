"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ShieldCheck, Mail, Phone, Trash2, Edit, UserCheck } from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import { UserFormModal } from "../../modules/users/components/UserFormModal";
import { userService } from "../../modules/users/services/user.service";
import { CreateUserData, UserItem } from "../../modules/users/types/index";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";
import { usePagination } from "../../hooks/use-pagination";
import { Pagination } from "../../components/Pagination";

export default function EmployeesPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const { hasRole } = useAuth();
  const { toast } = useToast();
  const isSecretary = hasRole("SECRETARY");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const usersRes = await userService.getUsers({
        search: search || undefined,
      });
      // Filter only employees/staff: SECRETARY, ACCOUNTANT, SECURITY
      const staffList = usersRes.users.filter(
        (u) => u.role === "SECRETARY" || u.role === "ACCOUNTANT" || u.role === "SECURITY"
      );
      setUsers(staffList);
    } catch (e) {
      console.error("Failed to load staff", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: CreateUserData) => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, data);
        toast.success(`Staff member "${data.name}" updated!`, "Staff Updated");
      } else {
        await userService.createUser(data);
        toast.success(`Staff member "${data.name}" added!`, "Staff Created");
      }
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchStaff();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to save staff member", "Error");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm("Are you sure you want to remove this employee/staff member?")) {
      try {
        await userService.deleteUser(id);
        toast.success("Employee removed successfully!", "Deleted");
        await fetchStaff();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to remove staff", "Error");
      }
    }
  };

  // Filter staff by selected sub-role filter if chosen
  const filteredEmployees = users.filter((u) => {
    if (!roleFilter) return true;
    return u.role === roleFilter;
  });

  const { paginatedItems: paginatedStaff, paginationProps } = usePagination(filteredEmployees, 10);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SECRETARY":
        return <span className="badge badge-secretary">Secretary</span>;
      case "ACCOUNTANT":
        return <span className="badge badge-accountant">Accountant</span>;
      case "SECURITY":
        return <span className="badge badge-security">Security Guard</span>;
      default:
        return <span className="badge badge-user">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="badge badge-active" style={{ fontSize: "0.72rem" }}>Active</span>;
      case "PENDING":
        return <span className="badge badge-occupied" style={{ fontSize: "0.72rem" }}>Pending</span>;
      default:
        return <span className="badge badge-vacant" style={{ fontSize: "0.72rem" }}>Inactive</span>;
    }
  };

  return (
    <DashboardShell title="Society Employees & Staff Management">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Top Info Banner */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
            border: "1px solid #a7f3d0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#065f46" }}>
                Staff & Administration Department
              </div>
              <div style={{ fontSize: "0.8rem", color: "#047857" }}>
                Management of Secretaries, Accountants, and Society Security Guards
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#047857", fontWeight: 600 }}>Total Staff</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#065f46" }}>{users.length}</div>
            </div>
            <div style={{ width: "1px", backgroundColor: "#a7f3d0" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#047857", fontWeight: 600 }}>Active Staff</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#065f46" }}>
                {users.filter((u) => u.status === "ACTIVE").length}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, maxWidth: "600px" }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "12px" }}
              />
              <input
                type="text"
                placeholder="Search staff name, email, or phone..."
                className="form-input"
                style={{ paddingLeft: "42px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: "180px" }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Staff Roles</option>
              <option value="SECRETARY">Secretaries</option>
              <option value="ACCOUNTANT">Accountants</option>
              <option value="SECURITY">Security Guards</option>
            </select>
          </form>

          {isSecretary && (
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              <Plus size={18} />
              Add Employee / Staff
            </button>
          )}
        </div>

        {/* Staff Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
            Loading employees directory...
          </div>
        ) : (
          <div className="custom-table-container">
            <div className="table-scroll-wrapper">
              <table className="custom-table" style={{ minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>Staff Member</th>
                    <th style={{ whiteSpace: "nowrap" }}>Designation / Role</th>
                    <th style={{ whiteSpace: "nowrap" }}>Department / Scope</th>
                    <th style={{ whiteSpace: "nowrap" }}>Contact Information</th>
                    <th style={{ whiteSpace: "nowrap" }}>Status</th>
                    <th style={{ textAlign: "right", whiteSpace: "nowrap", minWidth: "120px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((staff) => (
                      <tr key={staff.id}>
                        {/* Member Name */}
                        <td>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{staff.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Staff ID: #{staff.id}</div>
                        </td>

                        {/* Role Badge */}
                        <td>{getRoleBadge(staff.role)}</td>

                        {/* Scope */}
                        <td>
                          {staff.role === "SECRETARY" && (
                            <span style={{ fontSize: "0.8rem", color: "#4f46e5", fontWeight: 600 }}>
                              Society Administration & Governance
                            </span>
                          )}
                          {staff.role === "ACCOUNTANT" && (
                            <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600 }}>
                              Financial Collections & Cash Register
                            </span>
                          )}
                          {staff.role === "SECURITY" && (
                            <span style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 600 }}>
                              Gate Security & Visitor Check-In
                            </span>
                          )}
                        </td>

                        {/* Contact */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "#334155" }}>
                              <Mail size={12} color="#64748b" />
                              <span>{staff.email}</span>
                            </div>
                            {staff.phone && (
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b" }}>
                                <Phone size={12} color="#64748b" />
                                <span>{staff.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td>{getStatusBadge(staff.status)}</td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          {isSecretary && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <button
                                onClick={() => handleOpenEditModal(staff)}
                                className="btn btn-secondary"
                                style={{
                                  padding: 0,
                                  width: "32px",
                                  height: "32px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "6px",
                                }}
                                title="Edit Employee"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(staff.id)}
                                className="btn btn-danger"
                                style={{
                                  padding: 0,
                                  width: "32px",
                                  height: "32px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "6px",
                                }}
                                title="Delete Employee"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination {...paginationProps} />
          </div>
        )}

        {/* Modal for creating/editing staff */}
        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSaveUser}
          initialData={editingUser}
          mode="STAFF"
        />
      </div>
    </DashboardShell>
  );
}
