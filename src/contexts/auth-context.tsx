"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NameInputDialog } from "@/components/name-input-dialog";

interface User {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<string>;
  register: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/create-account"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showNameDialog, setShowNameDialog] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const refreshUser = async () => {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                setUser(userData.user);
                return userData.user;
            } else {
                setUser(null);
                return null;
            }
        } catch (error) {
            console.error('Refresh user error:', error);
            setUser(null);
            return null;
        }
    };

    useEffect(() => {
        const initAuth = async (): Promise<User | null> => {
            try {
                // Verify token with backend using HTTP-only cookie
                const response = await fetch('/api/auth/me', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData.user);
                    
                    // Check if user needs to set name (first time login)
                    if (userData.user && !userData.user.name) {
                        setShowNameDialog(true);
                    }
                    
                    return userData.user;
                } else {
                    // Token invalid or not present, ensure user is null
                    setUser(null);
                    return null;
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setUser(null); // Ensure user is null on error
                return null;
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []); // Run only once on mount

    // Separate effect for handling redirection logic after user state is determined.
    useEffect(() => {
        if (isLoading) {
            return; // Don't do anything while loading
        }

        const isAdminRoute = pathname?.startsWith('/admin') || false;
        const isPublicRoute = pathname ? publicPaths.includes(pathname) : false;

        if (user) { // User is logged in
            if (user.role === 'admin' && !isAdminRoute && pathname === '/') {
                router.replace('/admin'); // Admin on home page -> redirect to admin
            } else if (user.role !== 'admin' && isAdminRoute) {
                router.replace('/'); // Non-admin on admin page -> redirect to home
            }
        } else { // User is not logged in
            if (!isPublicRoute) {
                router.replace('/login'); // Not logged in and not on a public page -> redirect to login
            }
        }
    }, [user, isLoading, pathname, router]);
    
    const login = async (email: string, password: string): Promise<string> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                // KHÔNG set lại cookie token ở client!
                // if (data?.token) localStorage.setItem('token', data.token);

                // Force reload để cookie httpOnly được gửi lên server
                window.location.href = data.redirectTo || (data.user?.role === 'admin' ? '/admin' : '/');
                return data.redirectTo;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
        } catch (error) {
            throw error;
        }
    };

    const register = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                
                // Force reload để cookie httpOnly được gửi lên server và redirect
                const redirectTo = data.redirectTo || (data.user?.role === 'admin' ? '/admin' : '/');
                window.location.href = redirectTo;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }
        } catch (error) {
            throw error; // Re-throw to be caught by the component
        }
    };
    
    const signOut = async () => {
        try {
            // Call logout API to clear cookies on server
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout API error:', error);
        }
        setUser(null);
        setShowNameDialog(false);
        router.push("/login");
    };

    const handleUpdateName = async (name: string) => {
        try {
            const response = await fetch('/api/user/update-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update name');
            }

            // Refresh user data
            await refreshUser();
        } catch (error) {
            throw error;
        }
    };

    const value = { user, isLoading, signOut, login, register, refreshUser };

    return (
        <AuthContext.Provider value={value}>
            {isLoading ? <div /> : (
                <>
                    {children}
                    {showNameDialog && user && (
                        <NameInputDialog
                            open={showNameDialog}
                            onOpenChange={setShowNameDialog}
                            onSubmit={handleUpdateName}
                            userEmail={user.email}
                        />
                    )}
                </>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
