import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';

import { connectionStore } from '../store/connection';
import { getEthereum, metamaskIsAvailable, switchChain } from '../utils/connection';
import { EthereumNotFoundError, UnknownChainErrorCode } from '../utils/error';
import { networks } from '../utils/networks';
import { tokensStore } from '../store/tokens';
import { TokenType } from '../types/tokens';
import { withErrorDisplay } from '../utils/with-error-display';

export const ConnectionForm = observer(() => {
  const connection = connectionStore.connection;
  const [selectedNetworkId, setSelectedNetworkId] = useState(1);
  const [canConnect, setCanConnect] = useState(metamaskIsAvailable());

  const onNetworkChange = useCallback((networkId?: number) => {
    if (networkId === undefined) {
      tokensStore.setTokens([]);
    } else {
      setSelectedNetworkId(networkId);
      const network = networks[networkId];
      tokensStore.setTokens([{ type: TokenType.Native }, ...network.knownTokens]);
    }
  }, []);

  const handleSelectedNetworkChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetworkId = Number(e.target.value);

    if (connection) {
      await withErrorDisplay(async () => switchChain(newNetworkId), e => !(e instanceof UnknownChainErrorCode));
    } else {
      setSelectedNetworkId(newNetworkId);
    }
  }, [connection]);

  const handleConnectClick = useCallback(async () => withErrorDisplay(async () => {
    if (connection) {
      await connectionStore.disconnect();
      onNetworkChange(undefined);
    } else {
      await connectionStore.connect(selectedNetworkId);
      const newConnection = connectionStore.connection;
      onNetworkChange(newConnection?.networkId);
    }
  }), [connection, onNetworkChange, selectedNetworkId]);

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum || !connection) {
      return;
    }

    const handleAccountsChanged = async () => withErrorDisplay(async () => connectionStore.refreshAccount());

    if (ethereum.on && ethereum.off) {
      const handleChainChanged = () => window.location.reload();

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.off?.('accountsChanged', handleAccountsChanged);
        ethereum.off?.('chainChanged', handleChainChanged);
      };
    }

    const checkAccountInterval = setInterval(async () => {
      try {
        const actualSigner = await connection.provider.getSigner();
        const actualAddress = await actualSigner.getAddress();
        const actualNetwork = await connection.provider.getNetwork();
        if (actualAddress !== connection.address) {
          await handleAccountsChanged();
        }
        if (actualNetwork.chainId !== BigInt(connection.networkId)) {
          window.location.reload();
        }
      } catch (e) {
        // Network is changed inside Metamask
        if (e instanceof Error && 'event' in e && 'code' in e && e.event === 'changed' && e.code === 'NETWORK_ERROR') {
          window.location.reload();
        } else {
          console.error(e);
        }
      }
    }, 100);

    return () => clearInterval(checkAccountInterval);
  }, [connection]);

  useEffect(() => {
    if (canConnect) {
      withErrorDisplay(async () => {
        await connectionStore.connect();
        const newConnection = connectionStore.connection;
        onNetworkChange(newConnection?.networkId);
      }, e => !(e instanceof EthereumNotFoundError));
    }
  }, [onNetworkChange, canConnect]);

  useEffect(() => {
    const interval = setInterval(() => setCanConnect(metamaskIsAvailable()), 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="row">
      <select value={selectedNetworkId} onChange={handleSelectedNetworkChange}>
        {Object.values(networks).map(({ chainId: id, chainName: fullName }) => (
          <option key={id} value={id}>{fullName}</option>
        ))}
      </select>
      <button disabled={!canConnect} type="button" onClick={handleConnectClick}>
        {!canConnect && 'Metamask is not available'}
        {canConnect && connection && `${connection.address.slice(0, 6)}...${connection.address.slice(-4)}`}
        {canConnect && !connection && 'Connect'}
      </button>
    </div>
  );
});
