import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import {
  AbiCoder,
  getAddress,
  keccak256,
  SignatureLike,
  SigningKey,
} from 'ethers';
import { ethers } from 'ethers';
import { decodeAbiParameters, encodeAbiParameters } from 'viem';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import {
  createWalletClient,
  http,
  getContract,
  waitForTransactionReceipt,
} from 'viem';

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

/**
 * Function to update the permissions of the Browser Extension controller.
 */
// export const updateBECPermissions = async (
//     provider: BrowserProvider,
//     account: string,
//     mainUPController: string
//   ) => {
//     const signer = await provider.getSigner();
//     // check if we need to update permissions
//     // const missingPermissions = await doesControllerHaveMissingPermissions(
//     //   mainUPController,
//     //   account
//     // );
//     // if (!missingPermissions.length) {
//     //   return;
//     // }
//     const UP = ERC725__factory.connect(account, provider);

//     const erc725 = new ERC725(
//       LSP6Schema as ERC725JSONSchema[],
//       account,
//       provider
//     );

//     const newPermissions = erc725.encodePermissions({
//       ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
//       ...UAP_CONTROLLER_PERMISSIONS,
//     });
//     const permissionsData = erc725.encodeData([
//       {
//         keyName: 'AddressPermissions:Permissions:<address>',
//         dynamicKeyParts: mainUPController,
//         value: newPermissions,
//       },
//     ]);

//     const setDataBatchTx = await UP.connect(signer).setDataBatch(
//       permissionsData.keys,
//       permissionsData.values
//     );
//     return await setDataBatchTx.wait();
//   };

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
