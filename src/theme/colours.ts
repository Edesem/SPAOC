/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Colours = {
  light: {
    primary: '#0a4068',        
    secondary: '#a88646',    
    background: '#F7F6F7',    
    detail: '#555',
    moreImportantText: '#333',
    lessImportantText: '#666',  // 5.3:1 on background, 5.7:1 on cards
    sectionDate: '#5d5d5d',
    itemBackground: '#FFFFFF',
    donateButton: '#de333f',
    chevronColor: '#8C8C8C',    // 3:1 against cards, so the empty star reads as a control
    onPrimary: '#FFFFFF',       // text and icons on a primary fill
    onSecondary: '#121212',     // bronze is too light for white text
    onDonate: '#FFFFFF',
    error: '#B3261E',
    tabInactive: '#6B6B6B',
    favourite: '#B07D00',       // the filled star; #FFD700 is 1.4:1 on white
    separator: '#D0D0D0',
    commemorate: '#A3352B',     // the Home "Today we Commemorate" heading and week labels
  },
  dark: {
    primary: '#a88646',      // A darker shade of blue for better contrast
    secondary: '#a88646',    // A warm bronze/golden tone for accents
    background: '#121212',   // A deeper black for the background
    detail: '#bbb',          // Lighter grey for less important elements
    moreImportantText: '#E1E1E1',  // Lighter text for headings and important text
    lessImportantText: '#B0B0B0',  // Lighter grey text for secondary content
    sectionDate: '#999',     // Slightly lighter grey for dates
    itemBackground: '#272727',
    donateButton: '#b51a25',
    chevronColor: '#777',
    onPrimary: '#121212',       // primary is bronze in dark; white on it is 3.4:1
    onSecondary: '#121212',
    onDonate: '#FFFFFF',
    error: '#F2766B',
    tabInactive: '#888',
    favourite: '#FFD700',
    separator: '#4A4A4A',
    commemorate: '#D9695E',     // #A3352B is 2.6:1 on the dark background; this is 5.5:1
  },
};
