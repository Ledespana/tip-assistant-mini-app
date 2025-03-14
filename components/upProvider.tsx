/**
 * @component UpProvider
 * @description Context provider that manages Universal Profile (UP) wallet connections and state
 * for LUKSO blockchain interactions on Grid. It handles wallet connection status, account management, and chain
 * information while providing real-time updates through event listeners.
 *
 * @provides {UpProviderContext} Context containing:
 * - provider: UP-specific wallet provider instance
 * - client: Viem wallet client for blockchain interactions
 * - chainId: Current blockchain network ID
 * - accounts: Array of connected wallet addresses
 * - contextAccounts: Array of Universal Profile accounts
 * - walletConnected: Boolean indicating active wallet connection
 * - universalTipAssistant: Address of the Universal Tip Assistant for the current chain
 */
'use client';

import { createClientUPProvider, UPClientProvider } from '@lukso/up-provider';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  PublicClient,
  WalletClient,
  Chain,
} from 'viem';
import { lukso, luksoTestnet } from 'viem/chains';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { getAssistantAddress } from '@/config';

interface UpProviderContext {
  provider: UPClientProvider | null;
  client: WalletClient | null;
  publicClient: PublicClient;
  chain: Chain;
  chainId: number;
  accounts: Array<`0x${string}`>;
  contextAccounts: Array<`0x${string}`>;
  walletConnected: boolean;
  universalTipAssistant: string;
}

const UpContext = createContext<UpProviderContext | undefined>(undefined);

const provider =
  typeof window !== 'undefined' ? createClientUPProvider() : null;

export function useUpProvider() {
  const context = useContext(UpContext);
  if (!context) {
    throw new Error('useUpProvider must be used within a UpProvider');
  }
  return context;
}

interface UpProviderProps {
  children: ReactNode;
}

export function UpProvider({ children }: UpProviderProps) {
  const [chainId, setChainId] = useState<number>(0);
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([]);
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>(
    []
  );
  const [walletConnected, setWalletConnected] = useState(false);
  const [client, setClient] = useState<WalletClient | null>(null);
  const [universalTipAssistant, setUniversalTipAssistant] = useState('');
  const chain = chainId === 42 ? lukso : luksoTestnet;
  const publicClient = createPublicClient({
    chain: chain,
    transport: http(),
  });

  useEffect(() => {
    if (provider && chainId) {
      const newClient = createWalletClient({
        chain: chain,
        transport: custom(provider),
      });
      setClient(newClient);
    }
    if (chainId) {
      setUniversalTipAssistant(getAssistantAddress(chainId));
    }
  }, [provider, chainId]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (!client || !provider) return;

        const _chainId = (await client.getChainId()) as number;
        if (!mounted) return;
        setChainId(_chainId);

        const _accounts = (await client.getAddresses()) as Array<`0x${string}`>;
        if (!mounted) return;
        setAccounts(_accounts);

        const _contextAccounts = provider.contextAccounts;
        if (!mounted) return;
        setContextAccounts(_contextAccounts);
        setWalletConnected(_accounts.length > 0 && _contextAccounts.length > 0);
      } catch (error) {
        console.error(error);
      }
    }

    init();

    if (provider) {
      const accountsChanged = (_accounts: Array<`0x${string}`>) => {
        setAccounts(_accounts);
        setWalletConnected(_accounts.length > 0 && contextAccounts.length > 0);
      };

      const contextAccountsChanged = (_accounts: Array<`0x${string}`>) => {
        setContextAccounts(_accounts);
        setWalletConnected(accounts.length > 0 && _accounts.length > 0);
      };

      const chainChanged = (_chainId: number) => {
        setChainId(_chainId);
      };

      provider.on('accountsChanged', accountsChanged);
      provider.on('chainChanged', chainChanged);
      provider.on('contextAccountsChanged', contextAccountsChanged);

      return () => {
        mounted = false;
        provider.removeListener('accountsChanged', accountsChanged);
        provider.removeListener(
          'contextAccountsChanged',
          contextAccountsChanged
        );
        provider.removeListener('chainChanged', chainChanged);
      };
    }
  }, [client, accounts.length, contextAccounts.length]);

  return (
    <UpContext.Provider
      value={{
        provider,
        client,
        publicClient,
        chain,
        chainId,
        accounts,
        contextAccounts,
        walletConnected,
        universalTipAssistant,
      }}
    >
      <div className="min-h-screen flex items-start justify-center">
        {children}
      </div>
    </UpContext.Provider>
  );
}
