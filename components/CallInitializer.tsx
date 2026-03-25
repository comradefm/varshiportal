"use client";
import { useCall } from "@/context/CallContext";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function CallInitializer() {
  const { isInitialized, initializeMedia } = useCall();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Don't show overlay on landing page or while loading auth
  if (loading || !user || pathname === "/") return null;

  if (!isInitialized) {
    return <WelcomeOverlay onContinue={initializeMedia} />;
  }

  return null;
}
