import React, { useState, useEffect } from "react";
import { Submission, AdminStats } from "../types";
import { 
  Lock, RefreshCw, Search, Filter, Trash2, Mail, Calendar, 
  MessageSquare, ChevronRight, CheckCircle2, FileText, Database, 
  AlertCircle, ShieldAlert, Check, Eye
} from "lucide-react";

interface AdminPanelProps {
  onBackToForm: () => void;
  submissions: Submission[];
  onRefreshData: () => Promise<void>;
  dbStatus: { connected: boolean; type: string; mongoUriConfigured: boolean } | null;
  adminPasswordToken: string | null;
  onLoginSuccess: (token: string) => void;
}

export default function AdminPanel({ 
  onBackToForm, 
  submissions, 
  onRefreshData, 
  dbStatus,
  adminPasswordToken,
  onLoginSuccess
}: AdminPanelProps) {
  
  // Authentication states
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read" | "replied">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Inline admin edits state
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle Admin Log in
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token);
        setPasswordInput("");
      } else {
        setLoginError(data.error || "Incorrect Password. Check .env.example or settings.");
      }
    } catch (err) {
      setLoginError("Failed to reach server. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sync selected submission states
  useEffect(() => {
    if (selectedSubmission) {
      const match = submissions.find(s => s.id === selectedSubmission.id || s._id === selectedSubmission._id);
      if (match) {
        setAdminNotes(match.notes || "");
      }
    } else {
      setAdminNotes("");
    }
  }, [selectedSubmission, submissions]);

  // Handle change status
  const handleUpdateStatus = async (id: string, newStatus: "new" | "read" | "replied") => {
    if (!adminPasswordToken) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPasswordToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await onRefreshData();
        if (selectedSubmission && (selectedSubmission.id === id || selectedSubmission._id === id)) {
          setSelectedSubmission(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  // Handle save admin notes
  const handleSaveNotes = async (id: string) => {
    if (!adminPasswordToken) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPasswordToken}`
        },
        body: JSON.stringify({ notes: adminNotes })
      });

      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      alert("Error saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Handle delete submission
  const handleDelete = async (id: string) => {
    if (!adminPasswordToken) return;
    if (!window.confirm("Are you sure you want to permanently delete this form submission?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${adminPasswordToken}`
        }
      });

      if (res.ok) {
        await onRefreshData();
        setSelectedSubmission(null);
      }
    } catch (err) {
      alert("Error deleting item");
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    // Artificial soft timer
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Calculate statistics
  const stats: AdminStats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === "new").length,
    read: submissions.filter(s => s.status === "read").length,
    replied: submissions.filter(s => s.status === "replied").length,
  };

  // Safe filtering logic
  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !searchLower ||
      s.name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      s.message.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  // Render Login state
  if (!adminPasswordToken) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-3xl border border-nat-border bg-white p-8 shadow-xl shadow-nat-sage/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nat-light-card text-nat-sage mb-6 shadow-sm border border-nat-border">
            <Lock className="h-6 w-6" />
          </div>
          
          <h2 className="font-serif text-2xl font-bold text-nat-heading">Admin Database Portal</h2>
          <p className="mt-2 font-sans text-xs text-nat-desc leading-relaxed">
            Please enter your administrator password to authenticate direct access to submissions data, database status, and admin logs.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4 text-left">
            <div>
              <label htmlFor="adminKey" className="block text-xs font-bold uppercase tracking-widest text-nat-muted">
                Admin Password
              </label>
              <input
                id="adminKey"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Default password is: admin123"
                className="mt-1.5 w-full rounded-xl border border-nat-border bg-nat-bg px-4 py-3 font-mono text-sm leading-none outline-none focus:border-nat-sage focus:ring-2 focus:ring-nat-sage/10 transition-all text-center placeholder:text-nat-placeholder text-nat-heading"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 font-sans text-xs text-rose-700 font-medium border border-rose-100">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-xl bg-[#8B9D8B] py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:bg-[#7A8C7A] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? "Authenticating..." : "Unlock Vault & Connect"}
            </button>
          </form>

          <p className="mt-6 font-sans text-[11px] text-nat-muted">
            Forgot password? Set <code className="rounded bg-nat-light-card px-1 py-0.5 text-[10px] text-nat-desc">ADMIN_PASSWORD</code> in your secrets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 text-left bg-nat-bg">
      
      {/* DB Setup helper header details alert */}
      <div className="mb-8 rounded-2xl bg-nat-heading p-6 text-[#A6A098] shadow-lg">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold tracking-tight text-white">Active Database Hub</h2>
            <p className="font-sans text-xs text-[#8E877F]">
              Direct connection schema to form responses. This provides everything required for your internship submission.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 font-sans text-xs font-medium text-white">
              <Database className="h-4 w-4 text-nat-terracotta" />
              <span>Status:</span>
              <span className={`inline-block h-2 w-2 rounded-full ${dbStatus?.connected ? 'bg-nat-sage animate-pulse' : 'bg-[#D99175] animate-pulse'}`}></span>
              <span className="font-bold text-white">{dbStatus?.type || "Local Storage"}</span>
            </div>
            
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold rounded-xl px-3 py-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* MongoDB Deployment Instructions for user! */}
        {!dbStatus?.mongoUriConfigured && (
          <div className="mt-4 border-t border-[#3D3A36] pt-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-nat-terracotta/20 text-nat-terracotta">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="text-xs text-[#8E877F] leading-normal flex-1">
              <strong className="text-white">MongoDB Integration is Ready!</strong> Currently saving submissions to local file <code className="bg-[#1C1A18] px-1 py-0.5 rounded text-nat-terracotta font-mono text-[10px]">data/submissions.json</code>.
              To connect your database, add <strong className="text-white">MONGODB_URI</strong> in the AI Studio Settings secrets panel. The backend automatically switches with zero-downtime!
            </div>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        {[
          { label: "Total Submissions", value: stats.total, color: "border-nat-border bg-white text-nat-heading" },
          { label: "New Forms", value: stats.new, color: "border-nat-border bg-white/70 text-nat-terracotta" },
          { label: "Read Checks", value: stats.read, color: "border-nat-border bg-white/70 text-nat-sage" },
          { label: "Contacted/Replied", value: stats.replied, color: "border-nat-border bg-nat-light-card text-nat-heading" },
        ].map((card, i) => (
          <div key={i} className={`rounded-xl border p-4 shadow-sm md:p-6 transition-all ${card.color}`}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#857E78]">{card.label}</div>
            <div className="mt-1.5 font-serif text-2xl font-bold sm:text-3xl">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Side: Submissions list and filtering toolbar */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border border-nat-border rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-serif font-bold text-nat-heading text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-nat-sage" />
              <span>Inbox Inquiries</span>
              <span className="text-xs font-semibold text-nat-muted">({filteredSubmissions.length})</span>
            </h3>
            
            {/* Horizontal Filter Buttons */}
            <div className="flex flex-wrap gap-1 bg-nat-light-card p-1 rounded-xl">
              {(["all", "new", "read", "replied"] as const).map((stat) => (
                <button
                  key={stat}
                  onClick={() => setStatusFilter(stat)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === stat 
                      ? "bg-white text-nat-heading shadow-sm font-semibold" 
                      : "text-nat-muted hover:text-nat-heading"
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Inputs */}
          <div className="relative">
            <Search className="absolute top-3.5 left-3 h-4 w-4 text-nat-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate name, email, or content..."
              className="w-full rounded-xl border border-nat-border pl-9 pr-4 py-3 text-xs outline-none bg-nat-bg focus:border-nat-sage focus:ring-2 focus:ring-nat-sage/10 transition-all text-nat-heading"
            />
          </div>

          {/* Submissions List Container */}
          <div className="overflow-hidden rounded-2xl border border-nat-border">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-nat-muted">
                <AlertCircle className="h-8 w-8 mx-auto text-nat-placeholder mb-2" />
                <p className="font-sans text-xs">No entries match your search or filter requirements.</p>
              </div>
            ) : (
              <div className="divide-y divide-nat-border max-h-[500px] overflow-y-auto">
                {filteredSubmissions.map((sub) => {
                  const subId = sub.id || sub._id;
                  const isSelected = selectedSubmission && (selectedSubmission._id === sub._id || selectedSubmission.id === sub.id);
                  let badgeColors = "bg-nat-light-card text-nat-muted";
                  if (sub.status === 'new') badgeColors = "bg-[#FAF5F2] text-nat-terracotta border border-nat-terracotta/20";
                  if (sub.status === 'read') badgeColors = "bg-[#F1F5F1] text-nat-sage border border-nat-sage/20";
                  if (sub.status === 'replied') badgeColors = "bg-nat-heading text-white";

                  return (
                    <div
                      key={subId}
                      onClick={() => setSelectedSubmission(sub)}
                      className={`group flex items-start gap-4 p-4 hover:bg-nat-light-card/50 transition-colors cursor-pointer text-left ${isSelected ? 'bg-nat-light-card' : ''}`}
                    >
                      {/* Status indicator pill */}
                      <span className={`block shrink-0 h-2.5 w-2.5 rounded-full mt-1.5 ${
                        sub.status === 'new' ? 'bg-nat-terracotta animate-pulse' : sub.status === 'read' ? 'bg-nat-sage' : 'bg-nat-heading'
                      }`}></span>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-sans font-semibold text-nat-heading text-sm truncate">{sub.name}</h4>
                          <span className="font-mono text-[9px] text-nat-desc shrink-0">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="font-sans text-xs text-nat-desc truncate">{sub.email}</p>
                        <p className="font-sans text-xs text-nat-muted line-clamp-1 italic">"{sub.message}"</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeColors}`}>
                          {sub.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-nat-placeholder group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Message Detailed Desk View */}
        <div className="lg:col-span-12 xl:col-span-5 relative">
          {selectedSubmission ? (
            <div className="bg-white border border-nat-border rounded-3xl p-6 shadow-md sticky top-20 text-left space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-nat-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-nat-terracotta bg-[#FAF5F2] border border-nat-terracotta/20 px-2 py-0.5 rounded">
                    Selected Entry
                  </span>
                  <h3 className="font-serif font-bold text-nat-heading text-lg mt-1">{selectedSubmission.name}</h3>
                </div>
                
                <button
                  onClick={() => handleDelete(selectedSubmission.id || selectedSubmission._id || '')}
                  className="rounded-lg p-2 text-nat-placeholder hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete Submission"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Sender info */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center gap-2.5 text-nat-desc">
                  <Mail className="h-4 w-4 text-nat-placeholder" />
                  <a href={`mailto:${selectedSubmission.email}`} className="hover:underline font-semibold text-nat-terracotta font-sans">
                    {selectedSubmission.email}
                  </a>
                </div>
                
                <div className="flex items-center gap-2.5 text-nat-muted font-sans">
                  <Calendar className="h-4 w-4 text-nat-placeholder" />
                  <span>Submitted: {new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Message content block */}
              <div className="rounded-2xl bg-nat-light-card p-4 border border-nat-border shadow-inner">
                <div className="text-nat-heading font-bold text-xs flex items-center gap-1.5 mb-2.5 uppercase tracking-wider">
                  <MessageSquare className="h-3.5 w-3.5 text-nat-placeholder" />
                  <span>Submitted Message:</span>
                </div>
                <p className="font-sans text-xs text-nat-desc whitespace-pre-wrap leading-relaxed italic">
                  "{selectedSubmission.message}"
                </p>
              </div>

              {/* Operations action row */}
              <div className="space-y-2">
                <div className="text-nat-heading font-bold text-xs uppercase tracking-widest">Update State</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { status: "new" as const, label: "Mark New", activeColor: "bg-nat-terracotta text-white" },
                    { status: "read" as const, label: "Mark Read", activeColor: "bg-nat-sage text-white" },
                    { status: "replied" as const, label: "Mark Replied", activeColor: "bg-nat-heading text-white" }
                  ].map((btn) => {
                    const isActive = selectedSubmission.status === btn.status;
                    return (
                      <button
                        key={btn.status}
                        onClick={() => handleUpdateStatus(selectedSubmission.id || selectedSubmission._id || '', btn.status)}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isActive 
                            ? btn.activeColor + " shadow-sm font-semibold" 
                            : "bg-nat-bg text-nat-muted hover:bg-nat-light-card"
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes block */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="notes" className="text-nat-heading font-bold text-xs uppercase tracking-widest">
                    Internal System Notes
                  </label>
                  {adminNotes !== (selectedSubmission.notes || "") && (
                    <button
                      onClick={() => handleSaveNotes(selectedSubmission.id || selectedSubmission._id || '')}
                      disabled={isSavingNotes}
                      className="text-[10px] font-bold text-nat-sage hover:text-nat-sage-dark cursor-pointer flex items-center gap-1"
                    >
                      <Check className="h-3 w-3 shadow-sm border border-nat-sage/30 rounded bg-white" />
                      <span>{isSavingNotes ? "Saving..." : "Save Notes"}</span>
                    </button>
                  )}
                </div>
                <textarea
                  id="notes"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="E.g., Contacted candidate via email on June 18th to setup interview..."
                  className="w-full rounded-xl border border-nat-border p-3 font-sans text-xs outline-none bg-nat-bg resize-none focus:border-nat-sage focus:bg-white focus:ring-2 focus:ring-nat-sage/10 transition-all text-nat-heading"
                />
              </div>

            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-nat-border p-12 text-center text-nat-muted sticky top-20 bg-nat-light-card/40">
              <Eye className="h-8 w-8 mx-auto text-nat-placeholder mb-3" />
              <h3 className="font-serif text-sm font-bold text-nat-heading">No Submission Selected</h3>
              <p className="mt-1 font-sans text-[11px] text-nat-muted leading-normal max-w-[200px] mx-auto">
                Select an item from the list on the left to inspect detailed text contents, log notes, or change ticket status.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
