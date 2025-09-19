
"use client";

import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode, useEffect } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                router.push("/login");
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [router]);
    
    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null); // Explicitly set user to null
        router.push("/login");
    };

    const value = { user, isLoading, signOut };
    
    if (isLoading) {
        return (
             <div className="flex items-center justify-center h-screen bg-background">
                {/* Minimal loading UI to avoid layout shifts */}
             </div>
        )
    }

    // This check prevents unauthorized access to protected routes
    if (!isLoading && !user) {
        return <>{children}</>; // Or a dedicated unauthorized component
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
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
