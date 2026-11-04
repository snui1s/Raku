// The toolbar fonts that are not bundled with the app come from Google Fonts. The stylesheet is added from code
// after the first paint instead of a <link> in index.html, so a slow or missing network never delays startup.
// Google Sans and LINE Seed Sans TH are bundled (see index.css) and are not listed here.
export const WEB_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&family=Kanit:wght@300;400;500;600;700&family=Mitr:wght@300;400;500;600&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Prompt:wght@300;400;500;600;700&family=Roboto:wght@400;500;700&family=Sarabun:wght@300;400;500;600;700&display=swap";

const LINK_ID = "raku-web-fonts";

export function loadWebFonts(): void {
  if (document.getElementById(LINK_ID)) return;
  const link = document.createElement("link");
  link.id = LINK_ID;
  link.rel = "stylesheet";
  link.href = WEB_FONTS_URL;
  document.head.appendChild(link);
}
