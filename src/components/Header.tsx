import { Sparkles, ShieldCheck } from "lucide-react";

interface HeaderProps {
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({ isAdminOpen, onToggleAdmin, isLoggedIn, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-nat-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div 
          className="flex cursor-pointer items-center space-x-2 transition-transform hover:scale-102"
          onClick={() => { if (isAdminOpen) onToggleAdmin(); }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nat-sage text-white font-bold text-sm shadow-sm">
            S
          </div>
          <div>
            <span className="font-sans text-lg font-semibold tracking-tight text-nat-heading">
              She Can Foundation
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest text-nat-muted">
            <a href="#about" className="transition-colors hover:text-nat-sage">Our Mission</a>
            <a href="#initiatives" className="transition-colors hover:text-nat-sage">Initiatives</a>
            <a href="#contact" className={`transition-colors hover:text-nat-sage ${!isAdminOpen ? 'font-bold border-b-2 border-nat-text text-nat-heading' : ''}`}>Apply</a>
          </nav>
          
          <div className="h-6 w-[1px] bg-nat-border hidden md:block"></div>

          {isAdminOpen ? (
            <div className="flex items-center space-x-2">
              {isLoggedIn && (
                <button
                  onClick={onLogout}
                  className="rounded-lg bg-nat-light-card px-3.5 py-1.5 font-sans text-xs font-bold text-nat-muted hover:bg-nat-border transition-all cursor-pointer"
                >
                  Log Out
                </button>
              )}
              <button
                onClick={onToggleAdmin}
                className="flex items-center space-x-1.5 rounded-lg bg-nat-sage px-4 py-2 font-sans text-xs font-bold text-white shadow-md transition-all hover:bg-nat-sage-dark cursor-pointer shadow-nat-sage/20"
              >
                <span>Back to Form</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onToggleAdmin}
              className="flex items-center space-x-1.5 rounded-lg border border-nat-border bg-white px-3.5 py-1.5 font-sans text-xs font-semibold text-nat-muted shadow-sm transition-all hover:bg-nat-light-card cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-nat-sage" />
              <span>Admin Database</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
