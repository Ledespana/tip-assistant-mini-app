import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import {
  AbiCoder,
  getAddress,
  keccak256,
  SignatureLike,
  SigningKey,
} from 'ethers';
import { ethers } from 'ethers';
import { decodeAbiParameters, encodeAbiParameters, isAddress } from 'viem';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import {
  createWalletClient,
  http,
  getContract,
  waitForTransactionReceipt,
} from 'viem';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';

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

export function customEncodeAddresses(addresses: string[]): string {
  if (addresses.length > 65535) {
    throw new Error('Number of addresses exceeds uint16 capacity.');
  }

  // Use ethers v6 `solidityPacked` to encode the length and addresses
  const encoded = ethers.solidityPacked(
    ['uint16', ...Array(addresses.length).fill('address')],
    [addresses.length, ...addresses]
  );

  return encoded;
}

// Function to decode the encoded addresses
export function customDecodeAddresses(encoded: string): string[] {
  // Remove "0x" prefix for easier handling
  const data = encoded.startsWith('0x') ? encoded.substring(2) : encoded;

  // Decode the number of addresses (first 4 characters represent 2 bytes)
  const numAddressesHex = data.substring(0, 4);
  const numAddresses = parseInt(numAddressesHex, 16);

  // Extract each 20-byte address
  const addresses: string[] = [];
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
  {
    type: 'function',
    name: 'setDataBatch',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'keys', type: 'bytes32[]' },
      { name: 'values', type: 'bytes[]' },
    ],
    outputs: [],
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

  typeConfigValues.forEach((encodedValue: string, index: number) => {
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

export const DEFAULT_UP_URD_PERMISSIONS = {
  REENTRANCY: true,
  SUPER_SETDATA: true,
  SETDATA: true,
};

export const DEFAULT_UP_CONTROLLER_PERMISSIONS = {
  SUPER_SETDATA: true,
  SETDATA: true,
  SIGN: true,
  ENCRYPT: true,
  DECRYPT: true,
  SUPER_CALL: true,
  CALL: true,
  SUPER_STATICCALL: true,
  STATICCALL: true,
  SUPER_TRANSFERVALUE: true,
  TRANSFERVALUE: true,
  DEPLOY: true,
  EXECUTE_RELAY_CALL: true,
  EDITPERMISSIONS: true,
  ADDCONTROLLER: true,
};

export const UAP_CONTROLLER_PERMISSIONS = {
  ADDUNIVERSALRECEIVERDELEGATE: true,
  CHANGEUNIVERSALRECEIVERDELEGATE: true,
};

export const updateBECPermissions = async (
  walletClient: any,
  publicClient: any,
  account: string,
  mainUPController: string,
  ERC725Y_ABI: any
) => {
  try {
    console.log('Updating BEC Permissions');

    const erc725 = new ERC725(LSP6Schema as any, account, walletClient);

    const newPermissions = erc725.encodePermissions({
      ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
      ...UAP_CONTROLLER_PERMISSIONS,
    });

    const permissionsData = erc725.encodeData([
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: mainUPController,
        value: newPermissions,
      },
    ]);

    const txHash = await walletClient.writeContract({
      address: account,
      abi: ERC725Y_ABI,
      functionName: 'setDataBatch',
      args: [permissionsData.keys, permissionsData.values],
      account,
    });

    console.log('Transaction sent:', txHash);
    console.log('Waiting for transaction confirmation...');

    // Use waitForTransactionReceipt to wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    console.log('Transaction confirmed! Receipt:', receipt);
    return receipt;
  } catch (error: any) {
    console.error('Failed to update BEC permissions:', error);
    throw error;
  }
};

// export const subscribeToUapURD = async (
//     provider: BrowserProvider,
//     upAccount: string,
//     uapURD: string
//   ) => {
//     const signer = await provider.getSigner();
//     const URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
//     const LSP7URDdataKey =
//       ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
//       LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2, 42);
//     const LSP8URDdataKey =
//       ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
//       LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2, 42);

//     const delegateKeys = [URDdataKey, LSP7URDdataKey, LSP8URDdataKey];
//     const delegateValues = [uapURD, '0x', '0x'];

//     const UP = ERC725__factory.connect(upAccount, provider);
//     const upPermissions = new ERC725(
//       LSP6Schema as ERC725JSONSchema[],
//       upAccount,
//       window.lukso
//     );
//     const checksumUapURD = getChecksumAddress(uapURD) as string;

//     // Retrieve current controllers from the UP's permissions.
//     const currentPermissionsData = await upPermissions.getData();
//     const currentControllers = currentPermissionsData[0].value as string[];

//     // Remove any existing instances of the UAP-URD to avoid duplicates.
//     let updatedControllers = currentControllers.filter((controller: string) => {
//       return getChecksumAddress(controller) !== checksumUapURD;
//     });

//     // Add the UAP-URD to the controllers.
//     updatedControllers.push(checksumUapURD);

//     // 4. Prepare permissions for the UAP-URD.
//     const uapURDPermissions = upPermissions.encodePermissions({
//       SUPER_CALL: true,
//       SUPER_TRANSFERVALUE: true,
//       ...DEFAULT_UP_URD_PERMISSIONS,
//     });

//     // Encode the new permissions and updated controllers data.
//     const permissionsData = upPermissions.encodeData([
//       {
//         keyName: 'AddressPermissions:Permissions:<address>',
//         dynamicKeyParts: checksumUapURD,
//         value: uapURDPermissions,
//       },
//       {
//         keyName: 'AddressPermissions[]',
//         value: updatedControllers,
//       },
//     ]);

//     // 5. Batch update all the data on the UP.
//     const allKeys = [...delegateKeys, ...permissionsData.keys];
//     const allValues = [...delegateValues, ...permissionsData.values];

//     const tx = await UP.connect(signer).setDataBatch(allKeys, allValues);
//     return tx.wait();
//   };

export const subscribeToUapURD = async (
  walletClient: any, // Use Viem's WalletClient
  upAccount: string,
  uapURD: string
) => {
  console.log('Subscribing to UAP-URD...');

  const URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
  const LSP7URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2, 42);
  const LSP8URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2, 42);

  const delegateKeys = [URDdataKey, LSP7URDdataKey, LSP8URDdataKey];
  const delegateValues = [uapURD, '0x', '0x'];

  // Initialize ERC725 instance
  const upPermissions = new ERC725(LSP6Schema as any, upAccount, walletClient);

  const checksumUapURD = getChecksumAddress(uapURD) as string;

  // Retrieve current controllers from the UP's permissions.
  const currentPermissionsData = await upPermissions.getData();
  const currentControllers = currentPermissionsData[0].value as string[];

  // Remove any existing instances of the UAP-URD to avoid duplicates.
  const updatedControllers = currentControllers.filter((controller: string) => {
    return getChecksumAddress(controller) !== checksumUapURD;
  });

  // Add the UAP-URD to the controllers.
  updatedControllers.push(checksumUapURD);

  // 4. Prepare permissions for the UAP-URD.
  const uapURDPermissions = upPermissions.encodePermissions({
    SUPER_CALL: true,
    SUPER_TRANSFERVALUE: true,
    ...DEFAULT_UP_URD_PERMISSIONS,
  });

  // Encode the new permissions and updated controllers data.
  const permissionsData = upPermissions.encodeData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: checksumUapURD,
      value: uapURDPermissions,
    },
    {
      keyName: 'AddressPermissions[]',
      value: updatedControllers,
    },
  ]);

  // 5. Batch update all the data on the UP.
  const allKeys = [...delegateKeys, ...permissionsData.keys];
  const allValues = [...delegateValues, ...permissionsData.values];

  console.log('Writing contract data...');

  const txHash = await walletClient.writeContract({
    address: upAccount,
    abi: ERC725Y_ABI,
    functionName: 'setDataBatch',
    args: [allKeys, allValues],
    account: upAccount,
  });

  console.log('Transaction sent:', txHash);

  return txHash;
};

export const getChecksumAddress = (address: string | null) => {
  // Check if the address is valid
  if (!address || !isAddress(address)) {
    // Handle invalid address
    return address;
  }

  // Convert to checksum address
  return getAddress(address);
};

export const isUAPInstalled = async (
  publicClient: any,
  upAddress: string,
  expectedDelegate: string
): Promise<boolean> => {
  try {
    const UPURD = await publicClient.readContract({
      address: upAddress as `0x${string}`,
      abi: UniversalProfile.abi,
      functionName: 'getData',
      args: [ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate],
    });

    return UPURD?.toLowerCase() === expectedDelegate?.toLowerCase();
  } catch (err) {
    console.error('Error checking UAP installation:', err);
    throw err;
  }
};
