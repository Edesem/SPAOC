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
    title: string;
};

export default function ReadingScreen() {
    const route = useRoute<RouteProp<Record<string, ReadingScreenRouteParams>, string>>();
    const { params } = route;
    
    const { reading, title } = params;

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>{toTitleCase(title.toLowerCase())}</Text>
                <View style={styles.divider} />
                <Text style={styles.text}>{he.decode(reading)}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
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
        color: '#333',
    },
    divider: {
        height: 2,
        backgroundColor: '#C0C0C0',
        marginVertical: 10,
        width: '80%',
        alignSelf: 'center',
    },
    text: {
        fontSize: 18,
        lineHeight: 26,
        color: '#444',
        textAlign: 'justify',
    },
});
