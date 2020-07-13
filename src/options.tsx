import React from 'react';
import ReactDOM from 'react-dom';

import {MainColumn, Title} from './components/Parts';

const App = () => {
  return (
    <MainColumn>
      <Title />
    </MainColumn>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
