import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faBed } from "@fortawesome/free-solid-svg-icons/faBed";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons/faBookOpen";
import { faBurn } from "@fortawesome/free-solid-svg-icons/faBurn";
import { faChurch } from "@fortawesome/free-solid-svg-icons/faChurch";
import { faCloudMoon } from "@fortawesome/free-solid-svg-icons/faCloudMoon";
import { faCloudSun } from "@fortawesome/free-solid-svg-icons/faCloudSun";
import { faCoffee } from "@fortawesome/free-solid-svg-icons/faCoffee";
import { faHandsPraying } from "@fortawesome/free-solid-svg-icons/faHandsPraying";
import { faMoon } from "@fortawesome/free-solid-svg-icons/faMoon";
import { faPersonPraying } from "@fortawesome/free-solid-svg-icons/faPersonPraying";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faWineGlass } from "@fortawesome/free-solid-svg-icons/faWineGlass";
import {
  AKATHIST_URL,
  CENSING_HOME_URL,
  GREAT_COMPLINE_URL,
  GREAT_VESPERS_URL,
  MATINS_BILINGUAL_URL,
  MATINS_URL,
  MORNING_PRAYERS_URL,
  PARAKLESIS_URL,
  PREPARATION_FOR_COMMUNION_URL,
  PRESANCTIFIED_LITURGY_URL,
  SMALL_COMPLINE_PRIEST_URL,
  SMALL_COMPLINE_URL,
} from "./constants";

// The fixed lists on the Prayer screen: a PDF to open, with its row text.
export type PdfEntry = {
  title: string;
  subtitle: string;
  url: string;
  icon: IconDefinition;
};

export const prayers = [
  {
    title: "Morning Prayers",
    subtitle: "A short prayer to start the day",
    url: MORNING_PRAYERS_URL,
    icon: faCoffee,
  },
  {
    title: "Small Compline",
    subtitle: "A prayer before sleep & Communion",
    url: SMALL_COMPLINE_URL,
    icon: faBed,
  },
  {
    title: "Holy Communion",
    subtitle: "Preparation & Thanksgiving",
    url: PREPARATION_FOR_COMMUNION_URL,
    icon: faWineGlass,
  },
  {
    title: "Censing the Home",
    subtitle: "A prayer when you cense your home",
    url: CENSING_HOME_URL,
    icon: faBurn,
  },
];

export const services = [
  {
    title: "Great Vespers",
    subtitle: "An evening sacrifice",
    url: GREAT_VESPERS_URL,
    icon: faCloudMoon,
  },
  {
    title: "Small Compline",
    subtitle: "When a Priest is serving",
    url: SMALL_COMPLINE_PRIEST_URL,
    icon: faChurch,
  },
  {
    title: "Paraklesis",
    subtitle: "To the Theotokos, the Mother of Light",
    url: PARAKLESIS_URL,
    icon: faPersonPraying,
  },
  {
    title: "Matins",
    subtitle: "Morning Offering",
    url: MATINS_URL,
    icon: faCloudSun,
  },
  {
    title: "Matins - Bilingual",
    subtitle: "English and Arabic Matins",
    url: MATINS_BILINGUAL_URL,
    icon: faBookOpen,
  },
];

export const lentenServices = [
  {
    title: "Great Compline",
    subtitle: "A solemn Lenten evening prayer",
    url: GREAT_COMPLINE_URL,
    icon: faMoon,
  },
  {
    title: "Presanctified Liturgy",
    subtitle: "A Lenten Eucharistic service",
    url: PRESANCTIFIED_LITURGY_URL,
    icon: faHandsPraying,
  },
  {
    title: "Akathist",
    subtitle: "A standing hymn of praise, to the Theotokos",
    url: AKATHIST_URL,
    icon: faStar,
  },
];
