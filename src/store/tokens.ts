import { action, makeObservable, observable } from 'mobx';
import { FetchState } from '../types/fetch-state';
import { TokenDescriptor, TokenMetadata } from '../types/tokens';
import { getTokenBalance, getTokenMetadata, getTokenSlug } from '../utils/tokens';
import { connectionStore } from './connection';
import { Connection } from '../types/connection';

const fetchBalanceFn = (connection: Connection, token: TokenDescriptor) => getTokenBalance(
  token,
  connection.provider,
  connection.address
);
const fetchMetadataFn = (connection: Connection, token: TokenDescriptor) => getTokenMetadata(
  token,
  connection.provider
);

class TokensStore {
  tokens: TokenDescriptor[] = [];
  balances: Record<string, FetchState<bigint>> = {};
  metadata: Record<string, FetchState<TokenMetadata>> = {};
  balancesAreOutdated: Record<string, boolean> = {};

  constructor() {
    makeObservable(this, {
      tokens: observable,
      balances: observable,
      metadata: observable,
      setTokens: action,
      patchBalances: action,
      resetBalances: action,
      patchMetadata: action,
      resetMetadata: action
    });
  }

  async getFreshEntityEntry<T>(
    fetchFn: (connection: Connection, token: TokenDescriptor) => Promise<T>,
    token: TokenDescriptor
  ): Promise<[string, FetchState<T>]> {
    const tokenSlug = getTokenSlug(token);
    const connection = connectionStore.connection;

    if (connection) {
      try {
        const data = await fetchFn(connection, token);

        return [tokenSlug, { isLoading: false, data }];
      } catch (e) {
        console.error(e);

        return [tokenSlug, { isLoading: false, error: e instanceof Error ? e : new Error('Unknown error') }];
      }
    }

    return [tokenSlug, { isLoading: false, error: new Error('No connection') }];
  }

  async getFreshEntitiesEntries<T>(
    fetchFn: (connection: Connection, token: TokenDescriptor) => Promise<T>,
    tokens = this.tokens
  ): Promise<Array<[string, FetchState<T>]>> {
    return Promise.all(tokens.map(token => this.getFreshEntityEntry(fetchFn, token)));
  }

  makeTokensLoadingState<T>(
    prevState: Record<string, FetchState<T>>,
    tokens = this.tokens
  ): Record<string, FetchState<T>> {
    return Object.fromEntries(
      this.tokens.map(token => {
        const tokenSlug = getTokenSlug(token);

        return [
          tokenSlug,
          tokens.includes(token) ? prevState[tokenSlug] : { isLoading: true, data: prevState[tokenSlug]?.data }
        ];
      })
    );
  }

  async updateAllBalances() {
    this.patchBalances(this.makeTokensLoadingState(this.balances));

    const newBalancesEntries = await this.getFreshEntitiesEntries(fetchBalanceFn);
    this.patchBalances(Object.fromEntries(newBalancesEntries));
    this.balancesAreOutdated = Object.fromEntries(newBalancesEntries.map(([tokenSlug]) => [tokenSlug, false]));
  }

  async updateOutdatedBalances() {
    const outdatedBalancesTokensSlugs = Object.entries(this.balancesAreOutdated)
      .filter(([, isOutdated]) => isOutdated)
      .map(([tokenSlug]) => tokenSlug);
    const outdatedBalancesTokens = this.tokens.filter(token => outdatedBalancesTokensSlugs.includes(getTokenSlug(token)));
    this.patchBalances(this.makeTokensLoadingState(this.balances, outdatedBalancesTokens));

    const newBalancesEntries = await this.getFreshEntitiesEntries(fetchBalanceFn, outdatedBalancesTokens);
    this.patchBalances(Object.fromEntries(newBalancesEntries));
    this.balancesAreOutdated = Object.fromEntries(newBalancesEntries.map(([tokenSlug]) => [tokenSlug, false]));
  }

  async updateBalance(token: TokenDescriptor) {
    const tokenSlug = getTokenSlug(token);
    this.patchBalances(this.makeTokensLoadingState(this.balances, [token]));
    const [, balanceFetchState] = await this.getFreshEntityEntry(fetchBalanceFn, token);

    this.patchBalances({ [tokenSlug]: balanceFetchState });
    this.balancesAreOutdated[tokenSlug] = false;
  }

  async updateAllMetadata() {
    this.patchMetadata(this.makeTokensLoadingState(this.metadata));

    const newMetadataEntries = await this.getFreshEntitiesEntries(fetchMetadataFn);
    this.patchMetadata(Object.fromEntries(newMetadataEntries));
  }

  setTokens(tokens: TokenDescriptor[]) {
    this.tokens = tokens;
  }

  patchBalances(balances: Record<string, FetchState<bigint>>) {
    this.balances = { ...this.balances, ...balances };
  }

  resetBalances() {
    this.balances = Object.fromEntries(this.tokens.map(token => [getTokenSlug(token), { isLoading: true }]));
  }

  patchMetadata(metadata: Record<string, FetchState<TokenMetadata>>) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  resetMetadata() {
    this.metadata = Object.fromEntries(this.tokens.map(token => [getTokenSlug(token), { isLoading: true }]));
  }
}

export const tokensStore = new TokensStore();