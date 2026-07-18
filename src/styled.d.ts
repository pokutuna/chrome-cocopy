import type {Theme} from './components/common/Theme';

declare module 'styled-components' {
  interface DefaultTheme extends Theme {}
}
