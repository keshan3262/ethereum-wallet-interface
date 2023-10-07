import './App.css';
import { testStore } from './store/test';
import { useCallback } from 'react';
import { observer } from 'mobx-react-lite';

const App = observer(() => {
  const increment = useCallback(() => testStore.increment(), []);
  const decrement = useCallback(() => testStore.decrement(), []);

  return (
    <div className="row">
      <span>{testStore.counter}</span>
      <button type="button" onClick={increment}>+</button>
      <button type="button" onClick={decrement}>-</button>
    </div>
  );
});

export default App;
