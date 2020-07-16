import {h, render} from 'preact';
import {MainColumn, Title} from './components/Parts';

const App = () => {
  return (
    <MainColumn>
      <Title />
    </MainColumn>
  );
};

render(<App />, document.getElementById('root')!);
