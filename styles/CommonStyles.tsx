import { StyleSheet } from 'react-native';
import { Colours } from './Colours'; // Ensure the Colours object contains both light and dark themes
import { useFontStyles } from '@/hooks/useFontStyles';

// Function to get styles based on the current theme
export const getCommonStyles = (theme: string) => {
  const currentTheme = theme === 'dark' ? Colours.dark : Colours.light;
  const font = useFontStyles();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background, // Set background based on the theme
    },
    title: {
      ...font.heading,
      fontWeight: '700',
      textAlign: 'center',
      marginVertical: 20,
      color: currentTheme.moreImportantText, // Use dynamic color for title
    },
    button: {
      width: '80%',
      backgroundColor: currentTheme.secondary, // Set button background based on the theme
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    buttonText: {
      color: '#FFF',
      ...font.body,
      fontWeight: '600',
    },
    sectionTitle: {
      ...font.heading,
      fontWeight: '600',
      color: currentTheme.moreImportantText, // Use dynamic color for section title
      marginBottom: 15,
    },
    image: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
      tintColor: currentTheme.primary, // Set image tint color dynamically
      marginBottom: 10,
    },
    detailText: {
      ...font.body,
      color: currentTheme.detail, // Dynamic color for details text
      marginBottom: 5,
    },
  });
};
