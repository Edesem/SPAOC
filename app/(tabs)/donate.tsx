import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, Linking, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles'; // Use dynamic styles
import { ACCOUNT_NO, BANK_NAME, BSB, SQUARE_URL } from '@/constants/consts';
import { setStringAsync } from 'expo-clipboard';
import { Haptic } from '@/hooks/hapticPress';
import { Colours } from '@/styles/Colours';

export default function DonateScreen() {
  const colorScheme = useColorScheme(); // Get the current system theme (light or dark)
  const scheme = colorScheme === 'dark' ? 'dark' : 'light'; // Use theme string for dark/light
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;

  const CommonStyles = getCommonStyles(scheme); // Get the dynamic styles

  const [copied, setCopied] = useState(false); // Track if the details are copied

  const handleCopyDetails = async () => {
    const bankDetails = `${BANK_NAME}\n${ACCOUNT_NO}\n${BSB}`;
    Haptic.press();

    await setStringAsync(bankDetails);

    setCopied(true); // Update the state to show "Copied!"
  };

  const handleSquarePayment = () => {
    Haptic.press();

    Linking.openURL(SQUARE_URL);
  };

  // Reset the "Copied!" state when the screen loses focus
  useFocusEffect(
    useCallback(() => {
      setCopied(false); // Reset copied state when the screen is focused
    }, [])
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={CommonStyles.container}>
        <ScrollView>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={CommonStyles.title}>
              Donate
            </ThemedText>
            {/* Bible Verse Below Donate */}
            <Text style={styles.bibleVerse}>
              "For where your treasure is, there your heart will be also." - Matthew 6:21
            </Text>
          </View>

          {/* Square Payment Section */}
          <View style={[styles.paymentSection, { backgroundColor: theme.itemBackground }]}>
            <Text style={CommonStyles.sectionTitle}>Support Us Online</Text>
            <TouchableOpacity style={[styles.squareButton, { backgroundColor: theme.donateButton }]} onPress={handleSquarePayment}>
              <Text style={styles.squareButtonText}>Donate via Square</Text>
            </TouchableOpacity>
          </View>

          {/* Bank Details Section */}
          <View style={[styles.bankDetailsSection, { backgroundColor: theme.itemBackground }]}>
            <Text style={CommonStyles.sectionTitle}>Bank Transfer Details</Text>
            <View style={styles.bankDetails}>
              <Text style={CommonStyles.detailText}>Bank Name: {BANK_NAME}</Text>
              
              <Text style={CommonStyles.detailText}>Account Number: {ACCOUNT_NO}</Text>
              <Text style={CommonStyles.detailText}>BSB: {BSB}</Text>
            </View>

          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/orthodox/icxc.png')} // Adjust the path to your image
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
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
  bibleVerse: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'grey', // Static value, can be updated for dynamic themes if necessary
    marginTop: 10,
    marginHorizontal: 26,
    textAlign: 'center',
  },
  paymentSection: {
    borderRadius: 10,
    padding: 20,
    margin: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  squareButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  squareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bankDetailsSection: {
    borderRadius: 10,
    padding: 20,
    margin: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bankDetails: {
    marginBottom: 15,
  },
  copyButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomImage: {
    width: 100, // Adjust the width of the image
    height: 100, // Adjust the height of the image
    resizeMode: 'contain', // Ensure the image doesn't get stretched
    marginBottom: 50,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 10, // Adjust the space above the image
    marginBottom: 10, // Adjust the space below the image if needed
    flex: 1, // Allows image container to take remaining space
    justifyContent: 'center', // Aligns the image in the middle
  },
});
