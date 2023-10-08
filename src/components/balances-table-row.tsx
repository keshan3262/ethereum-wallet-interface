import { formatUnits } from 'ethers';
import { memo } from 'react';

import { FetchState } from '../types/fetch-state';
import { TokenDescriptor, TokenMetadata, TokenType } from '../types/tokens';

import './balances-table-row.css';

interface BalancesTableRowProps {
  value?: FetchState<bigint>;
  tokenMetadata?: FetchState<TokenMetadata>;
  token: TokenDescriptor;
}

const loadingValue: FetchState<bigint> = { isLoading: true };
const loadingTokenMetadata: FetchState<TokenMetadata> = { isLoading: true };

export const BalancesTableRow = memo(({ value = loadingValue, tokenMetadata = loadingTokenMetadata, token }: BalancesTableRowProps) => {
  const fallbackTokenName = token.type === TokenType.Native ? 'native token' : `token ${token.address}`;

  if (tokenMetadata.error) {
    return (
      <tr>
        <td>Error while getting metadata of {fallbackTokenName}: {tokenMetadata.error.message}</td>
      </tr>
    );
  }

  if (tokenMetadata.isLoading) {
    return (
      <tr>
        <td>Loading metadata of {fallbackTokenName}...</td>
      </tr>
    );
  }

  const { name, symbol, decimals } = tokenMetadata.data;

  if (value.error) {
    return (
      <tr>
        <td>
          Failed to fetch balance of token {name} ({symbol})
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{name} ({symbol})</td>
      <td className="balance-value">
        {value.data === undefined ? 'Loading balance...' : formatUnits(value.data, decimals)}
      </td>
    </tr>
  );
});
