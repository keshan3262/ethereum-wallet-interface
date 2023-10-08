import { formatUnits } from 'ethers';
import { observer } from 'mobx-react-lite';

import { connectionStore } from './store/connection';
import { ConnectionForm } from './layouts/connection-form';
import { useEffect, useMemo, useRef } from 'react';
import { tokensStore } from './store/tokens';
import { getTokenContract, getTokenSlug } from './utils/tokens';
import { ContractTokenDescriptor, TokenType } from './types/tokens';

const App = observer(() => {
  const connection = connectionStore.connection;
  const tokens = tokensStore.tokens;
  const balances = tokensStore.balances;
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

    if (prevTokensRef.current !== tokens) {
      tokensStore.resetMetadata();
      tokensStore.resetBalances();
      void Promise.all([
        tokensStore.updateAllMetadata(),
        tokensStore.updateAllBalances()
      ]);
    } else if (
      (prevAccountRef.current !== accountAddress) && (prevConnectedNetworkIdRef.current === connectedNetworkId)
    ) {
      tokensStore.resetBalances();
      void tokensStore.updateAllBalances();
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
  }, [connection, tokens, accountAddress, connectedNetworkId]);

  const serializableBalances = useMemo(() => Object.fromEntries(
    Object.entries(balances).map(([slug, fetchState]) => ([
      slug,
      {
        ...fetchState,
        data: fetchState.data === undefined ? undefined : formatUnits(fetchState.data, 0)
      }
    ]))
  ), [balances]);

  return (
    <div data-testid="App">
      <ConnectionForm />
      {accountAddress ? `Account ${accountAddress}` : 'Not connected'}
      <pre>{JSON.stringify(tokensStore.tokens, null, 2)}</pre>
      <pre>{JSON.stringify(tokensStore.metadata, null, 2)}</pre>
      <pre>{JSON.stringify(serializableBalances, null, 2)}</pre>
    </div>
  );
});

export default App;
