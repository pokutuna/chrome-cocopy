import React from "react";
import ReactDOM from "react-dom";

import { MainColumn } from "./components/Parts";

const App = () => {
  return (
    <MainColumn>
      <h1>COCOPY!</h1>
    </MainColumn>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
