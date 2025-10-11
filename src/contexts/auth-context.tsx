
"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: number;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Verify token with backend
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData.user);
                    } else {
                        // Token invalid, remove it
                        localStorage.removeItem('token');
                        if (!publicPaths.includes(pathname)) {
                            router.push("/login");
                        }
                    }
                } else {
                    // No token, redirect to login if on protected route
                    if (!publicPaths.includes(pathname)) {
                        router.push("/login");
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('token');
                if (!publicPaths.includes(pathname)) {
                    router.push("/login");
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [router, pathname]);
    
    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                setUser(data.user);
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
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                setUser(data.user);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }
        } catch (error) {
            throw error;
        }
    };
    
    const signOut = async () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push("/login");
    };

    const value = { user, isLoading, signOut, login, register };
    
    // While loading, show a skeleton screen
    if (isLoading) {
        return (
             <div className="flex items-center justify-center h-screen bg-background">
                <div className="space-y-4 w-1/2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
             </div>
        );
    }
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
