/* =====================================================================
   COP31 PAVILION KIOSK — EDIT THIS FILE ONLY
   ---------------------------------------------------------------------
   • type: "pdf"  -> put the PDF inside the "content" folder and write its file name in src.
                     Optional "image": a full-screen picture of the page (JPG/PNG, same name).
                     When "image" is set the page opens edge-to-edge, sharp, with no PDF toolbar.
                     Remove the "image" line to show the PDF itself (use this for multi-page PDFs).
   • type: "web"  -> write the full web address (https://...) in src.
                     mode "embed" = opens inside the kiosk with a Home button (default)
                     mode "page"  = opens the website itself (use only if "embed" shows a blank /
                                    "refused to connect" page). Visitors return home after the
                                    idle time set in START_KIOSK.bat.
   • icon: any PNG inside the "assets" folder (transparent background looks best)
   • Save the file, then restart the kiosk (or press F5) to see changes.
   ===================================================================== */
window.KIOSK_CONFIG = {
  eyebrow: "From Commitment to Implementation",
  title: "Get to Know Oman",
  subtitle: "Touch a topic to begin",

  // seconds without any touch before the screen returns to the home page
  idleSeconds: 90,
  // a "Still there?" message appears this many seconds before returning home
  warnSeconds: 10,

  buttons: [
    {
      label: "General Facts",
      sub: "Welcome to the Sultanate of Oman",
      icon: "assets/rose.png",
      color: "#f66b84",
      type: "pdf",
      src: "content/01-general-facts.jpg",
      image: "content/01-general-facts.jpg"
    },
    {
      label: "National Indicators",
      sub: "Oman’s environmental performance",
      icon: "assets/mangrove.png",
      color: "#32bd95",
      type: "pdf",
      src: "content/02-national-indicators.jpg",
      image: "content/02-national-indicators.jpg"
    },
    {
      label: "Visual Identity",
      sub: "7 elements of Oman’s nature",
      icon: "assets/coral.png",
      color: "#7dcbb6",
      type: "pdf",
      src: "content/03-visual-identity.jpg",
      image: "content/03-visual-identity.jpg"
    },
    {
      label: "Visitor Journey",
      sub: "Explore your pavilion journey",
      icon: "assets/luban.png",
      color: "#fdc0cf",
      type: "pdf",
      src: "content/04-visitor-journey.jpg",
      image: "content/04-visitor-journey.jpg"
    },
    {
      label: "Weather",
      sub: "experienceoman.om",
      icon: "assets/sun.png",
      color: "#f2b23c",
      type: "web",
      mode: "embed",
      src: "https://experienceoman.om/weather"
    }
  ]
};
