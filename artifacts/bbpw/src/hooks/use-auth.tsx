import React, { createContext, useContext, useEffect } from "react";
import { useGetMe, useLogin, useLogout, useRegister } from "@workspace/api-client-react";
import { useLocation } from "wouter";

type AuthContextType = {
  user: any;
  isLoading: boolean;
  login: typeof useLogin;
  register: typeof useRegister;
  logout: typeof useLogout;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  // Setup hooks to be accessible
  const loginHook = useLogin();
  const registerHook = useRegister();
  const logoutHook = useLogout();

    useEffect(() => {
    if (!isLoading && isError && location !== "/") {
      setLocation("/");
    } else if (!isLoading && user && location === "/") {
      setLocation("/dashboard");
    }
  }, [user, isLoading, isError, location, setLocation]);

  return (

    <AuthContext.Provider value={{
      user,
      isLoading,
      login: loginHook,
      register: registerHook,
      logout: logoutHook
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
