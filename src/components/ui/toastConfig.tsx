// toastConfig.ts
import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Colours } from '@/theme/colours'; // adjust this to your file path

export const toastConfig = (colorScheme: 'light' | 'dark') => ({
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: colorScheme === 'dark' ? Colours.dark.primary : Colours.light.primary,
        backgroundColor: colorScheme === 'dark' ? Colours.dark.itemBackground : '#fff',
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 15,
        color: colorScheme === 'dark' ? Colours.dark.moreImportantText : '#333',
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: 'red',
        backgroundColor: colorScheme === 'dark' ? Colours.dark.itemBackground : '#fff',
      }}
      text1Style={{
        fontSize: 15,
        color: colorScheme === 'dark' ? Colours.dark.moreImportantText : '#333',
      }}
    />
  ),
});
