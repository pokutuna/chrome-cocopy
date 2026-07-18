import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi} from 'vitest';

import {Wrapper} from '../common/ForTest';
import {ColorInput} from './ColorInput';

test('toggle open', async () => {
  const onInput = vi.fn();
  const togglePalette = vi.fn();

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
  const onInput = vi.fn();
  const togglePalette = vi.fn();

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
