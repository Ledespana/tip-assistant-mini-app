import { ERC725__factory } from '@/types';
import { createClientUPProvider } from '@lukso/up-provider';
import { AbiCoder } from 'ethers';
import { BrowserProvider } from 'ethers';
import { ethers } from 'ethers';

export const UNIVERSAL_TIP_ASSISTANT_ADDRESS =
  '0x0c3dc7ea7521c79b99a667f2024d76714d33def2';

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

export const fetchAssistantConfig = async function ({
  upAddress,
  assistantAddress,
  supportedTransactionTypes,
  configParams,
  client,
  provider,
}: {
  upAddress: string;
  assistantAddress: string;
  supportedTransactionTypes: string[];
  configParams: { name: string; type: string }[];
  client: any;
  provider: BrowserProvider;
}): Promise<IFullAssistantConfig | null> {
  // const UPContract = new ethers.Contract(
  //   upAddress,
  //   UniversalProfile.abi,
  //   provider
  // );

  // const UPURD = await UPContract.getData(
  //   // ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate
  //   "0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47"
  // );

  // console.log('UPURD', UPURD)

  // const signer = await client.getSigner();
  const upProvider = createClientUPProvider();

  const browserProvider = new ethers.BrowserProvider(
    upProvider as unknown as Eip1193Provider
  );

  // console.log('signer', signer)
  const upContract = ERC725__factory.connect(
    '0x291adFfb41456d589137eA2A009A6D797DB97468',
    browserProvider
  ); // todo it is not the up address it is the page address

  // Assistant's config key
  const assistantConfigKey = generateMappingKey(
    'UAPExecutiveConfig',
    assistantAddress
  );
  const params = [assistantConfigKey];
  const configData = await upContract.getDataBatch(params);
  console.log('Result:', configData); // Show the keys you pass

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
};
