"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { UserProfile, SuspiciousActivity } from '@/lib/types';
import { useToast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to get client's IP and location from a third-party service
async function getClientIpAndLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
            throw new Error('ipapi.co failed');
        }
        const data = await response.json();
        const { ip, latitude, longitude } = data;
        
        if (ip && latitude && longitude) {
            return { ip, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
        } else {
             // If primary service gives partial data, try fallback
             return getClientIpAndLocationFallback();
        }

    } catch (error) {
        console.error("Could not get IP/Location with ipapi.co, trying fallback:", error);
         // Fallback to the alternative method if an error occurs
        return getClientIpAndLocationFallback();
    }
}

async function getClientIpAndLocationFallback() {
     try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (!ipResponse.ok) throw new Error('Failed to fetch IP from ipify');
        const ipData = await ipResponse.json();
        const ip = ipData.ip;
        
        if (!ip) return { ip: 'Unknown', location: 'Unknown' };
        
        // Use HTTPS for the location service
        const locationResponse = await fetch(`https://ip-api.com/json/${ip}`);
        if (!locationResponse.ok) return { ip, location: 'Could not determine location' };
        const locationData = await locationResponse.json();

        if (locationData.status === 'success') {
            const { lat, lon } = locationData;
            return { ip, location: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
        } else {
             return { ip, location: 'Location not found' };
        }

    } catch (error) {
        console.error("Could not get IP/Location with fallback:", error);
        return { ip: 'Unknown', location: 'Unknown' };
    }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
  
    try {
        const storedUser = localStorage.getItem('user');
        const isProtectedRoute = ['/komandir', '/sub-komandir'].some(p => pathname.startsWith(p));

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (pathname === '/login') {
            const destination = parsedUser.role === 'commander' ? '/komandir' : '/sub-komandir';
            router.replace(destination);
          }
        } else if (isProtectedRoute) {
            router.replace('/login');
        }
    } catch (error) {
        console.error("Failed to process user from localStorage", error);
        localStorage.removeItem('user');
        router.replace('/login');
    } finally {
        setLoading(false);
    }
  }, [router, pathname]);

  const login = async (username: string, pass: string) => {
    setLoading(true);
    try {
      let userProfile: UserProfile | null = null;
      
      // Hardcoded check for the main commander
      if (username === 'Nicat' && pass === 'Nicat2025') {
        userProfile = {
          id: 'admin_nicat',
          username: 'Nicat',
          role: 'commander',
          canSeeAllUnits: true,
        };
      } else {
        // Check other users from Firestore
        const q = query(
          collection(db, "users"),
          where("username", "==", username),
          where("password", "==", pass)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        }
      }

      if (!userProfile) {
        throw new Error('İstifadəçi adı və ya şifrə yanlışdır.');
      }

      // Check for active session
      const sessionRef = doc(db, 'active_sessions', userProfile.id);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        // Active session exists - this is a suspicious login.
        // Log it silently without alerting the intruder.
        const { ip, location } = await getClientIpAndLocation();
        
        const suspiciousActivity: Omit<SuspiciousActivity, 'id'> = {
            userId: userProfile.id,
            username: userProfile.username,
            ipAddress: ip,
            timestamp: serverTimestamp(),
            location: location,
            seen: false,
        };
        const activityId = uuidv4();
        await setDoc(doc(db, 'suspicious_activities', activityId), suspiciousActivity);
        
        // Redirect to home page as a honeypot without any warning.
        router.push('/');
        setLoading(false); // Make sure loading stops
        return; // Stop further execution for this user

      } else {
        // No active session, proceed with normal login
        const sessionId = uuidv4();
        await setDoc(sessionRef, { sessionId, timestamp: serverTimestamp() });
        localStorage.setItem('user_session_id', sessionId);

        setUser(userProfile);
        localStorage.setItem('user', JSON.stringify(userProfile));

        const destination = userProfile.role === 'commander' ? '/komandir' : '/sub-komandir';
        router.push(destination);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Giriş Xətası",
        description: error.message,
      });
    } finally {
        // Only set loading false if it wasn't a suspicious login redirect
        if (router.pathname !== '/') {
            setLoading(false);
        }
    }
  };

  const logout = async () => {
    setLoading(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            // Also check for the session ID to ensure you're deleting the correct one, though user ID is primary key
            await deleteDoc(doc(db, 'active_sessions', parsedUser.id));
        } catch (error) {
            console.error("Failed to delete active session on logout", error);
        }
    }
    localStorage.removeItem('user');
    localStorage.removeItem('user_session_id');
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
