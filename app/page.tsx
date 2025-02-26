"use client";

import { UpProvider } from "@/components/upProvider";
import { useUpProvider } from "@/components/upProvider";
import { useState, useEffect } from "react";
import { ERC725__factory } from '@/types';
import {  ethers, AbiCoder } from 'ethers';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

// Import the LUKSO web-components library
let promise: Promise<unknown> | null = null;
if (typeof window !== "undefined") {
  promise = import("@lukso/web-components");
}

export const UNIVERSAL_TIP_ASSISTANT_ADDRESS = '0x0c3dc7ea7521c79b99a667f2024d76714d33def2';

export const TIP_ASSISTANT_CONFIG = [
  {
    name: 'tipAddress',
    type: 'address',
    hidden: false,
    description: 'The address you want to tip:',
    placeholder: 'Enter destination address',
    validationMessage: 'Tip address cannot be your own address',
    validate: (value: any, upAddress: string) => {
      return value.toLowerCase() !== upAddress.toLowerCase();
    },
  },
  {
    name: 'tipAmount',
    type: 'uint256',
    defaultValue: '2',
    hidden: false,
    description: 'Percentage of LYX to tip:',
    placeholder: 'e.g 10',
    validate: (value: any) => {
      const number = parseInt(value);
      return number > 0 && number <= 100 && value.indexOf('.') === -1;
    },
    validationMessage:
      'Tip amount must be between 1 and 100 without decimals',
  },
];

export const generateMappingKey = (keyName: string, typeId: string): string => {
  const hashedKey = ethers.keccak256(ethers.toUtf8Bytes(keyName));
  const first10Bytes = hashedKey.slice(2, 22);
  const last20Bytes = typeId.slice(2, 42);
  return '0x' + first10Bytes + '0000' + last20Bytes;
};

// Function to decode the encoded addresses
export function customDecodeAddresses(encoded: string): string[] {
  // Remove "0x" prefix for easier handling
  const data = encoded.startsWith('0x') ? encoded.substring(2) : encoded;

  // Decode the number of addresses (first 4 characters represent 2 bytes)
  const numAddressesHex = data.substring(0, 4);
  const numAddresses = parseInt(numAddressesHex, 16);

  // Extract each 20-byte address
  let addresses: string[] = [];
  for (let i = 0; i < numAddresses; i++) {
    const startIdx = 4 + i * 40; // 4 hex chars for length, then 40 hex chars per address (20 bytes)
    const addressHex = `0x${data.substring(startIdx, startIdx + 40)}`;
    addresses.push(ethers.getAddress(addressHex)); // Normalize address
  }

  return addresses;
}

interface IFullAssistantConfig {
  typeConfigAddresses: Record<string, string[]>;
  selectedConfigTypes: string[];
  isUPSubscribedToAssistant: boolean;
  fieldValues?: Record<string, string>;
}

async function fetchAssistantConfig({
  upAddress,
  assistantAddress,
  supportedTransactionTypes,
  configParams,
  signer,
}: {
  upAddress: string;
  assistantAddress: string;
  supportedTransactionTypes: string[];
  configParams: { name: string; type: string }[];
  signer: any; // e.g. ethers.Signer
}): Promise<IFullAssistantConfig> {
  const upContract = ERC725__factory.connect(upAddress, signer);

  // Build the keys for each supported transaction type.
  const assistantTypesConfigKeys = supportedTransactionTypes.map(id =>
    generateMappingKey('UAPTypeConfig', id)
  );

  // Assistant's config key
  const assistantConfigKey = generateMappingKey(
    'UAPExecutiveConfig',
    assistantAddress
  );

  const configData = await upContract.getDataBatch([
    ...assistantTypesConfigKeys,
    assistantConfigKey,
  ]);

  // The first N items in configData will be for type configurations
  const typeConfigValues = configData.slice(
    0,
    supportedTransactionTypes.length
  );
  // The last item is the assistant’s own configuration
  const assistantConfigValue = configData[supportedTransactionTypes.length];

  const abiCoder = new AbiCoder();
  const previouslySelectedTypes: string[] = [];
  const previouslySavedTypeConfigAddresses: Record<string, string[]> = {};

  // Decode each transaction type’s addresses
  typeConfigValues.forEach((encodedValue, index) => {
    const typeId = supportedTransactionTypes[index];
    if (!encodedValue || encodedValue === '0x') {
      previouslySavedTypeConfigAddresses[typeId] = [];
      return;
    }
    const storedAssistantAddresses = customDecodeAddresses(encodedValue);
    previouslySavedTypeConfigAddresses[typeId] = storedAssistantAddresses;

    // If the assistant is in that array, mark this type as selected
    if (
      storedAssistantAddresses
        .map(addr => addr.toLowerCase())
        .includes(assistantAddress.toLowerCase())
    ) {
      previouslySelectedTypes.push(typeId);
    }
  });

  // Determine if the assistant is subscribed to at least one type
  const isUPSubscribedToAssistant = previouslySelectedTypes.length > 0;

  // Decode the assistant’s own config for the custom fields
  let fetchedFieldValues: Record<string, string> | undefined = undefined;
  if (assistantConfigValue !== '0x') {
    fetchedFieldValues = {};
    const types = configParams.map(param => param.type);
    const decoded = abiCoder.decode(types, assistantConfigValue);
    configParams.forEach((param, index) => {
      fetchedFieldValues![param.name] = decoded[index].toString();
    });
  }

  return {
    typeConfigAddresses: previouslySavedTypeConfigAddresses,
    selectedConfigTypes: previouslySelectedTypes,
    isUPSubscribedToAssistant,
    fieldValues: fetchedFieldValues,
  };
}

