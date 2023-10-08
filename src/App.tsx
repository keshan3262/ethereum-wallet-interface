import { observer } from 'mobx-react-lite';
import { connectionStore } from './store/connection';
import { ConnectionForm } from './layouts/connection-form';

const App = observer(() => {
  const connection = connectionStore.connection;

  return (
    <div data-testid="App">
      <ConnectionForm />
      {connection?.address ?? 'Not connected'}
    </div>
  );
});

export default App;
