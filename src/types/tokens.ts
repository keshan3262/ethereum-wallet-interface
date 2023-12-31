// Add other tokens types when necessary
export enum TokenType {
  Native = 'Native',
  ERC20 = 'ERC20'
}

interface TokenDescriptorBase {
  type: TokenType;
}

export interface NativeTokenDescriptor extends TokenDescriptorBase {
  type: TokenType.Native;
}

interface ERC20TokenDescriptor extends TokenDescriptorBase {
  type: TokenType.ERC20;
  address: string;
}

export type ContractTokenDescriptor = ERC20TokenDescriptor;

export type TokenDescriptor = ContractTokenDescriptor | NativeTokenDescriptor;

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}
