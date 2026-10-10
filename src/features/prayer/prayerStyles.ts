import { StyleSheet } from "react-native";
import { typography } from "@/theme/typography";

export const styles = StyleSheet.create({
  // Left-aligned, in line with the large header title above it.
  subtitle: {
    ...typography.subtitle,
    marginTop: 10,
    marginHorizontal: 20,
    textAlign: "left",
  },
  feastTitle: {
    ...typography.liturgicalTitle,
    marginTop: 4,
    marginHorizontal: 20,
    textAlign: "left",
  },
  // Lines up with the row cards' 16pt inset, as on Home.
  sectionBreak: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  // Lines up with the large header title, like Home's section headings.
  sectionHeading: {
    ...typography.sectionHeading,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
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
    ...typography.body,
    textAlign: "center",
  },
  errorBlock: {
    alignItems: "center",
  },
  retryButton: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 24,
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 12,
  },
  retryText: {
    ...typography.button,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  noTextsMessage: {
    ...typography.aside,
    textAlign: "center",
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
    ...typography.sectionHeading,
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: "left",
  },
});
