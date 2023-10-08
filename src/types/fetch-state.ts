interface FetchStateBase<T> {
  isLoading: boolean;
  data?: T;
  error?: Error;
}

interface FetchStateLoading<T> extends FetchStateBase<T> {
  isLoading: true;
  data?: T;
  error?: undefined;
}

interface FetchStateSuccess<T> extends FetchStateBase<T> {
  isLoading: false;
  data: T;
  error?: undefined;
}

interface FetchStateError<T> extends FetchStateBase<T> {
  isLoading: false;
  data?: undefined;
  error: Error;
}

export type FetchState<T> = FetchStateLoading<T> | FetchStateSuccess<T> | FetchStateError<T>;
