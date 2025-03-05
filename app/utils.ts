import { ERC725__factory } from '@/types';
import { createClientUPProvider } from '@lukso/up-provider';
import { AbiCoder } from 'ethers';
import { BrowserProvider } from 'ethers';
import { ethers } from 'ethers';

export const TIP_ASSISTANT_CONFIG = [
  {
    name: 'tipAddress',
    type: 'address',
  },
  {
    name: 'tipAmount',
    type: 'uint256',
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

const ERC725Y_ABI = [
  {
    type: 'function',
    name: 'getDataBatch',
    stateMutability: 'view',
    inputs: [{ type: 'bytes32[]' }],
    outputs: [{ type: 'bytes[]' }],
  },
];

export const fetchAssistantConfig = async function ({
  upAddress,
  assistantAddress,
  supportedTransactionTypes,
  configParams,
  publicClient,
}: {
  upAddress: string;
  assistantAddress: string;
  supportedTransactionTypes: string[];
  configParams: { name: string; type: string }[];
  publicClient: any;
}): Promise<IFullAssistantConfig> {
  // Build the keys for each supported transaction type.
  const assistantTypesConfigKeys = supportedTransactionTypes.map(id =>
    generateMappingKey('UAPTypeConfig', id)
  );

  // Assistant's config key
  const assistantConfigKey = generateMappingKey(
    'UAPExecutiveConfig',
    assistantAddress
  );
  const params = [...assistantTypesConfigKeys, assistantConfigKey];
  // Fetch raw data directly from the contract
  const configData = await publicClient.readContract({
    address: upAddress,
    abi: ERC725Y_ABI,
    functionName: 'getDataBatch',
    args: [params],
  });
  const typeConfigValues = configData.slice(
    0,
    supportedTransactionTypes.length
  );
  const assistantConfigValue = configData[supportedTransactionTypes.length];

  const abiCoder = new AbiCoder();
  const previouslySelectedTypes: string[] = [];
  const previouslySavedTypeConfigAddresses: Record<string, string[]> = {};

  typeConfigValues.forEach((encodedValue, index) => {
    const typeId = supportedTransactionTypes[index];
    if (!encodedValue || encodedValue === '0x') {
      previouslySavedTypeConfigAddresses[typeId] = [];
      return;
    }
    const storedAssistantAddresses = customDecodeAddresses(encodedValue);
    previouslySavedTypeConfigAddresses[typeId] = storedAssistantAddresses;

    if (
      storedAssistantAddresses
        .map(addr => addr.toLowerCase())
        .includes(assistantAddress.toLowerCase())
    ) {
      previouslySelectedTypes.push(typeId);
    }
  });

  const isUPSubscribedToAssistant = previouslySelectedTypes.length > 0;
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
};
