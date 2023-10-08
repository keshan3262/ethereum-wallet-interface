import { TokenDescriptor, TokenMetadata, TokenType } from '../types/tokens';

interface Network {
  id: number;
  nativeCurrency: TokenMetadata;
  type: string;
  fullName: string;
  shortName: string;
  explorerUrl: string;
  knownTokens: TokenDescriptor[];
}

const ETH = {
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
};

const MATIC = {
  name: 'Matic Token',
  symbol: 'MATIC',
  decimals: 18,
};

export const networks: Record<number, Network> = {
  1: {
    id: 1,
    nativeCurrency: ETH,
    type: 'main',
    fullName: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    explorerUrl: `https://etherscan.io`,
    knownTokens: [
      {
        type: TokenType.ERC20,
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7'
      },
      {
        type: TokenType.ERC20,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      },
      {
        type: TokenType.ERC20,
        address: '0xd533a949740bb3306d119cc777fa900ba034cd52'
      }
    ]
  },
  42161: {
    id: 42161,
    nativeCurrency: ETH,
    type: 'arbitrum',
    fullName: 'Arbitrum Mainnet',
    shortName: 'Arbitrum',
    explorerUrl: 'https://arbiscan.io/',
    knownTokens: [
      {
        type: TokenType.ERC20,
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
      },
      {
        type: TokenType.ERC20,
        address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
      },
      {
        type: TokenType.ERC20,
        address: '0x172370d5cd63279efa6d502dab29171933a610af'
      }
    ]
  },
  137: {
    id: 137,
    nativeCurrency: MATIC,
    type: 'matic',
    fullName: 'Polygon Mainnet',
    shortName: 'Polygon',
    explorerUrl: `https://polygonscan.com`,
    knownTokens: [
      {
        type: TokenType.ERC20,
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
      },
      {
        type: TokenType.ERC20,
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
      },
      {
        type: TokenType.ERC20,
        address: '0x172370d5cd63279efa6d502dab29171933a610af'
      },
    ]
  }
};
