import { action, makeObservable, observable } from 'mobx';

import { ethereumIsAvailable, getConnection, metamaskIsAvailable } from '../utils/connection';
import { EthereumNotFoundError } from '../utils/error';
import { Connection } from '../types/connection';

class ConnectionStore {
  connection: Connection | undefined;

  constructor() {
    makeObservable(this, {
      connection: observable,
      setConnection: action
    });
  }

  disconnect() {
    if (!this.connection) {
      return;
    }

    this.connection.provider.removeAllListeners();
    this.connection.provider.destroy();
    this.setConnection(undefined);
  }

  async connect(networkId?: number) {
    if (!ethereumIsAvailable) {
      throw new EthereumNotFoundError();
    }

    if (!metamaskIsAvailable) {
      throw new Error('Wallets other than Metamask are not supported yet');
    }

    const connection = await getConnection(networkId);
    if (connection) {
      this.setConnection(connection);
    }
  }

  async refreshAccount() {
    if (!this.connection) {
      return;
    }

    const signer = await this.connection.provider.getSigner();
    const address = await signer.getAddress();
    this.setConnection({ ...this.connection, signer, address });
  }

  setConnection(connection: Connection | undefined) {
    this.connection = connection;
  }
}

export const connectionStore = new ConnectionStore();
