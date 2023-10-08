export const UNKNOWN_CHAIN_ERROR_CODE = 4902;
export const USER_REJECTED_ERROR_CODE = 4001;
export const PENDING_REQUEST_ERROR_CODE = -32002;

interface ErrorWithCode {
  code: number;
  message: string;
}

export class TrueErrorWithCode extends Error implements ErrorWithCode {
  constructor(public code: number, message: string) {
    super(message);
  }
}

export class UnknownChainErrorCode extends TrueErrorWithCode {
  constructor(message = 'Unknown chain') {
    super(UNKNOWN_CHAIN_ERROR_CODE, message);
  }
}

export class EthereumNotFoundError extends Error {
  constructor(message = 'No Ethereum provider found') {
    super(message);
  }
}

export class UserRejectedError extends TrueErrorWithCode {
  constructor(message = 'The action was rejected by the user') {
    super(USER_REJECTED_ERROR_CODE, message);
  }
}

export const isErrorWithCode = (error: unknown): error is ErrorWithCode => (error as any).code !== undefined;

export const transformError = (error: unknown) => {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case UNKNOWN_CHAIN_ERROR_CODE:
        return new UnknownChainErrorCode();
      case USER_REJECTED_ERROR_CODE:
        return new UserRejectedError();
      default:
        return new TrueErrorWithCode(error.code, error.message);
    }
  }

  return error;
}

export const getErrorMessage = (error: unknown) => {
  if (isErrorWithCode(error)) {
    return `Provider error: ${error.message} (code ${error.code})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
};
