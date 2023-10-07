import { action, makeObservable, observable } from "mobx";

class TestStore {
  counter = 0;

  constructor() {
    makeObservable(this, {
      counter: observable,
      increment: action,
      decrement: action
    });
  }

  increment() {
    this.counter += 1;
  }

  decrement() {
    this.counter -= 1;
  }
}

export const testStore = new TestStore();
