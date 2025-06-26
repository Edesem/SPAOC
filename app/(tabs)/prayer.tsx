import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Image, useColorScheme, ActivityIndicator, ScrollView, Linking, TouchableOpacity, RefreshControl, Alert, AppState, PressableStateCallbackType } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles';
import { Colours } from '@/styles/Colours';
import { fetchAntiochian, getFeastTitle, getReadingTeasers, getReadingTexts } from '@/api/AntiochianApi';
import { GREAT_VESPERS_URL, SMALL_COMPLINE_URL, SMALL_COMPLINE_PRIEST_URL, PARAKLESIS_URL, MATINS_BILINGUAL_URL, MATINS_URL, MORNING_PRAYERS_URL, PREPARATION_FOR_COMMUNION_URL, CENSING_HOME_URL, GREAT_COMPLINE_URL, PRESANCTIFIED_LITURGY_URL, AKATHIST_URL } from '@/constants/consts';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPersonPraying } from '@fortawesome/free-solid-svg-icons/faPersonPraying'
import { faCloudMoon } from '@fortawesome/free-solid-svg-icons/faCloudMoon'
import { faBed } from '@fortawesome/free-solid-svg-icons/faBed'
import { faChurch } from '@fortawesome/free-solid-svg-icons/faChurch'
import { faCloudSun } from '@fortawesome/free-solid-svg-icons/faCloudSun'
import { faCoffee } from '@fortawesome/free-solid-svg-icons/faCoffee'
import { faWineGlass } from '@fortawesome/free-solid-svg-icons/faWineGlass'
import { faBurn } from '@fortawesome/free-solid-svg-icons/faBurn'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons/faBookOpen'
import { faMoon } from '@fortawesome/free-solid-svg-icons/faMoon'
import { faHandsPraying } from '@fortawesome/free-solid-svg-icons/faHandsPraying'
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar'
import he from 'he';
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRouter } from 'expo-router';
import toTitleCase from 'titlecase';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from 'react-native-screens/lib/typescript/native-stack/types';

interface LiturgicalData {
  publicUrl: string;
  typeOfService: string;
}

interface OrganizedData {
  [service: string]: {
    pdf: string | null;
  };
}

const prayers = [
  { title: 'Morning Prayers', subtitle: 'A short prayer to start the day', url: MORNING_PRAYERS_URL, icon: faCoffee },
  { title: 'Small Compline', subtitle: 'A prayer before sleep & Communion', url: SMALL_COMPLINE_URL, icon: faBed },
  { title: 'Holy Communion', subtitle: 'Preparation & Thanksgiving', url: PREPARATION_FOR_COMMUNION_URL, icon: faWineGlass },
  { title: 'Censing the Home', subtitle: 'A prayer when you cense your home', url: CENSING_HOME_URL, icon: faBurn },
];

const services = [
  { title: 'Great Vespers', subtitle: 'An evening sacrifice', url: GREAT_VESPERS_URL, icon: faCloudMoon },
  { title: 'Small Compline', subtitle: 'When a Priest is serving', url: SMALL_COMPLINE_PRIEST_URL, icon: faChurch },
  { title: 'Paraklesis', subtitle: 'To the Theotokos, the Mother of Light', url: PARAKLESIS_URL, icon: faPersonPraying },
  { title: 'Matins', subtitle: 'Morning Offering', url: MATINS_URL, icon: faCloudSun },
  { title: 'Matins - Bilingual', subtitle: 'English and Arabic Matins', url: MATINS_BILINGUAL_URL, icon: faBookOpen },
];

const lentenServices = [
  { title: 'Great Compline', subtitle: 'A solemn Lenten evening prayer', url: GREAT_COMPLINE_URL, icon: faMoon },
  { title: 'Presanctified Liturgy', subtitle: 'A Lenten Eucharistic service', url: PRESANCTIFIED_LITURGY_URL, icon: faHandsPraying },
  { title: 'Akathist', subtitle: 'A standing hymn of praise, to the Theotokos', url: AKATHIST_URL, icon: faStar },
];

