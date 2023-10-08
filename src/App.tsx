import './App.css';
import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { connectionStore } from './store/connection';
import { networks } from './utils/networks';
import { getEthereum, metamaskIsAvailable, switchChain } from './utils/connection';
import { EthereumNotFoundError, getErrorMessage } from './utils/error';

const App = observer(() => {
  const connection = connectionStore.connection;
  const [selectedNetworkId, setSelectedNetworkId] = useState(1);
  const [canConnect, setCanConnect] = useState(metamaskIsAvailable());

  const handleSelectedNetworkChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetworkId = Number(e.target.value);
    setSelectedNetworkId(newNetworkId);

    if (connection) {
      try {
        await switchChain(newNetworkId);
      } catch (e) {
        alert(getErrorMessage(e));
        setSelectedNetworkId(connection.networkId);
      }
    }
  }, [connection]);

  const handleConnectClick = useCallback(async () => {
    try {
      if (connection) {
        await connectionStore.disconnect();
      } else {
        const { networkId } = await connectionStore.connect(selectedNetworkId);
        setSelectedNetworkId(networkId);
      }
    } catch (e) {
      alert(getErrorMessage(e));
    }
  }, [connection, selectedNetworkId]);

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum || !connection) {
      return;
    }

    const handleAccountsChanged = async () => {
      try {
        await connectionStore.refreshAccount();
      } catch (e) {
        alert(getErrorMessage(e));
      }
    };

    const handleChainChanged = () => window.location.reload();

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.off('accountsChanged', handleAccountsChanged);
      ethereum.off('chainChanged', handleChainChanged);
    };
  }, [connection]);

  useEffect(() => {
    connectionStore
      .connect()
      .then(({ networkId }) => setSelectedNetworkId(networkId))
      .catch(e => {
        if (e instanceof EthereumNotFoundError) {
          return;
        }

        alert(getErrorMessage(e));
      });
    
    const timeout = setTimeout(() => setCanConnect(metamaskIsAvailable()), 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div data-testid="App">
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
      {connection?.address ?? 'Not connected'}
    </div>
  );
});

export default App;
