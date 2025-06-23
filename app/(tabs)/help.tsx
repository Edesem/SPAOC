import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, Linking, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles'; // Use dynamic styles
import { Colours } from '@/styles/Colours';

export default function HelpScreen() {
  const colorScheme = useColorScheme(); // Get the current system theme (light or dark)
  const scheme = colorScheme === 'dark' ? 'dark' : 'light'; // Use theme string for dark/light
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;

  const CommonStyles = getCommonStyles(scheme); // Get the dynamic styles

  return (
    <SafeAreaProvider>
      <SafeAreaView style={CommonStyles.container}>
        <ScrollView>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={CommonStyles.title}>
              Help
            </ThemedText>
            {/* Bible Verse Below Donate */}
            <Text style={styles.subtitle}>
              This is for help
            </Text>
          </View>

        </ScrollView>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'grey', // Static value, can be updated for dynamic themes if necessary
    marginTop: 10,
    marginHorizontal: 26,
    textAlign: 'center',
  },
 
});
