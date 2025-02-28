'use client';

import { createClientUPProvider } from "@lukso/up-provider";
import { BrowserProvider } from "ethers";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";

interface UpProviderContext {
  provider: any;
  client: BrowserProvider | null;
  chainId: number;
  accounts: Array<`0x${string}`>;
  contextAccounts: Array<`0x${string}`>;
  walletConnected: boolean;
  selectedAddress: `0x${string}` | null;
  setSelectedAddress: (address: `0x${string}` | null) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
}

const UpContext = createContext<UpProviderContext | undefined>(undefined);

export function useUpProvider() {
  const context = useContext(UpContext);
  if (!context) {
    throw new Error("useUpProvider must be used within a UpProvider");
  }
  return context;
}

interface UpProviderProps {
  children: ReactNode;
}

// Create the UP Provider once, if in the browser
const upProvider = typeof window !== "undefined" ? createClientUPProvider() : null;

export function UpProvider({ children }: UpProviderProps) {
  const [chainId, setChainId] = useState<number>(0);
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([]);
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<`0x${string}` | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Create the Ethers client once from the UP provider (if present)
  const [client, setClient] = useState<BrowserProvider | null>(null);

  // Only do this once on mount (or if `upProvider` changes)
  useEffect(() => {
    if (!upProvider) return;
    setClient(new BrowserProvider(upProvider));
  }, [upProvider]);

  // This effect runs once the Ethers client is set
  useEffect(() => {
    if (!client || !upProvider) return;

    let mounted = true;

    async function init() {
      try {
        // Get the current network chainId using ethers
        const network = await client.getNetwork();
        if (mounted) {
          setChainId(network.chainId);
        }

        // Get the list of accounts using ethers
        const _accounts = await client.listAccounts();
        if (mounted) {
          setAccounts(_accounts as Array<`0x${string}`>);
        }

        // Use the contextAccounts from the UP provider directly
        const _contextAccounts = upProvider.contextAccounts || [];
        if (mounted) {
          setContextAccounts(_contextAccounts);
          setWalletConnected(_accounts.length > 0 && _contextAccounts.length > 0);
        }
      } catch (error) {
        console.error("Init error:", error);
      }
    }

    init();

    // Listen to changes from the UP provider
    const handleAccountsChanged = (_accounts: Array<`0x${string}`>) => {
      setAccounts(_accounts);
      setWalletConnected(_accounts.length > 0 && contextAccounts.length > 0);
    };

    const handleContextAccountsChanged = (_contextAccounts: Array<`0x${string}`>) => {
      setContextAccounts(_contextAccounts);
      setWalletConnected(accounts.length > 0 && _contextAccounts.length > 0);
    };

    const handleChainChanged = (_chainId: number) => {
      // Only update if it actually changes
      setChainId((prev) => (prev !== _chainId ? _chainId : prev));
    };

    upProvider.on("accountsChanged", handleAccountsChanged);
    upProvider.on("chainChanged", handleChainChanged);
    upProvider.on("contextAccountsChanged", handleContextAccountsChanged);

    return () => {
      mounted = false;
      upProvider.removeListener("accountsChanged", handleAccountsChanged);
      upProvider.removeListener("chainChanged", handleChainChanged);
      upProvider.removeListener("contextAccountsChanged", handleContextAccountsChanged);
    };
  }, [client, upProvider, contextAccounts.length, accounts.length]);

  return (
    <UpContext.Provider
      value={{
        provider: upProvider,
        client,
        chainId,
        accounts,
        contextAccounts,
        walletConnected,
        selectedAddress,
        setSelectedAddress,
        isSearching,
        setIsSearching,
      }}
    >
      <div className="min-h-screen flex items-center justify-center">
        {children}
      </div>
    </UpContext.Provider>
  );
}
