import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { connectionStore } from "../store/connection";
import { tokensStore } from "../store/tokens";
import { ContractTokenDescriptor, TokenType } from "../types/tokens";
import { getTokenContract, getTokenSlug } from "../utils/tokens";
import { BalancesTableRow } from "../components/balances-table-row";

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

  return (
    <table>
      <tbody>
        {tokens.map(token => (
          <BalancesTableRow
            token={token}
            value={balances[getTokenSlug(token)]}
            tokenMetadata={tokensMetadata[getTokenSlug(token)]} key={getTokenSlug(token)} />
        ))}
      </tbody>
    </table>
  );
});
