import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, useColorScheme, ActivityIndicator, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles';
import { Colours } from '@/styles/Colours';
import { fetchLiturgicalTexts } from '@/AntiochianApi';

interface LiturgicalData {
  publicUrl: string;
  typeOfService: string;
}

interface OrganizedData {
  [service: string]: {
    pdf: string | null;
    rtf: string | null;
  };
}

export default function PrayerScreen(): JSX.Element {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  // State for fetching data
  const [data, setData] = useState<LiturgicalData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchLiturgicalTexts()
      .then(fetchedData => {
        if (fetchedData) {
          setData(fetchedData);
          setLoading(false);
        } else {
          setError(new Error('Error fetching liturgical texts'));
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const organizeData = (data: LiturgicalData[]): OrganizedData => {
    return data.reduce((acc, { publicUrl, typeOfService }) => {
      if (!publicUrl) return acc; // Skip if no publicUrl

      // Only process PDF entries, ignore RTF
      if (typeOfService.includes('PDF')) {
        if (!acc[typeOfService]) acc[typeOfService] = { pdf: null, rtf: null };
        acc[typeOfService].pdf = publicUrl; // Assign the URL to the PDF format
      }

      return acc;
    }, {} as OrganizedData);
  };

  const organizedData = data ? organizeData(data) : {};

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[CommonStyles.container, { flex: 1 }]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={CommonStyles.title}>
            Prayer
          </ThemedText>
          <Text style={styles.subtitle}>"Pray without ceasing."{'\n'} - 1 Thessalonians 5:17</Text>
        </View>

        {/* Content Section */}
        <View style={[styles.contentSection, { backgroundColor: theme.itemBackground }]}>
          <Text style={CommonStyles.sectionTitle}>Daily Liturgical Texts</Text>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text>Loading prayers...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>Error loading prayers</Text>
          ) : (
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              {Object.keys(organizedData).map((service) => (
                <View key={service} style={styles.serviceContainer}>
                  {organizedData[service].pdf && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(organizedData[service].pdf!)}
                      style={({ pressed }) => [
                        styles.linkText,
                        { opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={CommonStyles.detailText}>{service}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  serviceContainer: {
    marginBottom: 20,
  },
  linkText: {
    color: 'blue',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
