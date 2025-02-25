import { ItemProps } from "@/global";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, StyleSheet, Text, useColorScheme } from "react-native";
import * as Haptics from 'expo-haptics';
import Icon from "react-native-vector-icons/Ionicons";
import { Colours } from "@/styles/Colours";

export const EventItem = ({ item, onPress }: ItemProps) => {
    const router = useRouter();
    const colorScheme = useColorScheme();  // Get the current theme (light or dark)

    const isAllDayEvent = item.start && !item.start.includes('T');
    const eventStart = new Date(item.start);
    const eventEnd = new Date(item.end);

    const formattedStart = isAllDayEvent
        ? 'All day'
        : eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formattedEnd = isAllDayEvent
        ? ''
        : `to ${eventEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Set dynamic colors based on the current theme
    const backgroundColor = colorScheme === 'dark' ? Colours.dark.itemBackground : Colours.light.itemBackground;
    const textColor = colorScheme === 'dark' ? '#FFF' : '#333';
    const timeColor = colorScheme === 'dark' ? '#BBB' : '#777';
    const chevronColor = colorScheme === 'dark' ? Colours.dark.chevronColor : Colours.light.chevronColor;

    const eventColorMap = new Map<string, string>([
        ['youth', Colours.event.youth],
        ['weekly', Colours.event.weekly],
        ['church', Colours.event.church],
        ['family', Colours.event.family],
        ['ladies', Colours.event.ladies],
        ['parish', Colours.event.parish],
        ['seniors', Colours.event.seniors],
        ['playgroup', Colours.event.playgroup],
        ['fellowship', Colours.event.fellowship],
    ]);
    
    
    const getEventColor = (source: string) => eventColorMap.get(source) || '#000'; // Default to black if not found

    const sourceColor = getEventColor(item.source) || Colours.light.secondary;

    return (
        <TouchableOpacity
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                router.push({
                    pathname: '/eventDetails',
                    params: { ...item, start: formattedStart, end: formattedEnd },
                });
                onPress();
            }}
            style={[styles.item, { backgroundColor }]}>
            <View style={styles.leftBarContainer}>
                <View style={[styles.leftBar, { backgroundColor: sourceColor }]} />
                <View style={styles.itemContent}>
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemTime, { color: timeColor }]}>{formattedStart} {formattedEnd}</Text>
                        <Text style={[styles.itemTitle, { color: textColor }]}>{item.title}</Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color={chevronColor} style={styles.chevronIcon} />
                </View>
            </View>

        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    item: {
        padding: 20,
        marginVertical: 2,
        marginHorizontal: 16,
        borderRadius: 8,
        elevation: 2, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        flexDirection: 'row', // Align content horizontally
        alignItems: 'center', // Center items vertically
        justifyContent: 'space-between', // Space between title and chevron
    },
    leftBar: {
        width: 8, // Thickness of the bar
        borderTopLeftRadius: 8, // Match the item border radius
        borderBottomRightRadius: 8,
        borderTopRightRadius: 1, // Match the item border radius
        borderBottomLeftRadius: 1,
        marginRight: 10,
    },
    leftBarContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    itemContent: {
        flexDirection: 'row', // Ensure content inside item aligns horizontally
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1, // Ensure content takes up remaining space
    },
    textContainer: {
        flex: 1, // Ensures the text occupies the remaining space
    },
    itemTime: {
        fontSize: 14,
        marginBottom: 2, // Space between time and title
    },
    itemTitle: {
        fontSize: 18,
    },
    chevronIcon: {
        marginLeft: 8, // Space between text and chevron
    },
});
