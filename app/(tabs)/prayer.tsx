import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles';
import { Colours } from '@/styles/Colours';

export default function PrayerScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={CommonStyles.title}>
            Prayer
          </ThemedText>
          {/* Optional Verse or Subtitle */}
          <Text style={styles.subtitle}>"Pray without ceasing." - 1 Thessalonians 5:17</Text>
        </View>

        {/* Content Section - Add prayers here */}
        <View style={[styles.contentSection, { backgroundColor: theme.itemBackground }]}>
          <Text style={CommonStyles.sectionTitle}>Daily Prayers</Text>
          {/* Placeholder for prayer content */}
          <Text style={CommonStyles.detailText}>[Insert Prayers Here]</Text>
        </View>
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
    color: 'grey',
    marginTop: 10,
    marginHorizontal: 26,
    textAlign: 'center',
  },
  contentSection: {
    borderRadius: 10,
    padding: 20,
    margin: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});
