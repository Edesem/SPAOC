import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Linking,
    useColorScheme,
    Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles';
import { Colours } from '@/styles/Colours';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import DonateSection from '@/components/DonateSection';

export default function HelpScreen() {
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;
    const CommonStyles = getCommonStyles(scheme);

    const appVersion = Constants.expoConfig?.version ?? 'Unknown';

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    };

    const allLocales = Localization.getLocales().map(loc => loc.languageTag).join(', ');

    const openMail = (type: 'Bug' | 'Suggestion' | 'Support', email = "robertlzoltan@gmail.com") => {
        const version = Constants.expoConfig?.version ?? 'unknown';
        const build = Constants.expoConfig?.ios?.buildNumber ?? 'N/A';
        const device = Constants.deviceName ?? 'unknown';
        const locale = Localization.getLocales()[0]?.languageTag ?? 'unknown';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        let message = "";
        switch (type) {
            case 'Bug':
                message = 'Please describe the issue you encountered below:';
            case 'Suggestion':
                message = 'Thank you for using SPAOC! We’d love to hear your idea or improvement suggestion:';
            case 'Support':
                message = 'Let us know how we can help:';
            default:
                message = 'Please write your message below:';
        }

        const subject = encodeURIComponent(`[${type}] (INSERT TITLE)`);
        const body = encodeURIComponent(
            `${message}\n\n` +
            `--- Do not DELETE below ---\nApp Version: ${version}\nPlatform: ${Platform.OS} ${Platform.Version}\n` +
            `Device: ${device}\nBuild: ${build}\nTimezone: ${timezone}\nLocale: ${locale}`
        );

        const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

        Linking.openURL(mailtoUrl).catch(err =>
            console.error("Failed to open email:", err)
        );
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={CommonStyles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText type="title" style={CommonStyles.title}>
                            Help & Support
                        </ThemedText>
                        <Text style={[styles.subtitle, { color: theme.detail }]}>
                            Need help using the app? Explore the options below or reach out for support.
                        </Text>
                    </View>

                    {/* Help Links */}
                    <View style={styles.section}>
                        <LinkItem
                            icon="info"
                            label="How to use the app"
                            onPress={() => openLink('https://yourchurchwebsite.com/help')}
                            color={theme.primary}
                        />
                        <LinkItem
                            icon="bug-report"
                            label="Report a bug"
                            onPress={() => openMail("Bug")}
                            color={theme.primary}
                        />
                        <LinkItem
                            icon="lightbulb"
                            label="Suggest a feature"
                            onPress={() => openMail("Suggestion")}
                            color={theme.primary}
                        />
                        <LinkItem
                            icon="email"
                            label="Contact Support"
                            onPress={() => openMail("Support")}
                            color={theme.primary}
                        />
                    </View>

                    {/* App Info */}
                    <View style={styles.section}>
                        <Text style={[styles.versionText, { color: theme.detail }]}>
                            App Version: {appVersion}
                        </Text>
                    </View>

                    <DonateSection theme={theme} CommonStyles={CommonStyles} />

                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

function LinkItem({
    icon,
    label,
    onPress,
    color,
}: {
    icon: string;
    label: string;
    onPress: () => void;
    color: string;
}) {
    return (
        <TouchableOpacity style={styles.linkItem} onPress={onPress}>
            <MaterialIcons name={icon as any} size={24} color={color} />
            <Text style={[styles.linkLabel, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 20,
        gap: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        fontStyle: 'italic',
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        gap: 16,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    linkLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    versionText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 60,
    },
});
