import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_document():
    doc = Document()

    # Page Setup - Normal Margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Color Palette Constants (Professional Executive Theme)
    COLOR_PRIMARY = RGBColor(26, 54, 93)      # Deep Navy #1A365D
    COLOR_SECONDARY = RGBColor(14, 116, 144)  # Ocean Cyan #0E7490
    COLOR_ACCENT = RGBColor(217, 119, 6)      # Amber #D97706
    COLOR_DARK = RGBColor(30, 41, 59)         # Slate 800 #1E293B
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 #64748B
    COLOR_BG_LIGHT = "F8FAFC"                 # Light Gray Shading
    COLOR_PRIMARY_HEX = "1A365D"
    COLOR_SECONDARY_HEX = "0E7490"
    COLOR_BORDER_HEX = "CBD5E1"

    # Base Styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = COLOR_DARK
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Styling Helpers
    def set_cell_shading(cell, color_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(36)
        p.paragraph_format.space_after = Pt(8)
        run = p.add_run(text)
        run.font.size = Pt(28)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(24)
        run = p.add_run(text)
        run.font.size = Pt(14)
        run.font.italic = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(17)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.bold = True
            run_b.font.color.rgb = COLOR_DARK
        run_t = p.add_run(text)
        return p

    def add_callout(text, title="NOTE"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_shading(cell, COLOR_BG_LIGHT)
        set_cell_margins(cell, 120, 120, 180, 180)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run_t = p.add_run(f"[{title}] ")
        run_t.font.bold = True
        run_t.font.color.rgb = COLOR_PRIMARY
        p.add_run(text)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # =============================================================
    # COVER / HEADER SECTION
    # =============================================================
    add_title("K & A Weather Application")
    add_subtitle("Comprehensive System Architecture, Telemetry, and Production Documentation (v1.0.0)")

    # Metadata Grid
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Application Name", "K & A Weather"),
        ("Current Version", "1.0.0 (Production Release)"),
        ("Target Platforms", "Android (Direct APK & Google Play AAB), iOS Ready"),
        ("Technology Stack", "React Native 0.81, Expo SDK 54, React 19, TypeScript 5.9"),
        ("Cloud Infrastructure", "Expo EAS, GitHub CI/CD, PostHog Cloud Analytics")
    ]
    for row_idx, (label, val) in enumerate(meta_data):
        c1, c2 = meta_table.cell(row_idx, 0), meta_table.cell(row_idx, 1)
        c1.width, c2.width = Inches(2.2), Inches(4.3)
        set_cell_margins(c1, 60, 60, 100, 100)
        set_cell_margins(c2, 60, 60, 100, 100)
        set_cell_shading(c1, COLOR_BG_LIGHT)
        r1 = c1.paragraphs[0].add_run(label)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_PRIMARY
        c2.paragraphs[0].add_run(val)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # =============================================================
    # 1. EXECUTIVE SUMMARY & ARCHITECTURE
    # =============================================================
    add_heading_1("1. Executive Summary & Design Philosophy")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather is an advanced, cross-platform mobile meteorological and biometeorological intelligence suite. "
        "Engineered using React Native and Expo SDK 54, the application prioritizes sub-50ms instant cold-start rendering, "
        "hyperlocal atmospheric telemetry, live animated precipitation radar, and privacy-conscious real-time product analytics."
    )

    add_heading_2("Core Architectural Pillars")
    add_bullet("Direct client-to-API integration with global Open-Meteo supercomputers eliminates recurring server hosting fees while providing real-time data across every latitude and longitude.", "1. Serverless Resilience: ")
    add_bullet("Two-tier local caching mechanism ensures the user interface renders the most recent weather snapshot in under 50ms upon app launch, functioning smoothly even without an internet connection.", "2. Instant Cold-Start & Offline Capability: ")
    add_bullet("Custom interactive UI components, dynamic gradient physics reflecting solar zenith and condition codes, celestial sun/moon positioning, and native haptic feedback.", "3. Premium Glassmorphic Design: ")
    add_bullet("Integrated PostHog real-time telemetry tracks active sessions, user locations, and search popularity without capturing sensitive user credentials.", "4. Cloud Observability: ")

    # =============================================================
    # 2. APPLICATION PLATFORMS & CLOUD INFRASTRUCTURE
    # =============================================================
    add_heading_1("2. Platforms & Cloud Infrastructure Ecosystem")
    p = doc.add_paragraph()
    p.add_run("The application utilizes modern cloud deployment, version control, and telemetry platforms:")

    plat_table = doc.add_table(rows=5, cols=3)
    plat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    plat_headers = ["Platform / Tool", "Role & Purpose", "Configuration & Integration"]
    for i, h in enumerate(plat_headers):
        c = plat_table.cell(0, i)
        set_cell_shading(c, COLOR_PRIMARY_HEX)
        set_cell_margins(c, 80, 80, 100, 100)
        r = c.paragraphs[0].add_run(h)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    plat_rows = [
        ("Expo EAS (Expo Application Services)", "Cloud build pipeline for native Android (.apk/.aab) and iOS binaries.", "Configured via eas.json (preview APK and production AAB profiles). Remote cloud keystore signing."),
        ("GitHub & EAS Workflows", "Source code repository and automated CI/CD pipeline.", "Linked via .eas/workflows/create-production-builds.yml. Automatically triggers cloud builds on git push main."),
        ("PostHog Analytics (EU Cloud)", "Product analytics, active user telemetry, city search tracking, and retention.", "Configured in utils/analytics.ts and app/_layout.tsx using posthog-react-native SDK."),
        ("GitHub Releases", "Public distribution hub for downloadable APK artifacts.", "Provides permanent, direct-download APK links with built-in version tracking and download counters.")
    ]
    for row_idx, data in enumerate(plat_rows, start=1):
        shd = COLOR_BG_LIGHT if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            c = plat_table.cell(row_idx, col_idx)
            set_cell_shading(c, shd)
            set_cell_margins(c, 70, 70, 90, 90)
            c.paragraphs[0].add_run(text)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =============================================================
    # 3. DATA PROVIDERS & API SPECIFICATIONS
    # =============================================================
    add_heading_1("3. External APIs & Data Integration Matrix")
    p = doc.add_paragraph()
    p.add_run("The application aggregates data across specialized international data providers:")

    add_heading_2("1. Open-Meteo Weather Forecast API")
    add_bullet("Endpoint: https://api.open-meteo.com/v1/forecast", "URL: ")
    add_bullet("Data Provided: Current temperature, apparent temperature (feels like), relative humidity, surface pressure, precipitation probability, wind speed, wind direction, UV index, and WMO weather codes.", "Metrics: ")
    add_bullet("Temporal Range: 24-hour historical yesterday max temperature, current conditions, 24-hour hourly simulation, and 7-day extended forecast.", "Forecast Window: ")

    add_heading_2("2. Open-Meteo Air Quality & Biometeorology API")
    add_bullet("Endpoint: https://air-quality-api.open-meteo.com/v1/air-quality", "URL: ")
    add_bullet("Data Provided: European Air Quality Index (AQI), PM2.5 (Fine Particulate Matter), PM10 (Coarse Particles), Nitrogen Dioxide (NO2), Surface Ozone (O3), Sulphur Dioxide (SO2), Carbon Monoxide (CO), and botanical pollen counts (Grass, Birch, Ragweed).", "Metrics: ")

    add_heading_2("3. Geocoding & Coordinate Resolution")
    add_bullet("Primary Engine: Open-Meteo Geocoding API (https://geocoding-api.open-meteo.com/v1/search).", "Primary: ")
    add_bullet("Fallback Engine: OpenStreetMap Nominatim (https://nominatim.openstreetmap.org/search) for comprehensive multi-lingual address lookup.", "Fallback: ")
    add_bullet("Local Device Geolocation: Native GPS hardware querying via expo-location with automatic reverse-geocoding.", "Hardware GPS: ")

    add_heading_2("4. RainViewer Live Radar API")
    add_bullet("Endpoint: https://api.rainviewer.com/public/weather-maps.json", "URL: ")
    add_bullet("Data Provided: Global satellite precipitation radar tile overlays, animated 10-frame past-to-nowcast radar loops rendered seamlessly on MapView.", "Function: ")

    add_heading_2("5. Unsplash Dynamic City Backdrops")
    add_bullet("Endpoint: https://api.unsplash.com/search/photos", "URL: ")
    add_bullet("Function: Fetches high-resolution photographic backdrops matching the active searched city name and current weather condition code.", "Function: ")

    # =============================================================
    # 4. DATABASE VS. CLIENT PERSISTENCE ARCHITECTURE
    # =============================================================
    add_heading_1("4. Data Storage & Persistence Architecture")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather implements a lean, privacy-conscious 2-tier local client storage architecture. "
        "The application does not maintain a server-side relational database, eliminating data privacy risks, user credential databases, and backend hosting overhead."
    )

    add_heading_2("Tier 1: Cold-Start Instant Cache (AsyncStorage)")
    add_bullet("Storage Key: '@weather_cache_v2'", "Identifier: ")
    add_bullet("Payload: Serialized JSON snapshot of the latest complete weather payload, geographic coordinates, reverse-geocoded place name, and background image URL.", "Stored Content: ")
    add_bullet("Lifecycle: Read immediately upon app startup in <50ms to hydrate the screen before background network refresh. Updated upon every successful API call.", "Lifecycle: ")

    add_heading_2("Tier 2: Persistent Document Store (Expo FileSystem)")
    add_bullet("File Path: FileSystem.documentDirectory + 'weather_settings.json'", "File Path: ")
    add_bullet("Payload: Structured JSON containing saved favorite multi-city lists (city name, latitude, longitude) and user preferences.", "Stored Content: ")
    add_bullet("Resilience: Stored in the native document sandbox, ensuring user bookmarks survive app updates and OS cache sweeps.", "Persistence: ")

    # =============================================================
    # 5. USER INTERFACE & FEATURE BREAKDOWN
    # =============================================================
    add_heading_1("5. Component Specifications & Features")

    comp_table = doc.add_table(rows=8, cols=2)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c1, c2 = comp_table.cell(0, 0), comp_table.cell(0, 1)
    c1.width, c2.width = Inches(2.2), Inches(4.3)
    set_cell_shading(c1, COLOR_PRIMARY_HEX)
    set_cell_shading(c2, COLOR_PRIMARY_HEX)
    set_cell_margins(c1, 80, 80, 100, 100)
    set_cell_margins(c2, 80, 80, 100, 100)
    r1 = c1.paragraphs[0].add_run("Component / Module")
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(255, 255, 255)
    r2 = c2.paragraphs[0].add_run("Functionality & UI/UX Description")
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(255, 255, 255)

    comp_data = [
        ("WeatherOverlay.tsx", "Procedural animated ambient particle effects rendering falling rain streaks, drifting snow flakes, and thunder flashes."),
        ("WeatherNarrative.tsx", "AI-style natural language meteorologist summary giving dynamic advice based on current telemetry, humidity, and precipitation probability."),
        ("TimeTravelSlider.tsx", "Interactive 24-hour horizontal scrubber allowing users to simulate upcoming temperature, precipitation, and day/night transitions in real time."),
        ("CelestialArc.tsx", "Astronomical sun and moon arc tracking showing live solar zenith angles, sunrise, sunset, and calculated golden hour photo windows."),
        ("HealthMetrics.tsx", "Biometeorology hub displaying European AQI status, UV index protection ratings, and botanical allergy alerts for Grass, Birch, and Ragweed."),
        ("WeatherMap.tsx", "Full-screen interactive MapView with animated RainViewer radar satellite loops, storm spotter radar, and city markers."),
        ("MultiCityDashboard.tsx", "Multi-city comparison modal allowing users to monitor weather across all bookmarked cities simultaneously.")
    ]
    for row_idx, (cname, cdesc) in enumerate(comp_data, start=1):
        shd = COLOR_BG_LIGHT if row_idx % 2 == 1 else "FFFFFF"
        cell_a, cell_b = comp_table.cell(row_idx, 0), comp_table.cell(row_idx, 1)
        set_cell_shading(cell_a, shd)
        set_cell_shading(cell_b, shd)
        set_cell_margins(cell_a, 70, 70, 90, 90)
        set_cell_margins(cell_b, 70, 70, 90, 90)
        cell_a.paragraphs[0].add_run(cname).font.bold = True
        cell_b.paragraphs[0].add_run(cdesc)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =============================================================
    # 6. TELEMETRY & OBSERVABILITY WITH POSTHOG
    # =============================================================
    add_heading_1("6. PostHog Telemetry & Product Analytics")
    p = doc.add_paragraph()
    p.add_run(
        "To provide actionable product insights while respecting user privacy, PostHog mobile analytics is integrated via `utils/analytics.ts`. "
        "The following event schema is captured:"
    )

    add_bullet("Fired when a user selects a location from the search bar. Captures city name, country, and geographic coordinates for regional popularity analytics.", "1. 'city_searched': ")
    add_bullet("Fired upon weather data hydration. Captures city name, temperature, WMO weather code, and air quality index to analyze climate distributions.", "2. 'weather_viewed': ")
    add_bullet("Fired when a user favorites or removes a city bookmark, tracking user retention and location loyalty.", "3. 'city_saved_toggle': ")
    add_bullet("Fired when a user launches the interactive RainViewer radar modal.", "4. 'radar_map_opened': ")
    add_bullet("Fired when a user interacts with the hourly 24-hour simulation slider.", "5. 'time_travel_scrubbed': ")
    add_bullet("Automatically tracks active sessions, device models (Samsung, Xiaomi, Pixel), Android OS versions, and user country.", "6. Automatic Telemetry: ")

    # =============================================================
    # 7. PRODUCTION DEPLOYMENT & CI/CD GUIDE
    # =============================================================
    add_heading_1("7. Deployment & CI/CD Pipeline")
    p = doc.add_paragraph()
    p.add_run("The application is configured for continuous cloud deployment:")

    add_heading_2("EAS Build Profiles (eas.json)")
    add_bullet("Profile 'preview': Compiles standalone, installable Android .apk binaries for direct testing and distribution.", "1. Preview APK: ")
    add_bullet("Profile 'production': Compiles Android App Bundles (.aab) signed with cloud keystores ready for Google Play Store submission.", "2. Production AAB: ")

    add_heading_2("Automated GitHub CI/CD Workflow")
    add_bullet("Trigger: Any commit pushed to the 'main' branch automatically triggers an EAS cloud workflow.", "CI Trigger: ")
    add_bullet("Workflow File: .eas/workflows/create-production-builds.yml", "Config File: ")
    add_bullet("Artifact Delivery: Builds are published to the Expo Dashboard and can be attached directly to GitHub Releases.", "Distribution: ")

    # =============================================================
    # 8. CONCLUSION & SIGN-OFF
    # =============================================================
    add_heading_1("8. Conclusion & Sign-Off")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather Version 1.0.0 represents a modern benchmark in mobile meteorology and biometeorological intelligence. "
        "By harmonizing scientific supercomputer forecasts, live satellite radar nowcasting, offline cache resilience, "
        "automated GitHub CI/CD, and real-time cloud analytics, the application delivers a polished, reliable, and enterprise-grade mobile experience."
    )

    output_path = r"d:\PROJECTS\WEATHER_APP\K_and_A_Weather_v1.0_System_Documentation.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
