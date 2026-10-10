import { IconSymbol } from "@/components/ui/IconSymbol";
import { Haptic } from "@/lib/haptics";
import { typography } from "@/theme/typography";
import { setStringAsync } from "expo-clipboard";
import { useCallback, useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { ACCOUNT_NO, BANK_NAME, BSB, SQUARE_URL } from "../constants";
import { useFocusEffect } from "expo-router";

export default function DonateSection({ theme, CommonStyles }: any) {
  const [copied, setCopied] = useState(false); // Track if the details are copied

  const styles = getStyles();

  const handleCopyDetails = async (textToCopy: string, label: string) => {
    Haptic.press();
    await setStringAsync(textToCopy);

    const message = `${label} copied`;

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
    }, []),
  );

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[CommonStyles.title, styles.heading]}>Giving</Text>
        <Text style={[styles.bibleVerse, { color: theme.detail }]}>
          &quot;For where your treasure is, there your heart will be also.&quot;
          - Matthew 6:21
        </Text>
      </View>

      {/* Square Payment Section */}
      <View
        testID="square-card"
        style={[styles.card, { backgroundColor: theme.itemBackground }]}
      >
        <Text style={CommonStyles.sectionTitle}>Support Us Online</Text>
        <TouchableOpacity
          style={[styles.pill, { backgroundColor: theme.donateButton }]}
          onPress={handleSquarePayment}
          accessibilityRole="link"
        >
          <Text style={[styles.squareButtonText, { color: theme.onDonate }]}>
            Donate via Square
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bank Details Section */}
      <View
        testID="bank-card"
        style={[styles.card, { backgroundColor: theme.itemBackground }]}
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
                accessibilityRole="button"
                accessibilityLabel={`Copy ${label}`}
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
            style={[
              styles.pill,
              styles.copyAllButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleCopyAllDetails}
            accessibilityRole="button"
          >
            <Text style={[styles.copyButtonText, { color: theme.onPrimary }]}>
              {copied ? "Copied!" : "Copy All"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    header: {
      marginBottom: 16,
    },
    // Lines up with the large header title, like the other section headings.
    heading: {
      ...typography.sectionHeading,
      marginHorizontal: 20,
      marginTop: 10,
      marginBottom: 8,
      textAlign: "left",
    },
    bibleVerse: {
      ...typography.subtitle,
      marginHorizontal: 20,
      textAlign: "left",
    },
    // The card is the row cards': 16pt in from the edge, 8pt corners, a soft shadow.
    card: {
      borderRadius: 8,
      padding: 20,
      marginVertical: 6,
      marginHorizontal: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    // A 48pt pill, like the retry button on Prayer.
    pill: {
      minHeight: 48,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 24,
      paddingHorizontal: 24,
    },
    squareButtonText: {
      ...typography.button,
    },
    bankDetails: {
      marginBottom: 15,
    },
    copyButton: {
      flexDirection: "row",
      paddingVertical: 5,
    },
    copyAllButton: {
      marginTop: 20,
    },
    copyValueText: {
      ...typography.button,
      fontSize: typography.title.fontSize,
      paddingHorizontal: 10,
    },
    copyButtonContainer: {
      flex: 1,
    },
    copyButtonText: {
      ...typography.button,
    },
  });
