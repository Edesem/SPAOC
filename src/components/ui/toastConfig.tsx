// toastConfig.ts
import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Colours } from '@/theme/colours'; // adjust this to your file path
import { typography } from '@/theme/typography';

export const toastConfig = (colorScheme: 'light' | 'dark') => {
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;
  const text1Style = {
    ...typography.body,
    fontSize: 15,
    color: theme.moreImportantText,
  };

  return {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: theme.primary,
          backgroundColor: theme.itemBackground,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
        }}
        text1Style={text1Style}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: theme.error,
          backgroundColor: theme.itemBackground,
        }}
        text1Style={text1Style}
      />
    ),
  };
};
