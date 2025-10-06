'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import type { User } from '@supabase/supabase-js';
import { LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';

export function HeaderAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.refresh();
    router.push('/');
  };

  const getUserInitial = () => {
    if (!user) return '?';
    const name = user.user_metadata?.full_name || user.email;
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 focus:outline-none"
          aria-label="User menu"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {getUserInitial()}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border border-border z-50">
            <div className="py-1">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/dashboard');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/account-settings');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Account Settings
                </button>
              </div>

              {/* Sign Out */}
              <div className="py-1 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/sign-in')}
      >
        Sign In
      </Button>
      <Button
        size="sm"
        onClick={() => router.push('/sign-up')}
      >
        Get Started
      </Button>
    </div>
  );
}
