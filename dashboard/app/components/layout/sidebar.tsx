import * as React from 'react';
import { Link, useRouter } from '@tanstack/react-router';

interface NavLinkProps {
  to: string;
  label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, label }) => {
  const router = useRouter();
  const isActive = router.state.location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
      }`}
    >
      {label}
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-56 border-r bg-muted/30 h-full flex flex-col">
      <div className="px-4 py-4 border-b">
        <h1 className="text-lg font-semibold tracking-tight">CommitCrab 🦀</h1>
        <p className="text-xs text-muted-foreground">PR Intelligence</p>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        <NavLink to="/" label="Dashboard" />
        <NavLink to="/analytics" label="Analytics" />
      </nav>
      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CommitCrab</p>
      </div>
    </aside>
  );
};
