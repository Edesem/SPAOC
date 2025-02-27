import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import he from 'he';
import toTitleCase from 'titlecase';

// Define the expected route params type
type ReadingScreenRouteParams = {
    type: 'epistle' | 'gospel';
    reading: string;
};

export default function ReadingScreen() {
    const route = useRoute<RouteProp<Record<string, ReadingScreenRouteParams>, string>>();
    const { params } = route;
    console.log(params)

    const { reading, title } = params;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>{toTitleCase(title.toLowerCase())}</Text>
                <Text style={styles.text}>{he.decode(reading)}</Text>
        </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    text: {
        fontSize: 16,
        marginBottom: 20,
    },
});
