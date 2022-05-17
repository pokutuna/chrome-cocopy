import React, {memo, useMemo} from 'react';

import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {isDev} from '../../lib/util';

export const MainColumn = styled.div`
  padding: 0;
  width: 840px;
  margin: 20px auto;
`;

const TitleIcon = styled.div<{dev: boolean}>`
  display: inline-block;
  background: no-repeat center/contain url('img/logo.png');
  width: 123px;
  height: 60px;

  filter: ${props =>
    props.dev
      ? 'invert(24%) sepia(85%) saturate(3947%) hue-rotate(167deg) brightness(93%) contrast(101%)'
      : 'none'};
`;

export const Title = memo(() => {
  const dev = useMemo(() => isDev(), []);

  return (
    <header>
      <Link to="/">
        <TitleIcon dev={dev} />
      </Link>
    </header>
  );
});

const SectionBox = styled.div`
  margin-bottom: ${props => props.theme.space[8]};
`;

const SectionTitleHeader = styled.h2`
  font-family: ${props => props.theme.fontFamily.monospace};
  font-size: ${props => props.theme.size['xl']};
`;

const SectionInner = styled.div`
  margin-left: ${props => props.theme.space[2]};
`;

export const Section = (props: {title: string; children?: React.ReactNode}) => (
  <SectionBox>
    <SectionTitleHeader>{props.title}</SectionTitleHeader>
    <SectionInner>{props.children}</SectionInner>
  </SectionBox>
);

export const TextList = styled.ul`
  font-size: ${props => props.theme.size.sm};
  margin-bottom: ${props => props.theme.space[4]};
  li {
    margin-bottom: ${props => props.theme.space[2]};
  }
  code {
    font-size: ${props => props.theme.size.xs};
    font-family: ${props => props.theme.fontFamily.monospace};
    background-color: ${props => props.theme.color.codeBg};
  }
`;

export const Box = styled.div`
  display: flex;
  flex-flow: column wrap;
`;

export const Item = styled.div<{grow?: number}>`
  display: flex;
  flex-grow: ${props => props.grow || 0};
`;

export const Row = styled.div`
  display: flex;
  flex-flow: row wrap;
  ${Item} + ${Item} {
    margin-left: ${props => props.theme.space[4]};
  }
`;

export const DividerH = styled.div`
  margin: ${props => props.theme.space[4]} 0;
  height: ${props => props.theme.space[1]};
  background: linear-gradient(
    90deg,
    transparent 20%,
    ${props => props.theme.color.lightgray} 20%,
    ${props => props.theme.color.lightgray} 80%,
    transparent 80%
  );
`;

export const DividerV = styled.div`
  margin: 0 ${props => props.theme.space[2]};
  width: ${props => props.theme.space[1]};
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 20%,
    ${props => props.theme.color.lightgray} 20%,
    ${props => props.theme.color.lightgray} 80%,
    transparent 80%
  );
`;

export const ExternalLink = (props: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <a href={props.href} target="_blank" rel="noreferrer noopener">
      {props.children}
    </a>
  );
};

const Center = styled.div`
  text-align: center;
`;

export const VersionLabel = () => {
  const label = useMemo(() => chrome.runtime.getManifest()?.version_name, []);
  return <Center>{label}</Center>;
};
