import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import 'jest-styled-components';
import {ColorInput} from './ColorInput';

import {Wrapper} from '../common/ForTest';

test('toggle open', async () => {
  const onInput = jest.fn();
  const togglePalette = jest.fn();

  render(
    <Wrapper>
      <ColorInput
        value="#000"
        onInput={onInput}
        togglePalette={togglePalette}
        showPalette={false}
      />
    </Wrapper>,
  );

  expect(togglePalette).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByTestId('toggle-palette'));
  expect(togglePalette).toHaveBeenCalled();
});

test('toggle close', async () => {
  const onInput = jest.fn();
  const togglePalette = jest.fn();

  render(
    <Wrapper>
      <div data-testid="out" />
      <ColorInput
        value="#000"
        onInput={onInput}
        togglePalette={togglePalette}
        showPalette={true}
      />
    </Wrapper>,
  );

  screen.findByTestId('palette');

  expect(togglePalette).not.toHaveBeenCalled();

  fireEvent.click(await screen.findByTestId('toggle-palette'));
  expect(togglePalette).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByTestId('out'));
  expect(togglePalette).toHaveBeenCalledTimes(2);
});
