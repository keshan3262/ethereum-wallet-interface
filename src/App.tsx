import { ConnectionForm } from './layouts/connection-form';
import { BalancesTable } from './layouts/balances-table';

const App = () => (
  <div data-testid="App">
    <ConnectionForm />
    <p>User's tokens</p>
    <BalancesTable />
  </div>
);

export default App;
