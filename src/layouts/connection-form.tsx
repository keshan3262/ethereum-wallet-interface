import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';

import { connectionStore } from '../store/connection';
import { getEthereum, metamaskIsAvailable, switchChain } from '../utils/connection';
import { EthereumNotFoundError, getErrorMessage } from '../utils/error';
import { networks } from '../utils/networks';

export const ConnectionForm = observer(() => {
  const connection = connectionStore.connection;
  const [selectedNetworkId, setSelectedNetworkId] = useState(1);
  const [canConnect, setCanConnect] = useState(metamaskIsAvailable());

  const withErrorDisplay = useCallback(async (
    fn: () => Promise<void>,
    shouldShowError: (e: unknown) => boolean = () => true) => {
    try {
      await fn();
    } catch (e) {
      if (shouldShowError(e)) {
        console.error(e);
        alert(getErrorMessage(e));
      }
    }
  }, []);

  const onNetworkChange = useCallback((networkId: number) => {
    setSelectedNetworkId(networkId);
  }, []);

  const handleSelectedNetworkChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetworkId = Number(e.target.value);
    setSelectedNetworkId(newNetworkId);

    if (connection) {
      await withErrorDisplay(async () => {
        await switchChain(newNetworkId);
        onNetworkChange(newNetworkId);
      });
    }
  }, [connection, onNetworkChange, withErrorDisplay]);

  const handleConnectClick = useCallback(async () => withErrorDisplay(async () => {
    if (connection) {
      await connectionStore.disconnect();
    } else {
      const { networkId } = await connectionStore.connect(selectedNetworkId);
      onNetworkChange(networkId);
    }
  }), [connection, onNetworkChange, selectedNetworkId, withErrorDisplay]);

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum || !connection) {
      return;
    }

    const handleAccountsChanged = async () => withErrorDisplay(async () => {
      connectionStore.refreshAccount();
    });

    const handleChainChanged = () => window.location.reload();

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.off('accountsChanged', handleAccountsChanged);
      ethereum.off('chainChanged', handleChainChanged);
    };
  }, [connection, withErrorDisplay]);

  useEffect(() => {
    withErrorDisplay(async () => {
      const { networkId } = await connectionStore.connect();
      onNetworkChange(networkId);
    }, e => !(e instanceof EthereumNotFoundError));
    
    const timeout = setTimeout(() => setCanConnect(metamaskIsAvailable()), 1000);

    return () => clearTimeout(timeout);
  }, [onNetworkChange, withErrorDisplay]);

  return (
    <div className="row">
      <select value={selectedNetworkId} onChange={handleSelectedNetworkChange}>
        {Object.values(networks).map(({ id, fullName }) => (
          <option key={id} value={id}>{fullName}</option>
        ))}
      </select>
      <button disabled={!canConnect} type="button" onClick={handleConnectClick}>
        {!canConnect && 'Metamask is not available'}
        {canConnect && connection && 'Disconnect'}
        {canConnect && !connection && 'Connect'}
      </button>
    </div>
  );
});