/**
 * Main content component that handles the conditional rendering of Donate and ProfileSearch components.
 * Utilizes the UpProvider context to manage selected addresses and search state.
 *
 * @component
 * @returns {JSX.Element} A component that toggles between Donate and ProfileSearch views
 * based on the isSearching state from UpProvider.
 */
function MainContent() {
  const [mounted, setMounted] = useState(false);
  const { client, accounts, contextAccounts, walletConnected } =
    useUpProvider();
  const [isLoading, setIsLoading] = useState(false);
  const [isUPSubscribedToAssistant, setIsUPSubscribedToAssistant] = useState(false);

  useEffect(() => {
    // Load web component here if needed
    promise?.then(() => {
      setMounted(true);
    });
  }, []);


  useEffect(() => {
    console.log('initial');
    debugger;
    if  (!client || !walletConnected)  return;
    console.log('connected')
    const loadExistingConfig = async () => {
      try {
        setIsLoading(true);
        const signer = client.getSigner();

        const configParams = TIP_ASSISTANT_CONFIG.map(({ name, type }) => ({
          name,
          type,
        }));

        const { selectedConfigTypes, isUPSubscribedToAssistant, fieldValues } =
          await fetchAssistantConfig({
            upAddress: accounts[0],
            assistantAddress: UNIVERSAL_TIP_ASSISTANT_ADDRESS,
            supportedTransactionTypes: [LSP1_TYPE_IDS.LSP0ValueReceived],
            configParams,
            signer,
          });

        setIsUPSubscribedToAssistant(isUPSubscribedToAssistant);
        console.log('finish usereffects')
      } catch (err) {
        console.error('Failed to load existing config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingConfig();
  }, [
    accounts,
    client,
    walletConnected
  ]);

  if (!mounted) {
    return null; // or a loading placeholder
  }

  if (!client || !walletConnected) {
    return (
      <div>
        <h1>Connect your wallet</h1>
        <p>
          To start using the Tip Assistant, you need to connect your wallet.
        </p>
      </div>
    );
  }

  return (
    <a href="https://upassistants.com/lukso/catalog/executive-assistants/0x0c3dc7ea7521c79b99a667f2024d76714d33def2/configure" target="_blank" rel="noreferrer">
    Install Tip Assistant
  </a>
  )

  // return (
  //   <>
  //     <div className={`${isSearching ? "hidden" : "block"}`}>
  //       {/* <Donate selectedAddress={selectedAddress} /> */}
  //     </div>
  
  //     <div className={`${!isSearching ? "hidden" : "block"}`}>
  //       <ProfileSearch onSelectAddress={setSelectedAddress} />
  //     </div>
  //   </>
  // );
}

/**
 * Root component of the application that wraps the main content with the UpProvider context.
 * Serves as the entry point for the donation and profile search functionality.
 *
 * @component
 * @returns {JSX.Element} The wrapped MainContent component with UpProvider context
 */
export default function Home() {
  return (
    <UpProvider>
      <MainContent />
    </UpProvider>
  );
}
