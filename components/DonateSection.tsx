import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { setStringAsync } from "expo-clipboard";
import { Haptic } from "@/hooks/hapticPress";
import { IconSymbol } from "@/components/ui/IconSymbol";
import Toast from "react-native-toast-message";

import { ACCOUNT_NO, BANK_NAME, BSB, SQUARE_URL } from "@/constants/consts";

export default function DonateSection({ theme, CommonStyles }: any) {
  const [copied, setCopied] = useState(false); // Track if the details are copied
  const [copiedMessage, setCopiedMessage] = useState("");

  const styles = getStyles();

  const handleCopyDetails = async (textToCopy: string, label: string) => {
    Haptic.press();
    await setStringAsync(textToCopy);

    const message = `${label} copied`;
    setCopiedMessage(message); // still keep for UI if you want

    Toast.show({
      type: "success",
      text1: message,
      visibilityTime: 1500,
    });
  };

  const handleCopyAllDetails = async () => {
    Haptic.press();
    const bankDetails = `${BANK_NAME}\n${ACCOUNT_NO}\n${BSB}`;

    await setStringAsync(bankDetails);

    setCopied(true);
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
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[CommonStyles.title, { fontWeight: "bold" }]}>Donate</Text>
        <Text style={[styles.bibleVerse, { color: theme.detail }]}>
          "For where your treasure is, there your heart will be also." - Matthew
          6:21
        </Text>
      </View>

      {/* Square Payment Section */}
      <View
        style={[
          styles.paymentSection,
          { backgroundColor: theme.itemBackground },
        ]}
      >
        <Text style={CommonStyles.sectionTitle}>Support Us Online</Text>
        <TouchableOpacity
          style={[styles.squareButton, { backgroundColor: theme.donateButton }]}
          onPress={handleSquarePayment}
        >
          <Text style={styles.squareButtonText}>Donate via Square</Text>
        </TouchableOpacity>
      </View>

      {/* Bank Details Section */}
      <View
        style={[
          styles.bankDetailsSection,
          { backgroundColor: theme.itemBackground },
        ]}
      >
        <Text style={CommonStyles.sectionTitle}>Bank Transfer Details</Text>

        <View style={styles.bankDetails}>
          {[
            { label: "Bank Name", value: BANK_NAME },
            { label: "Account Number", value: ACCOUNT_NO },
            { label: "BSB", value: BSB },
          ].map(({ label, value }) => (
            <View key={label} style={styles.copyButton}>
              <View style={styles.copyButtonContainer}>
                <Text style={CommonStyles.detailText}>{label}</Text>
                <Text
                  style={[
                    styles.copyValueText,
                    { color: theme.moreImportantText },
                  ]}
                >
                  {value}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCopyDetails(value, label)}
                style={{ padding: 10 }}
              >
                <IconSymbol
                  name="square.fill.on.square.fill"
                  size={28}
                  color={theme.lessImportantText}
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.copyAllButton, { backgroundColor: theme.primary }]}
            onPress={handleCopyAllDetails}
          >
            <Text style={styles.copyButtonText}>
              {copied ? "Copied!" : "Copy All"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/images/orthodox/OrnamentFromArmenianGospel.png")}
          style={[styles.bottomImage, { tintColor: theme.primary }]}
        />
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    header: {
      alignItems: "center",
      marginBottom: 30,
    },
    bibleVerse: {
      fontSize: 16,
      fontStyle: "italic",
      color: "grey",
      marginTop: 10,
      marginHorizontal: 26,
      textAlign: "center",
    },
    paymentSection: {
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
      shadowColor: "black",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    squareButton: {
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    squareButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    bankDetailsSection: {
      borderRadius: 10,
      padding: 20,
      marginBottom: 30,
      shadowColor: "black",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    bankDetails: {
      marginBottom: 15,
    },
    copyButton: {
      flexDirection: "row",
      paddingVertical: 5,
    },
    copyAllButton: {
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 20,
    },
    copyValueText: {
      fontSize: 18,
      fontWeight: "600",
      paddingHorizontal: 10,
    },
    copyButtonContainer: {
      flex: 1,
    },
    copyButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    bottomImage: {
      width: 100,
      height: 100,
      resizeMode: "contain",
      marginBottom: 50,
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 10,
      marginBottom: 10,
      justifyContent: "center",
    },
  });
