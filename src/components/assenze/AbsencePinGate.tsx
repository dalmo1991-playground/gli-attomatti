"use client";

import React, { createContext, useContext } from "react";
import AreaRiservataGate from "@/components/area-riservata/AreaRiservataGate";
import { logoutAreaRiservata } from "@/app/actions/areaRiservataAuth";

/**
 * @deprecated Usa AreaRiservataGate da "@/components/area-riservata/AreaRiservataGate".
 */
export const AbsenceAuthContext = createContext<{ logout: () => void }>({
  logout: () => {
    logoutAreaRiservata().then(() => window.location.reload()).catch(() => {});
  }
});

export const useAbsenceAuth = () => useContext(AbsenceAuthContext);

interface AbsencePinGateProps {
  children: React.ReactNode;
  initialIsUnlocked?: boolean;
}

export default function AbsencePinGate({
  children,
  initialIsUnlocked = false
}: AbsencePinGateProps) {
  if (!initialIsUnlocked) {
    return <AreaRiservataGate />;
  }

  return <>{children}</>;
}
