import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: string;
}

export const RoleGuard = ({ children, requiredRole = "admin" }: RoleGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 mx-auto" />
          <div className="text-sm text-muted-foreground font-medium">Verifying authorization...</div>
        </div>
      </div>
    );
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    console.warn("[RoleGuard] Access denied. User lacks required role:", requiredRole);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