export default function PrayerScreen(): JSX.Element {
  const appState = useRef(AppState.currentState);
  const lastRefreshTime = useRef<number>(Date.now());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const now = Date.now();
        const minutesSinceLastRefresh = (now - lastRefreshTime.current) / (1000 * 60);

        if (minutesSinceLastRefresh > 300) {  // 👈 5 hour threshold
          onRefresh();
          lastRefreshTime.current = now;
        }
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const [data, setData] = useState<LiturgicalData[] | null>(null);
  const [readings, setReadings] = useState<{
    date?: string;
    reading1Title?: string;
    reading1Teaser?: string;
    reading2Title?: string;
    reading2Teaser?: string;
    reading3Title?: string;
    reading3Teaser?: string;
  }>({});
  const [readingsText, setReadingsText] = useState<{ reading1FullText?: string, reading2FullText?: string, reading3FullText?: string }>({});
  const [feastTitle, setFeastTitle] = useState<{ feastTitle?: string }>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const chevronColor = colorScheme === 'dark' ? Colours.dark.chevronColor : Colours.light.chevronColor;

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  type RootStackParamList = {
    Home: undefined;
    pdfViewer: { url: string };
    // add other screens here if needed
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = async (date: Date) => {
    hideDatePicker();
    setSelectedDate(date);
    setLoading(true);

    try {
      const { day, texts } = await fetchAntiochian(date);

      if (day) {
        setReadings(getReadingTeasers(day));
        setReadingsText(getReadingTexts(day));
        setFeastTitle(getFeastTitle(day));
      } else {
        setReadings({});
        setReadingsText({});
        setFeastTitle({});
      }

      if (texts) {
        setData(texts);
      } else {
        setData(null)
      }
    } catch (err) {
      setError(err as Error);
      setReadings({});
      setReadingsText({});
      setFeastTitle({});
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true); // Set refreshing to true
    try {
      const { day, texts } = await fetchAntiochian();
      if (day) {
        setReadings(getReadingTeasers(day));
        setReadingsText(getReadingTexts(day));
        setFeastTitle(getFeastTitle(day));
      } else {
        setReadings({});
        setReadingsText({});
        setFeastTitle({});
      }

      if (texts) {
        setData(texts);
      } else {
        setData(null)
      }
    } catch (err) {
      setError(err as Error);
      setReadings({});
      setReadingsText({});
      setFeastTitle({});
    }
    setRefreshing(false); // Set refreshing to false once done
  };

  // Use useEffect for the initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        const { day, texts } = await fetchAntiochian();
        if (day) {
          setReadings(getReadingTeasers(day));
          setReadingsText(getReadingTexts(day));
          setFeastTitle(getFeastTitle(day));
        } else {
          setReadings({});
          setReadingsText({});
          setFeastTitle({});
        }

        if (texts) {
          setData(texts);
        } else {
          setData(null)
        }

      } catch (err) {
        setError(err as Error);
        setReadings({});
        setReadingsText({});
        setFeastTitle({});
      } finally {
        setLoading(false); // Set loading to false when initial data fetch is done
      }
    }

    loadData();
  }, []); // Empty dependency array to run only once when component mounts


  const organizeData = (data: LiturgicalData[]): OrganizedData => {
    return data.reduce((acc, { publicUrl, typeOfService }) => {
      if (!publicUrl) return acc;
      if (typeOfService.includes('PDF')) {
        if (!acc[typeOfService]) acc[typeOfService] = { pdf: null };
        acc[typeOfService].pdf = publicUrl;
      }
      return acc;
    }, {} as OrganizedData);
  };

  useEffect(() => {
    if (data) {
      setOrganizedData(organizeData(data));
      console.log('organizedData keys:', Object.keys(organizedData), organizedData);

    }
  }, [data]);

  const [organizedData, setOrganizedData] = useState<OrganizedData>({});


  return (
    <SafeAreaProvider>
      <SafeAreaView style={[CommonStyles.container, { flex: 1 }]}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}

          <View style={styles.header}>
            <ThemedText type="title" style={CommonStyles.title}>
              Prayer
            </ThemedText>
          </View>

          <View style={[styles.headerRow, { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtitle}>
                "Pray without ceasing."{'\n'}- 1 Thessalonians 5:17
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                  showDatePicker()
              }}
              style={{
                padding: 5,
                shadowColor: 'black',
              }}
            >
              <IconSymbol name="calendar" size={36} color={theme.lessImportantText} />
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              date={selectedDate}
            />
          </View>

          {/* Date Title */}
          <View style={{ alignItems: 'center', marginVertical: 0 }}>
            <Text style={[styles.dateTitle, { color: theme.moreImportantText }]}>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>

            {feastTitle.feastTitle && (
              <Text style={[styles.subtitle, { marginTop: 5, color: theme.lessImportantText }]}>
                {toTitleCase(feastTitle.feastTitle.toLowerCase())}
              </Text>
            )}
          </View>

          {/* Readings Section */}
          {loading ? (
            <View style={[styles.contentSection, { flex: 1, margin: 20, backgroundColor: theme.itemBackground, height: 250 }]}>
              <Text style={CommonStyles.sectionTitle}>
                Loading Readings...
              </Text>
              <View style={styles.divider} />
              <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={[{ color: theme.moreImportantText }, { paddingBottom: 20 }, { fontSize: 17 }]}>
                  Loading readings...
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Epistle Navigation */}
              {readings.reading1Title && readingsText.reading1FullText && (
                <TouchableOpacity
                  style={[styles.contentSection, { flex: 1, margin: 20, backgroundColor: theme.itemBackground }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                      router.push({
                        pathname: '/dailyReadings',
                        params: {
                          type: 'epistle',
                          reading: readingsText.reading1FullText,
                          title: readings.reading1Title // Added title
                        }
                      })
                  }
                  }
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={CommonStyles.sectionTitle}>
                      {readings.reading1Title ? toTitleCase(readings.reading1Title.toLowerCase()) : "Loading..."}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={chevronColor} style={styles.chevronIcon} />
                  </View>
                  {!readings.reading3Title ? (
                    <View style={[styles.divider, { backgroundColor: '#2E86AB', }, { height: 3 }]} />
                  ) : (
                    <View style={styles.divider} />
                  )}
                  < Text style={[{ color: theme.moreImportantText }, { paddingBottom: 20 }, { fontSize: 17 }]}>
                    {he.decode(readings.reading1Teaser || '')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Gospel Navigation */}
              {readings.reading2Title && readingsText.reading2FullText && (
                <TouchableOpacity
                  style={[styles.contentSection, { flex: 1, margin: 20, backgroundColor: theme.itemBackground }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                      router.push({
                        pathname: '/dailyReadings',
                        params: {
                          type: 'gospel',
                          reading: readingsText.reading2FullText,
                          title: readings.reading2Title // Added title
                        }
                      })
                  }
                  }
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={CommonStyles.sectionTitle}>
                      {readings.reading2Title ? toTitleCase(readings.reading2Title.toLowerCase()) : "Loading..."}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={chevronColor} style={styles.chevronIcon} />
                  </View>
                  {!readings.reading3Title ? (
                    <View style={[styles.divider, { backgroundColor: '#D4AF37', }, { height: 3 }]} />
                  ) : (
                    <View style={styles.divider} />
                  )}
                  <Text style={[{ color: theme.moreImportantText }, { paddingBottom: 20 }, { fontSize: 17 }]}>
                    {he.decode(readings.reading2Teaser || '')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Third Reading Navigation */}
              {readings.reading3Title && readingsText.reading3FullText && (
                <TouchableOpacity
                  style={[styles.contentSection, { flex: 1, margin: 20, backgroundColor: theme.itemBackground }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                      router.push({
                        pathname: '/dailyReadings',
                        params: {
                          type: 'thirdReading',
                          reading: readingsText.reading3FullText,  // Add full text for third reading
                          title: readings.reading3Title  // Add title for third reading
                        }
                      })
                  }
                  }
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={CommonStyles.sectionTitle}>
                      {readings.reading3Title ? toTitleCase(readings.reading3Title.toLowerCase()) : "Loading..."}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={chevronColor} style={styles.chevronIcon} />
                  </View>
                  <View style={styles.divider} />
                  <Text style={[{ color: theme.moreImportantText }, { paddingBottom: 20 }, { fontSize: 17 }]}>
                    {he.decode(readings.reading3Teaser || '')}
                  </Text>
                </TouchableOpacity>
              )}

            </>
          )}

          {/* Daily Liturgical Texts Section */}
          <View style={[styles.contentSection, { backgroundColor: theme.itemBackground }]}>
            <Text style={CommonStyles.sectionTitle}>Daily Variables</Text>
            <View style={styles.divider} />

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={[{ color: theme.moreImportantText }, { paddingBottom: 20 }, { fontSize: 17 }]}>
                  Loading prayers...
                </Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>Error loading prayers</Text>
            ) : Object.keys(organizedData).length === 0 ? (
              <Text style={styles.noTextsMessage}>There are no liturgical texts today.</Text>
            ) : (
              <View>
                {Object.keys(organizedData).map((service) => (
                  <TouchableOpacity
                    key={service}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                        Alert.alert(
                          "Silence Your Phone!",
                          "Before opening this prayer, please ensure your phone is on silent.",
                          [
                            {
                              text: "OK",
                              onPress: () => {
                                router.push({
                                  pathname: '/pdfViewer',
                                  params: {
                                    url: organizedData[service].pdf!,  // Add full text for third reading
                                    title: service.replace(/\s*\(PDF\)$/, "")  // Add title for third reading
                                  }
                                })
                              },
                            }
                          ]
                        );
                    }}
                    style={({ pressed }: PressableStateCallbackType) => [
                      styles.linkText,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={[{ color: theme.moreImportantText }, { paddingBottom: 20 }, { fontSize: 17 }]}>
                      {service.replace(/\s*\(PDF\)$/, "")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

            )}
          </View>

          {/* Additional Prayers Section */}
          <View style={[styles.contentSection, { backgroundColor: theme.itemBackground }]}>
            <Text style={CommonStyles.sectionTitle}>Prayers</Text>
            <View style={styles.divider} />

            {prayers.map((prayer) => (
              <TouchableOpacity
                key={prayer.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                    router.push({
                      pathname: '/pdfViewer',
                      params: {
                        url: prayer.url,  // Add full text for third reading
                        title: prayer.title  // Add title for third reading
                      }
                    })
                }}
                style={({ pressed }) => [
                  styles.prayerItem,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={[styles.rowContainer]}>
                  <FontAwesomeIcon icon={prayer.icon} size={35} color={theme.moreImportantText} style={styles.icon} />
                  <View style={styles.textContainer}>
                    <Text style={[styles.prayerTitle, { color: theme.moreImportantText, }]}>{prayer.title}</Text>
                    <Text style={[styles.prayerSubtitle, { color: theme.lessImportantText, }]}>{prayer.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

          </View>

          {/* Additional Services Section */}
          <View style={[styles.contentSection, { backgroundColor: theme.itemBackground }]}>
            <Text style={CommonStyles.sectionTitle}>Services</Text>
            <View style={styles.divider} />

            {services.map((service) => (
              <TouchableOpacity
                key={service.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                    Alert.alert(
                      "Silence Your Phone!",
                      "Before opening this prayer, please ensure your phone is on silent.",
                      [
                        {
                          text: "OK", onPress: () => {
                            router.push({
                              pathname: '/pdfViewer',
                              params: {
                                url: service.url,  // Add full text for third reading
                                title: service.title  // Add title for third reading
                              }
                            })
                          }
                        }
                      ]
                    );
                }}
                style={({ pressed }) => [
                  styles.prayerItem,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={[styles.rowContainer]}>
                  {/* Render the specific icon for each service */}
                  <FontAwesomeIcon icon={service.icon} size={35} color={theme.moreImportantText} style={styles.icon} />
                  <View style={styles.textContainer}>
                    <Text style={[styles.prayerTitle, { color: theme.moreImportantText, }]}>{service.title}</Text>
                    <Text style={[styles.prayerSubtitle, { color: theme.lessImportantText, }]}>{service.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lenten Services Section */}
          <View style={[styles.contentSection, { backgroundColor: theme.itemBackground }]}>
            <Text style={CommonStyles.sectionTitle}>Lenten Services</Text>
            <View style={styles.divider} />

            {lentenServices.map((service) => (
              <TouchableOpacity
                key={service.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                    Alert.alert(
                      "Silence Your Phone!",
                      "Before opening this prayer, please ensure your phone is on silent.",
                      [
                        {
                          text: "OK", onPress: () => {
                            router.push({
                              pathname: '/pdfViewer',
                              params: {
                                url: service.url,  // Add full text for third reading
                                title: service.title  // Add title for third reading
                              }
                            })
                          }
                        }
                      ]
                    );
                }}
                style={({ pressed }) => [
                  styles.prayerItem,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={[styles.rowContainer]}>
                  {/* Render the specific icon for each service */}
                  <FontAwesomeIcon icon={service.icon} size={35} color={theme.moreImportantText} style={styles.icon} />
                  <View style={styles.textContainer}>
                    <Text style={[styles.prayerTitle, { color: theme.moreImportantText, }]}>{service.title}</Text>
                    <Text style={[styles.prayerSubtitle, { color: theme.lessImportantText, }]}>{service.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/orthodox/star3.png')} // Adjust the path to your image
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider >
  );
}



const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'grey',
    marginTop: 10,
    marginHorizontal: 26,
    textAlign: 'center',
  },
  contentSection: {
    borderRadius: 10,
    padding: 20,
    margin: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    height: 150,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  serviceContainer: {
    marginBottom: 10,
  },
  linkText: {
    color: 'blue',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  prayerItem: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light background for contrast
  },
  prayerTitle: {
    fontSize: 18,
  },
  prayerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  rowContainer: {
    borderRadius: 10,
    padding: 2,
    margin: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    flexDirection: 'row', // Align items horizontally
  },
  icon: {
    marginRight: 10, // Adjust this value to your preference for spacing
  },
  textContainer: {
    flex: 1,
  },
  noTextsMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  bottomImage: {
    width: 150, // Adjust the width of the image
    height: 150, // Adjust the height of the image
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
  chevronIcon: {
    marginTop: 8, // Space between text and chevron
  },
  dateTitle: {
    fontSize: 27,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingLeft: 65,
  },
});

