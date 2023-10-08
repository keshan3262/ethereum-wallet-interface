import { useEffect, useRef } from 'react';
import { connectionStore } from '../store/connection';
import { tokensStore } from '../store/tokens';
import { ContractTokenDescriptor, TokenType } from '../types/tokens';
import { getTokenContract, getTokenSlug } from '../utils/tokens';

/** Provides updates of the native token balance on each block and updates of other tokens balances on each
 * transfer of the token to/from the connected account. Zero transfers and transfers to oneself are ignored.
 */
export const useBalanceOnBlockUpdating = () => {
  const connection = connectionStore.connection;
  const tokens = tokensStore.tokens;
  const accountAddress = connection?.address;
  const connectedNetworkId = connection?.networkId;
  const prevTokensRef = useRef(tokens);
  const prevAccountRef = useRef(accountAddress);
  const prevConnectedNetworkIdRef = useRef(connectedNetworkId);
  const prevBlockNumberRef = useRef(-1);

  useEffect(() => {
    if (!connection) {
      return;
    }

    const transferListeners = tokens
      .filter((token): token is ContractTokenDescriptor => token.type !== TokenType.Native)
      .map(token => {
        const contract = getTokenContract(token, connection.provider);
        const listener = (from: string, to: string, amount: bigint) => {
          if ((from === connection.address || to === connection.address) && amount > 0 && from !== to) {
            tokensStore.balancesAreOutdated[getTokenSlug(token)] = true;
          }
        };
        contract.on('Transfer', listener);

        return { contract, listener };
      });

    prevTokensRef.current = tokens;
    prevAccountRef.current = accountAddress;
    prevConnectedNetworkIdRef.current = connectedNetworkId;

    const blockPollingInterval = setInterval(async () => {
      try {
        const blockNumber = await connection.provider.getBlockNumber();
        if (prevBlockNumberRef.current !== blockNumber && prevBlockNumberRef.current !== -1) {
          tokensStore.balancesAreOutdated[getTokenSlug({ type: TokenType.Native })] = true;
          void tokensStore.updateOutdatedBalances();
        }
        prevBlockNumberRef.current = blockNumber;
      } catch (e) {
        console.error(e);
      }
    }, 1000);

    return () => {
      transferListeners.forEach(({ contract, listener }) => contract.off('Transfer', listener));
      clearInterval(blockPollingInterval);
    }
  }, [accountAddress, connectedNetworkId, connection, tokens]);
};
