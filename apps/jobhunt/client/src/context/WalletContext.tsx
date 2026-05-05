import { createContext, useContext, useEffect, useRef, useState } from "react";

interface WalletState {
  balance: number;
  streak: number;
  multiplier: number;
}

interface EarnResult {
  earned: number;
  breakdown: { action: number; checkin: number };
  balance: number;
  streak: number;
  multiplier: number;
}

interface WalletCtx {
  wallet: WalletState;
  earn: (action: string) => Promise<EarnResult | null>;
  settle: (bet: number, won: boolean) => Promise<void>;
  toast: { earned: number; breakdown: { action: number; checkin: number } } | null;
}

const WalletContext = createContext<WalletCtx>({
  wallet: { balance: 0, streak: 0, multiplier: 1 },
  earn: async () => null,
  settle: async () => {},
  toast: null,
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({ balance: 0, streak: 0, multiplier: 1 });
  const [toast, setToast] = useState<WalletCtx["toast"]>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then(r => r.json())
      .then(setWallet)
      .catch(() => {});
  }, []);

  const earn = async (action: string): Promise<EarnResult | null> => {
    try {
      const res = await fetch("/api/wallet/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data: EarnResult = await res.json();
      setWallet({ balance: data.balance, streak: data.streak, multiplier: data.multiplier });

      // Show toast
      setToast({ earned: data.earned, breakdown: data.breakdown });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2800);

      return data;
    } catch {
      return null;
    }
  };

  const settle = async (bet: number, won: boolean): Promise<void> => {
    try {
      const res = await fetch("/api/wallet/rung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, won }),
      });
      const data: { balance: number; delta: number } = await res.json();
      setWallet(prev => ({ ...prev, balance: data.balance }));

      // Show toast
      const earned = data.delta;
      setToast({
        earned,
        breakdown: { action: earned, checkin: 0 },
      });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2800);
    } catch {
      // silent
    }
  };

  return (
    <WalletContext.Provider value={{ wallet, earn, settle, toast }}>
      {children}
    </WalletContext.Provider>
  );
}
