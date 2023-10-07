export const UNKNOWN_CHAIN_ERROR_CODE = 4902;
export const ALREADY_PENDING_ERROR_CODE = -32002;
export const USER_REJECTED_ERROR_CODE = 4001;

interface ErrorWithCode extends Error {
  code: number;
}

export class UnknownChainErrorCode extends Error {
  code = UNKNOWN_CHAIN_ERROR_CODE;

  constructor(message = 'Unknown chain') {
    super(message);
  }
}

export class EthereumNotFoundError extends Error {
  constructor(message = 'No Ethereum provider found') {
    super(message);
  }
}

export class AlreadyPendingError extends Error {
  code = ALREADY_PENDING_ERROR_CODE;

  constructor(message = 'Already pending') {
    super(message);
  }
}

export class UserRejectedError extends Error {
  code = USER_REJECTED_ERROR_CODE;

  constructor(message = 'The action was rejected by the user') {
    super(message);
  }
}

export const isErrorWithCode = (error: unknown): error is ErrorWithCode => error instanceof Error && 'code' in error;

export const transformError = (error: unknown) => {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case UNKNOWN_CHAIN_ERROR_CODE:
        return new UnknownChainErrorCode();
      case ALREADY_PENDING_ERROR_CODE:
        return new AlreadyPendingError();
      case USER_REJECTED_ERROR_CODE:
        return new UserRejectedError();
    }
  }

  return error;
}

export const getErrorMessage = (error: unknown) => {
  console.error(error);

  if (isErrorWithCode(error)) {
    return `Provider error: ${error.message} (code ${error.code})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
};
