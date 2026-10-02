// Route params arrive as strings (or undefined when omitted), so every field
// here is a string rather than the model type it was built from.

export type EventDetailsParams = {
  id: string;
  title: string;
  // ISO timestamps; the screen formats them for display.
  start: string;
  end: string;
  allDay: "true" | "false";
  source: string;
  description?: string;
  location?: string;
};

export type DailyReadingsParams = {
  type: "epistle" | "gospel";
  reading: string;
  title: string;
};

export type PdfViewerParams = {
  url: string;
  title: string;
};
