import { EventItem } from "../components/EventItem"; // <-- Import your component
import { ThemedText } from "@/components/ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { useFavouritesStore } from "../favourites";
import { ItemProps } from "../types"; // <-- adjust import if needed
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState<ItemProps["item"][]>([]);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const styles = getStyles();

  const loadFavourites = async () => {
    try {
      // Drops expired favourites from storage and returns the upcoming ones
      setFavourites(await useFavouritesStore.getState().removeExpired());
    } catch (e) {
      console.error("Failed to load favourites", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavourites();
    }, []),
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={CommonStyles.container}>
        <ScrollView>
          <View style={styles.header}>
            <ThemedText type="title" style={CommonStyles.title}>
              Favourites
            </ThemedText>
            <Text style={[styles.subtitle, { color: theme.detail }]}>
              Saved upcoming events will appear here for quick viewing.
            </Text>
          </View>

          {favourites.length === 0 ? (
            <Text style={{
                textAlign: "center",
                color: theme.detail,
                marginTop: 20,
              }}>
              No favourites yet.
            </Text>
          ) : (
            favourites.map((item, index) => (
              <EventItem
                key={item.id ?? `${item.title}-${index}`}
                item={item}
                onPress={() => {}}
                onUnfavourite={() => {
                  setFavourites((prev) =>
                    prev.filter(
                      (f) => (f.id ?? f.title) !== (item.id ?? item.title),
                    ),
                  );
                }}
                showFullDate={true}
              />
            ))
          )}

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require("@assets/images/orthodox/Seraph.png")} // Adjust the path to your image
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStyles = () =>
  StyleSheet.create({
    header: {
      alignItems: "center",
      marginBottom: 30,
    },
    subtitle: {
      fontSize: 18,
      fontStyle: "italic",
      marginTop: 10,
      marginHorizontal: 26,
      textAlign: "center",
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 40, // Adjust the space above the image
      marginBottom: 10, // Adjust the space below the image if needed
      flex: 1, // Allows image container to take remaining space
      justifyContent: "center", // Aligns the image in the middle
    },
    bottomImage: {
      width: 150, // Adjust the width of the image
      height: 150, // Adjust the height of the image
      resizeMode: "contain", // Ensure the image doesn't get stretched
      marginBottom: 50,
    },
  });
