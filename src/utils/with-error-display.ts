import { getErrorMessage } from './error';

/** If an error occurs while executing the specified function, it is output to the console and as an alert */
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