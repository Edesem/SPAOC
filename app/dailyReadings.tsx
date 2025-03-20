import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import he from 'he';
import toTitleCase from 'titlecase';
import { Colours } from '@/styles/Colours';
import { useNavigation } from '@react-navigation/native';

// Define the expected route params type
type ReadingScreenRouteParams = {
    type: 'epistle' | 'gospel';
    reading: string;
    title: string;
};

export default function ReadingScreen() {
    const route = useRoute<RouteProp<Record<string, ReadingScreenRouteParams>, string>>();
    const { params } = route;
    const { reading, title } = params;
    const navigation = useNavigation();

    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? Colours.dark : Colours.light;

  useEffect(() => {
    navigation.setOptions({
      title: 'Daily Readings',
      headerBackTitle: 'Back',
      headerBackTitleStyle: {
        color: 'pink', // Set the color of the back button title (if any)
      },
    });
  }, [navigation, title]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.title, { color: colors.moreImportantText }]}>
                    {toTitleCase(title.toLowerCase())}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.detail }]} />
                <Text style={[styles.text, { color: colors.moreImportantText }]}>{he.decode(reading)}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10, // Small top padding to avoid text sticking to the top
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    divider: {
        height: 2,
        marginVertical: 10,
        width: '80%',
        alignSelf: 'center',
    },
    text: {
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'justify',
    },
});
