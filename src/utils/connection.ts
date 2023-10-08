import { BrowserProvider, Provider, ethers } from 'ethers';
import {
  EthereumNotFoundError,
  UNKNOWN_CHAIN_ERROR_CODE,
  isErrorWithCode,
  transformError
} from './error';
import { networks } from './networks';
import { withoutConcurrentCall } from './without-concurrent-call';

interface MaybeMetamaskProvider extends ethers.Eip1193Provider, Pick<Provider, 'on' | 'off'> {
  isMetaMask?: boolean;
}

export interface Connection {
  signer: ethers.JsonRpcSigner;
  provider: BrowserProvider;
  networkId: number;
  address: string;
}

export const getEthereum = () => window.ethereum ? window.ethereum as MaybeMetamaskProvider : undefined;

export const ethereumIsAvailable = () => Boolean(getEthereum());
export const metamaskIsAvailable = () => getEthereum()?.isMetaMask ?? false;

const addNetwork = withoutConcurrentCall(async (networkId: number) => {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new EthereumNotFoundError();
  }

  const { knownTokens, ...networkProps } = networks[networkId];

  if (networkProps) {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkProps]
    });
  } else {
    throw new Error(`Network with id ${networkId} is not supported`);
  }
});

export const switchChain = withoutConcurrentCall(async (networkId: number): Promise<void> => {
  console.log('switchChain', Date.now());
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new EthereumNotFoundError();
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${networkId.toString(16)}` }]
    });
  } catch (e) {
    const errorCode = isErrorWithCode(e) ? e.code : undefined;
    if (errorCode === UNKNOWN_CHAIN_ERROR_CODE) {
      await addNetwork(networkId);

      return switchChain(networkId);
    }

    throw transformError(e);
  }
});

export const getConnection = withoutConcurrentCall(async (networkId?: number): Promise<Connection> => {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new EthereumNotFoundError();
  }

  try {
    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const { chainId: rawActualNetworkId } = await provider.getNetwork();
    const actualNetworkId = Number(rawActualNetworkId);

    if (!networks[actualNetworkId] || (networkId !== undefined && networkId !== actualNetworkId)) {
      const networkIdToConnect = networkId ?? 1;
      await switchChain(networkIdToConnect);
      
      return getConnection(networkIdToConnect);
    }

    return { signer, provider, networkId: actualNetworkId, address };
  } catch (e) {
    if (isErrorWithCode(e) && e.code === UNKNOWN_CHAIN_ERROR_CODE && networkId) {
      await addNetwork(networkId);

      return getConnection(networkId);
    }

    throw transformError(e);
  }
});
