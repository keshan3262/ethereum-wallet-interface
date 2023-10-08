import { getErrorMessage } from './error';

export const withErrorDisplay = async (
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
};