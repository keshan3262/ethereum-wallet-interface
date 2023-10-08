import { TokenDescriptor, TokenMetadata, TokenType } from '../types/tokens';

interface Network {
  chainId: number;
  nativeCurrency: TokenMetadata;
  chainName: string;
  blockExplorerUrls: string[];
  knownTokens: TokenDescriptor[];
  rpcUrls: string[];
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
    chainId: 1,
    nativeCurrency: ETH,
    chainName: 'Ethereum Mainnet',
    blockExplorerUrls: ['https://etherscan.io'],
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
    ],
    rpcUrls: ['https://mainnet.infura.io/v3']
  },
  42161: {
    chainId: 42161,
    nativeCurrency: ETH,
    chainName: 'Arbitrum Mainnet',
    blockExplorerUrls: ['https://arbiscan.io/'],
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
        address: '0x11cdb42b0eb46d95f990bedd4695a6e3fa034978'
      }
    ],
    rpcUrls: ['https://1rpc.io/arb']
  },
  137: {
    chainId: 137,
    nativeCurrency: MATIC,
    chainName: 'Polygon Mainnet',
    blockExplorerUrls: ['https://polygonscan.com'],
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
    ],
    rpcUrls: ['https://1rpc.io/matic']
  }
};
