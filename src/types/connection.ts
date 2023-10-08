import { ethers, BrowserProvider } from 'ethers';

export interface Connection {
  signer: ethers.JsonRpcSigner;
  provider: BrowserProvider;
  networkId: number;
  address: string;
}
