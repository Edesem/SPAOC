export const SQUARE_URL = "https://square.link/u/1x7oJTMQ";

export const BANK_NAME = "St Paul's Antiochian Orthodox Church";
export const ACCOUNT_NO = "904 887";
export const BSB = "033 000";

export type ParishLink = {
  label: string;
  url: string;
  icon: string;
  iconSet: "material" | "fontawesome";
};

// The parish's other places online, in the order the Parish screen shows them.
export const PARISH_LINKS: ParishLink[] = [
  {
    label: "Visit our Website",
    url: "https://stpaulchurch.org.au",
    icon: "public",
    iconSet: "material",
  },
  {
    label: "Church Store",
    url: "https://stpaulchurch.org.au/store",
    icon: "store",
    iconSet: "material",
  },
  {
    label: "Follow on Facebook",
    url: "https://www.facebook.com/StPaulsAntiochianOrthodoxChurch",
    icon: "facebook",
    iconSet: "material",
  },
  {
    label: "Follow on Instagram",
    url: "https://www.instagram.com/stpaulsdandenong/",
    icon: "instagram",
    iconSet: "fontawesome",
  },
  {
    label: "Subscribe on YouTube",
    url: "https://www.youtube.com/@stpaulsantiochianorthodoxc6010/videos",
    icon: "youtube",
    iconSet: "fontawesome",
  },
  {
    label: "Join our WhatsApp group",
    url: "https://chat.whatsapp.com/Lee9DcwOsBvKJhrCveH445",
    icon: "whatsapp",
    iconSet: "fontawesome",
  },
  {
    label: "Listen to our choir on Spotify",
    url: "https://open.spotify.com/artist/5KSBKd6aPBEeEDzncaLdT7",
    icon: "spotify",
    iconSet: "fontawesome",
  },
  {
    label: "Listen to our choir on Apple Music",
    url: "https://music.apple.com/us/artist/st-ephraim-the-syrian-antiochian-orthodox-choir/1785814045",
    icon: "itunes-note",
    iconSet: "fontawesome",
  },
];
