import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, SafeAreaView, Image, Alert, Linking, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import { getCommonStyles } from '@/styles/CommonStyles';
import { Colours } from '@/styles/Colours';
import { CALENDLY_URL } from '@/constants/consts';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Haptic } from '@/hooks/hapticPress';

export default function TabTwoScreen() {
  const router = useRouter();

  const colorScheme = useColorScheme();  // Get the current system theme (light or dark)
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';  // Use theme string for dark/light
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;

  const CommonStyles = getCommonStyles(scheme);  // Get theme-specific styles

  const handleNavigation = () => {
    Haptic.press(ImpactFeedbackStyle.Heavy);
    Linking.openURL(CALENDLY_URL);
  };

  const showComingSoonAlert = () => {
    Haptic.press(ImpactFeedbackStyle.Soft);
    Alert.alert("Coming Soon", "This feature is not available yet.", [{ text: "OK" }]);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={CommonStyles.container}>
        <ThemedText type="title" style={CommonStyles.title}>
          Bookings
        </ThemedText>
        <View style={styles.buttonContainer}>
          {["Confessions", "Baptisms", "Memorials", "Funerals"].map((category) => (
            <TouchableOpacity
              key={category}
              style={CommonStyles.button}
              onPress={
                category === "Confessions" ? handleNavigation : showComingSoonAlert
              }>
              <Text style={CommonStyles.buttonText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/orthodox/enthroned.png')}
            style={[styles.bottomImage, { tintColor: theme.primary }]}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  bottomImage: {
    width: 300, // Adjust the width of the image
    height: 300, // Adjust the height of the image
    resizeMode: 'contain', // Ensure the image doesn't get stretched
    marginBottom: 50,
  },
});
