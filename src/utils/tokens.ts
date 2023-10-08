import { Signer, Provider, Contract, BaseContractMethod } from 'ethers';
import memoizee from 'memoizee';

import { erc20Abi } from './abi';
import { ContractTokenDescriptor, TokenDescriptor, TokenMetadata, TokenType } from '../types/tokens';
import { networks } from './networks';

type ERC20Contract = Contract & {
  name: BaseContractMethod<[], string, string>;
  symbol: BaseContractMethod<[], string, string>;
  decimals: BaseContractMethod<[], bigint, bigint>;
  balanceOf: BaseContractMethod<[string], bigint, bigint>;
}

export const getTokenContract = memoizee((token: ContractTokenDescriptor, signerOrProvider: Signer | Provider) =>
  new Contract(token.address, erc20Abi, signerOrProvider) as ERC20Contract);

export const getTokenSlug = (token: TokenDescriptor) => token.type === TokenType.Native ? 'ETH' : token.address;

export const getTokenMetadata = async (token: TokenDescriptor, provider: Provider): Promise<TokenMetadata> => {
  if (token.type === TokenType.Native) {
    const network = await provider.getNetwork();

    return networks[Number(network.chainId)].nativeCurrency;
  }

  const contract = getTokenContract(token, provider);
  const [name, symbol, rawDecimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals()
  ]);

  return {
    name,
    symbol,
    decimals: Number(rawDecimals)
  };
};

/** Returns the balance of the specified token in atoms, e.g. 1e6 stands for 1 USDT, 1e18 stands for 1 ETH */
export const getTokenBalance = async (token: TokenDescriptor, provider: Provider, address: string) => {
  if (token.type === TokenType.Native) {
    return provider.getBalance(address);
  }

  const contract = getTokenContract(token, provider);

  return contract.balanceOf(address);
};
