import { BrowserProvider, Provider, ethers } from 'ethers';

import {
  EthereumNotFoundError,
  PENDING_REQUEST_ERROR_CODE,
  UNKNOWN_CHAIN_ERROR_CODE,
  isErrorWithCode,
  transformError
} from './error';
import { networks } from './networks';
import { Connection } from '../types/connection';
import { sleep } from './sleep';

interface MaybeMetamaskProvider extends ethers.Eip1193Provider, Partial<Pick<Provider, 'on' | 'off'>> {
  isMetaMask?: boolean;
}

export const getEthereum = () => window.ethereum ? window.ethereum as MaybeMetamaskProvider : undefined;

export const ethereumIsAvailable = () => Boolean(getEthereum());
export const metamaskIsAvailable = () => getEthereum()?.isMetaMask ?? false;

/**
 * Requests adding network by the specified id. If the specified network is unknown, an error is thrown.
 */
const addNetwork = async (networkId: number) => {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new EthereumNotFoundError();
  }

  const { knownTokens, chainId, ...networkProps } = networks[networkId];

  if (networkProps) {
    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{ ...networkProps, chainId: `0x${networkId.toString(16)}` }]
      });
    } catch (e) {
      if (isErrorWithCode(e) && e.code === PENDING_REQUEST_ERROR_CODE) {
        return;
      }

      throw e;
    }
  } else {
    throw new Error(`Network with id ${networkId} is not supported`);
  }
};

/** Switches network in Metamask and reloads the window */
export const switchChain = async (networkId: number): Promise<void> => {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new EthereumNotFoundError();
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${networkId.toString(16)}` }]
    });
    window.location.reload();
  } catch (e) {
    const errorCode = isErrorWithCode(e) ? e.code : undefined;
    if (errorCode === UNKNOWN_CHAIN_ERROR_CODE) {
      await addNetwork(networkId);
      await sleep(100);

      return switchChain(networkId);
    }
    
    if (errorCode === PENDING_REQUEST_ERROR_CODE) {
      return;
    }

    throw transformError(e);
  }
};

/**
 * Creates a connection to Metamask wallet and returns credentials. If the ID of the network which is selected
 * in Metamask is not equal to the specified one or is not supported, the network is switched. The window is
 * reloaded if the switch is successful. If another request is pending, the function returns `undefined`.
 */
export const getConnection = async (networkId?: number): Promise<Connection | undefined> => {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new EthereumNotFoundError();
  }

  try {
    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const { chainId: rawActualNetworkId } = await provider.getNetwork();
    let actualNetworkId = Number(rawActualNetworkId);

    if (!networks[actualNetworkId] || (networkId !== undefined && networkId !== actualNetworkId)) {
      const networkIdToConnect = networkId ?? 1;
      await switchChain(networkIdToConnect);
      actualNetworkId = networkIdToConnect;
    }

    return { signer, provider, networkId: actualNetworkId, address };
  } catch (e) {
    const errorCode = isErrorWithCode(e) ? e.code : undefined;
    if (errorCode === UNKNOWN_CHAIN_ERROR_CODE && networkId) {
      await addNetwork(networkId);
      await sleep(100);

      const connection = await getConnection(networkId);

      return connection;
    }

    if (errorCode === PENDING_REQUEST_ERROR_CODE) {
      return undefined;
    }

    throw transformError(e);
  }
};
