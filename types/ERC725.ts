/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from 'ethers';
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from './common';

export interface ERC725Interface extends Interface {
  getFunction(
    nameOrSignature:
      | 'execute'
      | 'executeBatch'
      | 'getData'
      | 'getDataBatch'
      | 'owner'
      | 'renounceOwnership'
      | 'setData'
      | 'setDataBatch'
      | 'supportsInterface'
      | 'transferOwnership'
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | 'ContractCreated'
      | 'DataChanged'
      | 'Executed'
      | 'OwnershipTransferred'
  ): EventFragment;

  encodeFunctionData(
    functionFragment: 'execute',
    values: [BigNumberish, AddressLike, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'executeBatch',
    values: [BigNumberish[], AddressLike[], BigNumberish[], BytesLike[]]
  ): string;
  encodeFunctionData(functionFragment: 'getData', values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: 'getDataBatch',
    values: [BytesLike[]]
  ): string;
  encodeFunctionData(functionFragment: 'owner', values?: undefined): string;
  encodeFunctionData(
    functionFragment: 'renounceOwnership',
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: 'setData',
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'setDataBatch',
    values: [BytesLike[], BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: 'supportsInterface',
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'transferOwnership',
    values: [AddressLike]
  ): string;

  decodeFunctionResult(functionFragment: 'execute', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'executeBatch',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'getData', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'getDataBatch',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'owner', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'renounceOwnership',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'setData', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'setDataBatch',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'supportsInterface',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'transferOwnership',
    data: BytesLike
  ): Result;
}

export namespace ContractCreatedEvent {
  export type InputTuple = [
    operationType: BigNumberish,
    contractAddress: AddressLike,
    value: BigNumberish,
    salt: BytesLike,
  ];
  export type OutputTuple = [
    operationType: bigint,
    contractAddress: string,
    value: bigint,
    salt: string,
  ];
  export interface OutputObject {
    operationType: bigint;
    contractAddress: string;
    value: bigint;
    salt: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DataChangedEvent {
  export type InputTuple = [dataKey: BytesLike, dataValue: BytesLike];
  export type OutputTuple = [dataKey: string, dataValue: string];
  export interface OutputObject {
    dataKey: string;
    dataValue: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ExecutedEvent {
  export type InputTuple = [
    operationType: BigNumberish,
    target: AddressLike,
    value: BigNumberish,
    selector: BytesLike,
  ];
  export type OutputTuple = [
    operationType: bigint,
    target: string,
    value: bigint,
    selector: string,
  ];
  export interface OutputObject {
    operationType: bigint;
    target: string;
    value: bigint;
    selector: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace OwnershipTransferredEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface ERC725 extends BaseContract {
  connect(runner?: ContractRunner | null): ERC725;
  waitForDeployment(): Promise<this>;

  interface: ERC725Interface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  execute: TypedContractMethod<
    [
      operationType: BigNumberish,
      target: AddressLike,
      value: BigNumberish,
      data: BytesLike,
    ],
    [string],
    'payable'
  >;

  executeBatch: TypedContractMethod<
    [
      operationsType: BigNumberish[],
      targets: AddressLike[],
      values: BigNumberish[],
      datas: BytesLike[],
    ],
    [string[]],
    'payable'
  >;

  getData: TypedContractMethod<[dataKey: BytesLike], [string], 'view'>;

  getDataBatch: TypedContractMethod<
    [dataKeys: BytesLike[]],
    [string[]],
    'view'
  >;

  owner: TypedContractMethod<[], [string], 'view'>;

  renounceOwnership: TypedContractMethod<[], [void], 'nonpayable'>;

  setData: TypedContractMethod<
    [dataKey: BytesLike, dataValue: BytesLike],
    [void],
    'payable'
  >;

  setDataBatch: TypedContractMethod<
    [dataKeys: BytesLike[], dataValues: BytesLike[]],
    [void],
    'payable'
  >;

  supportsInterface: TypedContractMethod<
    [interfaceId: BytesLike],
    [boolean],
    'view'
  >;

  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    'nonpayable'
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: 'execute'
  ): TypedContractMethod<
    [
      operationType: BigNumberish,
      target: AddressLike,
      value: BigNumberish,
      data: BytesLike,
    ],
    [string],
    'payable'
  >;
  getFunction(
    nameOrSignature: 'executeBatch'
  ): TypedContractMethod<
    [
      operationsType: BigNumberish[],
      targets: AddressLike[],
      values: BigNumberish[],
      datas: BytesLike[],
    ],
    [string[]],
    'payable'
  >;
  getFunction(
    nameOrSignature: 'getData'
  ): TypedContractMethod<[dataKey: BytesLike], [string], 'view'>;
  getFunction(
    nameOrSignature: 'getDataBatch'
  ): TypedContractMethod<[dataKeys: BytesLike[]], [string[]], 'view'>;
  getFunction(
    nameOrSignature: 'owner'
  ): TypedContractMethod<[], [string], 'view'>;
  getFunction(
    nameOrSignature: 'renounceOwnership'
  ): TypedContractMethod<[], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'setData'
  ): TypedContractMethod<
    [dataKey: BytesLike, dataValue: BytesLike],
    [void],
    'payable'
  >;
  getFunction(
    nameOrSignature: 'setDataBatch'
  ): TypedContractMethod<
    [dataKeys: BytesLike[], dataValues: BytesLike[]],
    [void],
    'payable'
  >;
  getFunction(
    nameOrSignature: 'supportsInterface'
  ): TypedContractMethod<[interfaceId: BytesLike], [boolean], 'view'>;
  getFunction(
    nameOrSignature: 'transferOwnership'
  ): TypedContractMethod<[newOwner: AddressLike], [void], 'nonpayable'>;

  getEvent(
    key: 'ContractCreated'
  ): TypedContractEvent<
    ContractCreatedEvent.InputTuple,
    ContractCreatedEvent.OutputTuple,
    ContractCreatedEvent.OutputObject
  >;
  getEvent(
    key: 'DataChanged'
  ): TypedContractEvent<
    DataChangedEvent.InputTuple,
    DataChangedEvent.OutputTuple,
    DataChangedEvent.OutputObject
  >;
  getEvent(
    key: 'Executed'
  ): TypedContractEvent<
    ExecutedEvent.InputTuple,
    ExecutedEvent.OutputTuple,
    ExecutedEvent.OutputObject
  >;
  getEvent(
    key: 'OwnershipTransferred'
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;

  filters: {
    'ContractCreated(uint256,address,uint256,bytes32)': TypedContractEvent<
      ContractCreatedEvent.InputTuple,
      ContractCreatedEvent.OutputTuple,
      ContractCreatedEvent.OutputObject
    >;
    ContractCreated: TypedContractEvent<
      ContractCreatedEvent.InputTuple,
      ContractCreatedEvent.OutputTuple,
      ContractCreatedEvent.OutputObject
    >;

    'DataChanged(bytes32,bytes)': TypedContractEvent<
      DataChangedEvent.InputTuple,
      DataChangedEvent.OutputTuple,
      DataChangedEvent.OutputObject
    >;
    DataChanged: TypedContractEvent<
      DataChangedEvent.InputTuple,
      DataChangedEvent.OutputTuple,
      DataChangedEvent.OutputObject
    >;

    'Executed(uint256,address,uint256,bytes4)': TypedContractEvent<
      ExecutedEvent.InputTuple,
      ExecutedEvent.OutputTuple,
      ExecutedEvent.OutputObject
    >;
    Executed: TypedContractEvent<
      ExecutedEvent.InputTuple,
      ExecutedEvent.OutputTuple,
      ExecutedEvent.OutputObject
    >;

    'OwnershipTransferred(address,address)': TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
    OwnershipTransferred: TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
  };
}
