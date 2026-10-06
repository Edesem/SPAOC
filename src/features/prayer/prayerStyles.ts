import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  header: {
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 10,
    marginHorizontal: 26,
    textAlign: "center",
  },
  contentSection: {
    borderRadius: 10,
    padding: 20,
    margin: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    height: 150,
  },
  errorText: {
    textAlign: "center",
  },
  errorBlock: {
    alignItems: "center",
  },
  retryButton: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // A 48pt row, so a tap on a service title is easy to land.
  serviceRow: {
    minHeight: 48,
    justifyContent: "center",
  },
  serviceContainer: {
    marginBottom: 10,
  },
  prayerTitle: {
    fontSize: 18,
  },
  prayerSubtitle: {
    fontSize: 14,
    fontStyle: "italic",
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  rowContainer: {
    borderRadius: 10,
    padding: 2,
    margin: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    flexDirection: "row", // Align items horizontally
  },
  textContainer: {
    flex: 1,
  },
  noTextsMessage: {
    textAlign: "center",
    fontSize: 16,
    fontStyle: "italic",
    marginVertical: 10,
  },
  bottomImage: {
    width: 150, // Adjust the width of the image
    height: 150, // Adjust the height of the image
    resizeMode: "contain", // Ensure the image doesn't get stretched
    marginBottom: 50,
  },
  imageContainer: {
    alignItems: "center",
    marginTop: 10, // Adjust the space above the image
    marginBottom: 10, // Adjust the space below the image if needed
    flex: 1, // Allows image container to take remaining space
    justifyContent: "center", // Aligns the image in the middle
  },
  chevronIcon: {
    marginTop: 8, // Space between text and chevron
  },
  dateTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    paddingLeft: 65,
  },
  icon: {
    fontSize: 36,
    marginRight: 10, // Adjust this value to your preference for spacing
  },
});
