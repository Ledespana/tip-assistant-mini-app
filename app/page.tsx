"use client";

import { UpProvider } from "@/components/upProvider";
import { Donate } from "@/components/Donate";
import { ProfileSearch } from "@/components/ProfileSearch";
import { useUpProvider } from "@/components/upProvider";
import { useState, useEffect } from "react";
import { ERC725__factory } from '@/types';

// Import the LUKSO web-components library
let promise: Promise<unknown> | null = null;
if (typeof window !== "undefined") {
  promise = import("@lukso/web-components");
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

  useEffect(() => {
    // Load web component here if needed
    promise?.then(() => {
      setMounted(true);
    });
  }, []);


  useEffect(() => {
    if  (!client || !walletConnected)  return;

    const loadExistingConfig = async () => {
      try {
        setIsLoading(true);
        const signer = await getSigner();

        const { selectedConfigTypes, isUPSubscribedToAssistant, fieldValues } =
          await fetchAssistantConfig({
            upAddress: address,
            assistantAddress,
            supportedTransactionTypes: assistantSupportedTransactionTypes,
            configParams,
            signer,
          });

        setSelectedConfigTypes(selectedConfigTypes);
        setIsUPSubscribedToAssistant(isUPSubscribedToAssistant);
        if(fieldValues) {
          setFieldValues(fieldValues);
        }
      } catch (err) {
        console.error('Failed to load existing config:', err);
      } finally {
        setIsProcessingTransaction(false);
      }
    };

    loadExistingConfig();
  }, [
    address,
    assistantAddress,
    assistantSupportedTransactionTypes,
    configParams,
    getSigner,
  ]);



  const { selectedAddress, setSelectedAddress, isSearching } = useUpProvider();

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
