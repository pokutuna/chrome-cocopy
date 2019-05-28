import React from "react";
import { css } from "@emotion/core";
import styled from "@emotion/styled";

export const theme = {
  space: {
    1: "8px",
    2: "16px",
    3: "24px"
  }
};

export const MainColumn = styled.div`
  padding: 0;
  width: 960px;
  margin: 20px auto;
`;

export const Rows = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

export const Columns = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const Title = React.memo(() => {
  const Header = Columns.withComponent("header");
  return (
    <Header>
      <div
        css={css`
          background-image: url("img/icon/128.png");
          background-size: contain;
          width: 64px;
          height: 64px;
          margin-right: ${theme.space[1]};
        `}
      />
      <h1 className="title">COCOPY</h1>
    </Header>
  );
});
