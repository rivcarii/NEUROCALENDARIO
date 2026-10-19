import { useColorScheme } from 'react-native';

const light = {
  bg: '#F6F8FB', card: '#FFFFFF', text: '#14202B', muted: '#5B6B7A', border: '#D5DDE6',
  primary: '#2F5D8A', onPrimary: '#FFFFFF', danger: '#B3261E', success: '#2E7D4F', warn: '#9A6700',
  chip: '#E8EEF5', chipOn: '#2F5D8A',
};
const dark: typeof light = {
  bg: '#0E141A', card: '#17202A', text: '#EAF0F6', muted: '#9DAEBF', border: '#2B3948',
  primary: '#7FB0E0', onPrimary: '#0E141A', danger: '#FF8A80', success: '#74C69D', warn: '#E3B341',
  chip: '#22303D', chipOn: '#7FB0E0',
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const MIN_TOUCH = 48;
