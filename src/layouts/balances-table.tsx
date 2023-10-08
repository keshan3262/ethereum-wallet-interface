import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { connectionStore } from '../store/connection';
import { tokensStore } from '../store/tokens';
import { getTokenSlug } from '../utils/tokens';
import { BalancesTableRow } from '../components/balances-table-row';
import { useBalanceOnBlockUpdating } from '../hooks/use-balances-on-block-updating';

export const BalancesTable = observer(() => {
  const connection = connectionStore.connection;
  const tokens = tokensStore.tokens;
  const tokensMetadata = tokensStore.metadata;
  const balances = tokensStore.balances;
  const accountAddress = connection?.address;
  const connectedNetworkId = connection?.networkId;
  const prevTokensRef = useRef(tokens);
  const prevAccountRef = useRef(accountAddress);
  const prevConnectedNetworkIdRef = useRef(connectedNetworkId);

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

    prevTokensRef.current = tokens;
    prevAccountRef.current = accountAddress;
    prevConnectedNetworkIdRef.current = connectedNetworkId;
  }, [connection, tokens, accountAddress, connectedNetworkId]);

  useBalanceOnBlockUpdating();

  return (
    <table>
      <tbody>
        {tokens.map(token => (
          <BalancesTableRow
            token={token}
            valueState={balances[getTokenSlug(token)]}
            tokenMetadataState={tokensMetadata[getTokenSlug(token)]} key={getTokenSlug(token)} />
        ))}
      </tbody>
    </table>
  );
});
