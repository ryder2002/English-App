
"use client";

import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ["/login", "/signup", "/forgot-password"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
            
            // If user is not logged in AND the current path is NOT a public one, redirect to login.
            if (!currentUser && !publicPaths.includes(pathname)) {
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);
    
    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        router.push("/login");
    };

    const value = { user, isLoading, signOut };
    
    // While loading, show a skeleton screen. This prevents rendering children
    // that might depend on the user object before it's available.
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
    
    // If not loading and no user, but we are on a protected route,
    // the useEffect above will handle redirection. If we are on a public page,
    // children (the login/signup/forgot-password page) should be rendered.
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
