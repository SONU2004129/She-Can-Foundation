import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FormSection from "./components/FormSection";
import AdminPanel from "./components/AdminPanel";
import { Submission } from "./types";
import { Sparkles, Trophy, BookOpen, Users, Compass, Laptop } from "lucide-react";

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; type: string; mongoUriConfigured: boolean } | null>(null);
  
  // Store admin session in memory or standard state
  const [adminPasswordToken, setAdminPasswordToken] = useState<string | null>(() => {
    return sessionStorage.getItem("sheCanAdminToken");
  });

  // Fetch Connection status check
  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/db-status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      console.warn("DB checker backend offline or starting up.", e);
    }
  };

  // Fetch submissions list for Admin Panel (requires authenticated token header)
  const fetchSubmissions = async (token?: string) => {
    const currentToken = token || adminPasswordToken;
    if (!currentToken) return;

    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { "Authorization": `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const list = await res.json();
        setSubmissions(list);
      } else if (res.status === 401 || res.status === 403) {
        // Clear stale session
        setAdminPasswordToken(null);
        sessionStorage.removeItem("sheCanAdminToken");
      }
    } catch (err) {
      console.error("Error retrieving submissions:", err);
    }
  };

  // On mount: check DB status and fetch list if already authenticated
  useEffect(() => {
    fetchDbStatus();
  }, []);

  useEffect(() => {
    if (adminPasswordToken) {
      fetchSubmissions();
    }
  }, [adminPasswordToken]);

  const handleLoginSuccess = (token: string) => {
    setAdminPasswordToken(token);
    sessionStorage.setItem("sheCanAdminToken", token);
  };

  const handleLogout = () => {
    setAdminPasswordToken(null);
    sessionStorage.removeItem("sheCanAdminToken");
    setSubmissions([]);
  };

  return (
    <div className="min-h-screen bg-nat-bg flex flex-col justify-between selection:bg-nat-sage/20 selection:text-nat-heading overflow-x-hidden antialiased">
      <Header 
        isAdminOpen={isAdminOpen} 
        onToggleAdmin={() => setIsAdminOpen(!isAdminOpen)} 
        isLoggedIn={!!adminPasswordToken}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        {isAdminOpen ? (
          /* Secure Administrative Submissions database dashboard */
          <AdminPanel 
            onBackToForm={() => setIsAdminOpen(false)}
            submissions={submissions}
            onRefreshData={async () => {
              await fetchSubmissions();
              await fetchDbStatus();
            }}
            dbStatus={dbStatus}
            adminPasswordToken={adminPasswordToken}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          /* Human facing marketing & scholarship submission workspace */
          <div>
            {/* Soft, beautiful feature showcases about She Can’s core values */}
            <div id="about" className="bg-white border-b border-nat-border py-12">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  {[
                    {
                      icon: <BookOpen className="h-6 w-6 text-nat-sage" />,
                      title: "10K+ Digital Scholars",
                      desc: "Comprehensive training curriculum in structural full-stack engineering, TypeScript server systems, and cloud databases."
                    },
                    {
                      icon: <Users className="h-6 w-6 text-nat-terracotta" />,
                      title: "Elite Mentorship Circles",
                      desc: "Acquire high-impact interactive training from senior software engineers and team curators globally."
                    },
                    {
                      icon: <Trophy className="h-6 w-6 text-nat-heading" />,
                      title: "Real Enterprise Placement",
                      desc: "Over 85% of our certified academy graduates land engineering career opportunities within six months."
                    }
                  ].map((feat, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-2xl transition-all hover:bg-nat-light-card">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nat-bg border border-nat-border shadow-sm">
                        {feat.icon}
                      </div>
                      <div className="space-y-1 text-left">
                        <h3 className="font-serif font-bold text-nat-heading text-sm">{feat.title}</h3>
                        <p className="font-sans text-xs text-nat-desc leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Core form section */}
            <FormSection 
              apiStatus={dbStatus ? (dbStatus.connected ? "MongoDB Atlas (Online)" : "Local Persistent Backup JSON") : null}
              onFormSubmitted={() => {
                if (adminPasswordToken) {
                  fetchSubmissions();
                }
              }}
            />
          </div>
        )}
      </main>

      <Footer onToggleAdmin={() => setIsAdminOpen(!isAdminOpen)} isAdminOpen={isAdminOpen} />
    </div>
  );
}
