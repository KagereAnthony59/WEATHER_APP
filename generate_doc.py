import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

def create_document():
    doc = Document()

    # Page Setup - Normal Margins (1 inch)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Color Palette Constants
    COLOR_PRIMARY = RGBColor(26, 54, 93)      # Deep Navy #1A365D
    COLOR_SECONDARY = RGBColor(14, 116, 144)  # Ocean Blue #0E7490
    COLOR_ACCENT = RGBColor(217, 119, 6)      # Amber #D97706
    COLOR_DARK = RGBColor(30, 41, 59)         # Slate 800 #1E293B
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 #64748B
    COLOR_BG_LIGHT = "F8FAFC"                 # Light Gray Shading
    COLOR_PRIMARY_HEX = "1A365D"
    COLOR_SECONDARY_HEX = "0E7490"
    COLOR_ACCENT_HEX = "D97706"
    COLOR_BORDER_HEX = "CBD5E1"

    # Set Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = COLOR_DARK
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Helper Functions
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
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(18)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = COLOR_ACCENT
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.bold = True
            run_b.font.color.rgb = COLOR_DARK
        run_t = p.add_run(text)
        run_t.font.color.rgb = COLOR_DARK
        return p

    def add_callout(text, title="NOTE:"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_shading(cell, "EFF6FF")
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        
        # Border
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="{COLOR_SECONDARY_HEX}"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
        cell._tc.get_or_add_tcPr().append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run_title = p.add_run(f"{title} ")
        run_title.font.bold = True
        run_title.font.color.rgb = COLOR_SECONDARY
        run_text = p.add_run(text)
        run_text.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # 1. COVER PAGE / TITLE SECTION
    # -------------------------------------------------------------
    add_title("K & A Weather Application")
    add_subtitle("Comprehensive System Architecture, APIs, Protocols & Engineering Specification (v1.0)")
    
    # Metadata Block
    meta_p = doc.add_paragraph()
    meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_p.paragraph_format.space_after = Pt(28)
    r = meta_p.add_run("Author: ")
    r.font.bold = True
    meta_p.add_run("K & A Engineering Team  |  ")
    r2 = meta_p.add_run("Version: ")
    r2.font.bold = True
    meta_p.add_run("1.0.0 Production  |  ")
    r3 = meta_p.add_run("Date: ")
    r3.font.bold = True
    meta_p.add_run("September 2026\n")
    r4 = meta_p.add_run("Target Ecosystem: ")
    r4.font.bold = True
    meta_p.add_run("Cross-Platform Mobile (iOS & Android via Expo / React Native) & Progressive Web (PWA)")
    
    doc.add_page_break()

    # -------------------------------------------------------------
    # 2. EXECUTIVE SUMMARY & PROBLEM STATEMENT
    # -------------------------------------------------------------
    add_heading_1("1. Executive Summary & Problem Statement")
    
    p = doc.add_paragraph()
    p.add_run("Weather is one of the most critical external variables influencing human health, safety, psychology, logistics, and daily productivity. However, conventional digital weather applications remain fundamentally flawed. They present users with raw, fragmented tabular numbers—such as atmospheric pressure in millibars, humidity percentages, or bare temperature figures—without translating these parameters into actionable, real-world context.")
    
    add_heading_2("1.1 The Core Problems Solved by K & A Weather")
    add_bullet(" Most weather applications require users to perform mental gymnastics to figure out what a temperature actually feels like compared to recent days or how humidity affects human comfort. K & A Weather provides direct comparative narratives (e.g., '3°C cooler than yesterday at this time').", "Lack of Human Context: ")
    add_bullet(" Individuals with asthma, cardiovascular conditions, migraines, or severe seasonal allergies are vulnerable to micro-climatic shifts. K & A Weather integrates full biometeorological tracking (US AQI, PM2.5, PM10, Ozone, NO2, and botanical pollen tracking for Grass, Birch, and Ragweed).", "Neglect of Environmental Health & Allergies: ")
    add_bullet(" Static weather icons (sun/cloud) fail to show incoming precipitation bands. K & A Weather incorporates an interactive, multi-frame RainViewer radar map with spotter telemetry and future nowcasting.", "Static Visuals vs. Dynamic Radar: ")
    add_bullet(" Weather apps are traditionally cold and utilitarian. K & A Weather embeds reactive multi-track ambient audio (gentle rain, thunderstorm, forest birds, nocturnal crickets, winter winds) synchronized with current conditions to create a calming, multi-sensory experience.", "Absence of Sensory Immersion: ")
    add_bullet(" Outdoor enthusiasts, runners, cyclists, stargazers, and photographers lack domain-specific viability ratings. The app includes a multi-dimensional lifestyle advisory engine and a geometric Celestial Arc for solar/lunar golden-hour calculations.", "Missing Activity-Specific Advisories: ")

    # -------------------------------------------------------------
    # 3. HIGH-LEVEL SYSTEM ARCHITECTURE & TOPOLOGY
    # -------------------------------------------------------------
    add_heading_1("2. High-Level System Architecture")
    
    p = doc.add_paragraph()
    p.add_run("The application is constructed upon a high-performance, event-driven, decoupled client-cloud architecture. The mobile client functions as a resilient edge computing node that orchestrates multiple specialized meteorological, geospatial, and multimedia APIs, normalizes telemetry into unified TypeScript interfaces, caches payloads for instant offline hydration, and renders high-framerate 60 FPS interfaces.")

    add_callout(
        "K & A Weather operates in a Direct-to-Edge Client Architecture. The React Native / Expo client directly invokes secure, public and token-authenticated cloud microservices via HTTPS/REST, eliminating the latency and hosting overhead of a monolithic backend server.",
        "ARCHITECTURE HIGHLIGHT:"
    )

    add_heading_2("2.1 Architectural Tier Breakdown")
    
    # Table: Architectural Tiers
    table = doc.add_table(rows=5, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Tier", "Core Technologies", "Responsibility & Function"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.paragraphs[0].add_run(h).font.bold = True
        set_cell_shading(cell, COLOR_PRIMARY_HEX)
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_margins(cell, 120, 120, 150, 150)

    rows_data = [
        ("Presentation Tier (Frontend)", "React Native 0.81.5, Expo SDK 54, React 19, TypeScript, Reanimated 4, Expo-Blur, LinearGradient", "Renders glassmorphic UI, fluid animations, time-travel scrubbing, interactive radar map, audio soundscapes, and responsive mobile/web viewports."),
        ("State & Persistence Tier", "AsyncStorage, Expo FileSystem (Document Directory), React Hooks (useWeather)", "Manages cold-start cache hydration (@weather_cache_v2), persistent saved cities (weather_settings.json), in-memory reactive state, and offline resilience."),
        ("Orchestration & Network Tier", "Axios HTTP Client, Expo-Location, Haptics Engine", "Executes parallel multi-threaded network requests, handles geocoding fallbacks, location permission handshakes, error handling, and tactile feedback."),
        ("External Cloud Microservices", "Open-Meteo Forecast, Open-Meteo Air Quality, Open-Meteo Geocoding, RainViewer Radar CDN, OpenStreetMap Nominatim, Unsplash CDN, Mixkit Audio", "Provides real-time meteorological calculations, aerosol monitoring, radar tile streaming, high-resolution photographic backdrops, and ambient audio.")
    ]

    for row_idx, data in enumerate(rows_data, start=1):
        shd = COLOR_BG_LIGHT if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = table.cell(row_idx, col_idx)
            set_cell_shading(cell, shd)
            set_cell_margins(cell, 100, 100, 120, 120)
            cell.paragraphs[0].add_run(text)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # 4. EXTERNAL APIS, PROTOCOLS & INTEGRATION MATRIX
    # -------------------------------------------------------------
    add_heading_1("3. External APIs, Data Protocols & Communications")
    
    p = doc.add_paragraph()
    p.add_run("K & A Weather aggregates data across seven distinct global data providers and content delivery networks. All communications strictly enforce Transport Layer Security (TLS 1.3 / HTTPS) with JSON or binary media encoding.")

    add_heading_2("3.1 Master API Integration Matrix")

    # Master API Table
    table_api = doc.add_table(rows=8, cols=5)
    table_api.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_headers = ["Service Name", "Provider / Host", "Protocol", "Auth / Rate Limit", "Key Payload Data"]
    for i, h in enumerate(api_headers):
        cell = table_api.cell(0, i)
        cell.paragraphs[0].add_run(h).font.bold = True
        set_cell_shading(cell, COLOR_SECONDARY_HEX)
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_margins(cell, 100, 100, 100, 100)

    api_matrix_data = [
        ("Weather Forecast API", "api.open-meteo.com/v1/forecast", "HTTPS GET (REST)", "Free / Non-commercial (10k req/day)", "Temp, Feels-like, Humidity, Pressure, Wind, WMO Weather Code, 7-day daily, 24-hr hourly, Yesterday delta"),
        ("Air Quality & Aerosol API", "air-quality-api.open-meteo.com/v1/air-quality", "HTTPS GET (REST)", "Free / Non-commercial", "US AQI, PM2.5, PM10, Ozone (O3), Nitrogen Dioxide (NO2), Grass Pollen, Birch Pollen, Ragweed Pollen"),
        ("Primary Geocoding API", "geocoding-api.open-meteo.com/v1/search", "HTTPS GET (REST)", "Free / 10k req/day", "City autocompletion, Lat/Lon coordinates, Country, Administrative Division (State/Region)"),
        ("Fallback Geocoding API", "nominatim.openstreetmap.org/search & reverse", "HTTPS GET (REST)", "User-Agent Header (1 req/sec)", "Reverse coordinates to place name, city fallback when primary geocoder is unavailable"),
        ("RainViewer Radar Metadata", "api.rainviewer.com/public/weather-maps.json", "HTTPS GET (REST)", "Free / Unrestricted", "Past radar timestamps (2 hours), Nowcast radar timestamps (30 mins), Tile paths"),
        ("RainViewer Radar Tiles", "tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/2/1_1.png", "HTTPS GET (PNG Raster)", "CDN Cached", "256x256 Web Mercator precipitation radar overlay tiles for Google Maps / Apple Maps / Web"),
        ("Unsplash Imagery API", "api.unsplash.com/search/photos", "HTTPS GET (REST)", "Client-ID Bearer Key (50 req/hr)", "High-resolution portrait skylines matching current city name and contextual weather conditions")
    ]

    for row_idx, data in enumerate(api_matrix_data, start=1):
        shd = COLOR_BG_LIGHT if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = table_api.cell(row_idx, col_idx)
            set_cell_shading(cell, shd)
            set_cell_margins(cell, 80, 80, 100, 100)
            cell.paragraphs[0].add_run(text)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    add_heading_2("3.2 Detailed API Request & Response Mechanics")
    
    add_heading_3("A. Open-Meteo Weather Engine")
    p = doc.add_paragraph()
    p.add_run("The primary weather query constructs a comprehensive multi-parameter request combining current telemetry, hourly forecasts, 7-day daily projections, and historical offsets (past_days=1) in a single round-trip HTTP request to minimize network latency on cellular networks.")
    add_bullet("Endpoint: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,precipitation,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation_probability,wind_speed_10m,is_day&timezone=auto&past_days=1", "Request URL: ")
    add_bullet("WMO Weather Interpretation Codes (0: Clear sky, 1-3: Partly cloudy, 45-48: Fog, 51-67: Rain, 71-77: Snow, 80-82: Showers, 95-99: Thunderstorms) mapped to custom vector iconography, animated backgrounds, and dynamic color palettes.", "WMO Code Handling: ")

    add_heading_3("B. Open-Meteo Air Quality & Botanical Pollen Engine")
    p = doc.add_paragraph()
    p.add_run("The client executes an asynchronous parallel request (`Promise.all`) to fetch both the weather telemetry and air quality metrics concurrently. The air quality payload includes particulate matter concentrations and biological allergens.")
    add_bullet("US AQI (0-50: Good, 51-100: Moderate, 101-150: Unhealthy for Sensitive Groups, 151-200: Unhealthy, 201-300: Very Unhealthy, 300+: Hazardous).", "AQI Scale: ")
    add_bullet("PM2.5 and PM10 in μg/m³, Ozone (O3) and Nitrogen Dioxide (NO2) in μg/m³.", "Pollutants: ")
    add_bullet("Grass, Birch, and Ragweed pollen indices extracted from the hourly index corresponding to the current hour of the day.", "Allergens: ")

    add_heading_3("C. RainViewer Live Radar Tile Protocol")
    p = doc.add_paragraph()
    p.add_run("The radar module queries the RainViewer master JSON index to retrieve past frames (10-minute intervals covering the past 2 hours) and nowcasting frames (predictive precipitation modeling for the next 30 minutes). The app drives an automatic animation loop that cycles through frame timestamps, dynamically replacing the tile layer overlay on the map.")

    # -------------------------------------------------------------
    # 5. FRONTEND ARCHITECTURE & DESIGN SYSTEM
    # -------------------------------------------------------------
    add_heading_1("4. Frontend Architecture & Design Engineering")

    p = doc.add_paragraph()
    p.add_run("The frontend is built on modern React Native design principles, adhering to the 'Rich Aesthetics & Fluid Motion' standard. It employs frosted glassmorphism (`BlurView`), dynamic gradients (`LinearGradient`), physical haptic feedback (`expo-haptics`), and an intuitive modular layout.")

    add_heading_2("4.1 Component Breakdown & Responsibility Matrix")

    # Table: Components
    table_comp = doc.add_table(rows=11, cols=3)
    table_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_headers = ["Component File", "Visual / Functional Module", "Detailed Description & Technical Role"]
    for i, h in enumerate(comp_headers):
        cell = table_comp.cell(0, i)
        cell.paragraphs[0].add_run(h).font.bold = True
        set_cell_shading(cell, COLOR_PRIMARY_HEX)
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_margins(cell, 100, 100, 100, 100)

    comp_matrix = [
        ("app/index.tsx", "Main Dashboard & Screen Controller", "Root screen managing unit toggles (°C/°F, km/h / mph, 12h/24h), theme state (Dark/Light), pull-to-refresh, modal visibility, and time-travel preview state."),
        ("hooks/useWeather.ts", "Central State & Data Orchestrator", "Custom React hook handling location permissions, reverse geocoding, API calls, error states, offline cache hydration, and saved city management."),
        ("components/WeatherMap.tsx", "Interactive Live Radar & Spotter Map", "Fullscreen map utilizing react-native-maps with RainViewer radar tile overlays, frame timeline scrubber, playback speed controls, satellite/dark basemaps, and Spotter Mode (tap to get instant micro-weather anywhere on Earth)."),
        ("components/SoundscapePlayer.tsx", "Ambient Audio & Soundscape Engine", "Integrated audio player powered by expo-av offering 5 ambient tracks (Rain, Thunderstorm, Sunny Nature, Night Crickets, Alpine Wind) with volume adjustment and weather-matching auto-presets."),
        ("components/LifestyleAdvisories.tsx", "Biometeorological Advisory Engine", "Calculates activity viability scores (0-100%) for Running, Cycling, Stargazing, Car Washing, Laundry Drying, and Outdoor Dining, plus UV/Pollen warnings."),
        ("components/CelestialArc.tsx", "Astronomical Sun & Moon Calculator", "Visualizes solar arc geometry across the sky, sunrise/sunset times, daylight remaining countdown, and Golden Hour photography windows."),
        ("components/HealthMetrics.tsx", "Aerosol & Environmental Health Panel", "Detailed biometeorological cards displaying US AQI ratings, PM2.5, PM10, Ozone, NO2, Barometric pressure trends, and grass/birch/ragweed allergen gauges."),
        ("components/TimeTravelSlider.tsx", "24-Hour Forecast Scrubber", "Interactive slider allowing users to scrub forward through the next 24 hours; dynamically updates the entire dashboard's temperature, weather code, and conditions in real time."),
        ("components/WeatherNarrative.tsx", "Natural Language Weather Interpreter", "Generates human-readable weather descriptions and compares today's peak temperature with yesterday's actual high (e.g., '3°C cooler than yesterday')."),
        ("components/WeatherShareCard.tsx", "Social Sharing Graphic Generator", "Renders a social-ready graphic card with sleek styling for exporting weather conditions directly to social media or messaging platforms.")
    ]

    for row_idx, data in enumerate(comp_matrix, start=1):
        shd = COLOR_BG_LIGHT if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = table_comp.cell(row_idx, col_idx)
            set_cell_shading(cell, shd)
            set_cell_margins(cell, 80, 80, 100, 100)
            cell.paragraphs[0].add_run(text)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # 6. DATABASE, STORAGE & DATA PERSISTENCE
    # -------------------------------------------------------------
    add_heading_1("5. Database, Storage & Offline Persistence Tier")

    p = doc.add_paragraph()
    p.add_run("Because K & A Weather is designed as a standalone, zero-maintenance client application, it eliminates the operational complexity of hosting a centralized SQL/NoSQL database server. Instead, it employs a sophisticated, multi-tiered local storage architecture on the user's device.")

    add_heading_2("5.1 Storage Mechanisms Breakdown")

    add_bullet("Key: '@weather_cache_v2'. Stores the complete JSON snapshot of the most recent weather payload, coordinates, reverse-geocoded place name, and Unsplash background image URL. Upon cold app launch, the hook hydrates state instantly from this cache in under 50ms before initiating network background refresh.", "1. AsyncStorage (High-Speed Cold-Start Cache): ")
    add_bullet("File Path: FileSystem.documentDirectory + 'weather_settings.json'. Stores structured JSON data for saved multi-city lists (name, latitude, longitude), user customization flags, and favorite locations. This ensures data survives app updates and cache cleanings.", "2. Expo FileSystem (Document Store): ")
    add_bullet("Managed by React's useState and useWeather hook lifecycle. Manages ephemeral search autocomplete results, active time-travel scrubbing indexes, live radar playback frame counters, and audio playback positions.", "3. In-Memory Reactive Cache: ")

    # -------------------------------------------------------------
    # 7. HOW FRONTEND TALKS TO BACKEND (COMMUNICATION PROTOCOLS)
    # -------------------------------------------------------------
    add_heading_1("6. Communication Flow & Network Topology")

    p = doc.add_paragraph()
    p.add_run("The diagram below outlines the exact sequence of events during a typical app launch and location discovery cycle:")

    add_heading_2("6.1 Complete Lifecycle Data Flow Sequence")
    add_bullet("Step 1 (Offline Hydration): App initializes -> Reads AsyncStorage('@weather_cache_v2') -> If cache exists, renders immediate UI with cached banner in <50ms.", "Phase 1: Startup ")
    add_bullet("Step 2 (Location Triangulation): useWeather requests GPS permissions via Expo Location -> Acquires Balanced Accuracy coordinates (Latitude, Longitude) -> Falls back to getLastKnownPositionAsync if GPS satellite lock takes too long.", "Phase 2: Geolocation ")
    add_bullet("Step 3 (Reverse Geocoding): Converts (Lat, Lon) to human-readable City/Region name via Expo Location. If device geocoding encounters network failure, it automatically queries the OpenStreetMap Nominatim reverse API.", "Phase 3: Geocoding Fallback ")
    add_bullet("Step 4 (Parallel Telemetry Ingestion): Fires simultaneous HTTPS GET requests to Open-Meteo Forecast and Open-Meteo Air Quality APIs using Axios with configured 9000ms timeouts.", "Phase 4: Telemetry Fetch ")
    add_bullet("Step 5 (Media & Imagery Enrichment): If EXPO_PUBLIC_UNSPLASH_ACCESS_KEY is present, fires background request to Unsplash API for city skyline imagery matching the current weather condition.", "Phase 5: Visual Enhancement ")
    add_bullet("Step 6 (State Commit & Cache Flush): Normalizes raw API response into the TypeScript WeatherData model -> Updates React state -> Overwrites AsyncStorage cache -> Triggers smooth fade-in animation.", "Phase 6: UI Render & Cache ")

    # -------------------------------------------------------------
    # 8. DEPLOYMENT & PLATFORM HOSTING STRATEGY
    # -------------------------------------------------------------
    add_heading_1("7. Deployment, Hosting & Distribution Strategy")

    p = doc.add_paragraph()
    p.add_run("A critical consideration for the user is how to deploy and distribute this application across free hosting platforms and mobile distribution channels.")

    add_heading_2("7.1 Deployment Platform Compatibility Matrix")

    table_dep = doc.add_table(rows=4, cols=4)
    table_dep.alignment = WD_TABLE_ALIGNMENT.CENTER
    dep_headers = ["Platform", "Target Type", "Compatibility Status", "Deployment Workflow & Commands"]
    for i, h in enumerate(dep_headers):
        cell = table_dep.cell(0, i)
        cell.paragraphs[0].add_run(h).font.bold = True
        set_cell_shading(cell, COLOR_PRIMARY_HEX)
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_margins(cell, 100, 100, 100, 100)

    dep_matrix = [
        ("Vercel / Netlify / Cloudflare Pages", "Web / PWA (Mobile Browser)", "100% Fully Supported (Free)", "Run 'npx expo export -p web'. Deploy generated 'dist' directory. Provides instant public URL; users can 'Add to Home Screen' as a PWA."),
        ("Expo EAS Build (Cloud CI/CD)", "Android APK & iOS App", "100% Fully Supported (Free Tier)", "Run 'eas build -p android --profile preview' to generate a downloadable .apk file that installs directly on physical Android phones."),
        ("GitHub Actions CI/CD", "Android Standalone APK", "100% Free & Unlimited", "Configure a GitHub Action workflow to run Gradle assembleRelease and publish the .apk to GitHub Releases for direct public download.")
    ]

    for row_idx, data in enumerate(dep_matrix, start=1):
        shd = COLOR_BG_LIGHT if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = table_dep.cell(row_idx, col_idx)
            set_cell_shading(cell, shd)
            set_cell_margins(cell, 80, 80, 100, 100)
            cell.paragraphs[0].add_run(text)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # 9. ENVIRONMENT VARIABLES & SECURITY
    # -------------------------------------------------------------
    add_heading_1("8. Environment Configuration & Security Best Practices")

    p = doc.add_paragraph()
    p.add_run("The application utilizes Expo's public environment variable convention (`EXPO_PUBLIC_*`). Below are the required and optional configuration keys:")

    add_bullet("EXPO_PUBLIC_UNSPLASH_ACCESS_KEY: Optional Unsplash API Access Key used to fetch high-resolution background imagery matching cities and weather conditions. If omitted, the app gracefully degrades to sleek procedural gradient themes.", "Unsplash Key: ")
    add_bullet("All core weather, air quality, geocoding, and radar APIs utilized (Open-Meteo, RainViewer, OpenStreetMap) require zero proprietary API keys, drastically minimizing secret leakage vulnerabilities and maintenance overhead.", "Zero-Key Resiliency: ")

    # -------------------------------------------------------------
    # 10. VERSION 2.0 ROADMAP
    # -------------------------------------------------------------
    add_heading_1("9. Version 2.0 Product Roadmap")

    p = doc.add_paragraph()
    p.add_run("While Version 1.0 delivers a complete, production-grade meteorological and biometeorological suite, the following high-impact features are planned for Version 2.0:")

    add_bullet("Dynamic particle physics (rain droplets, snowflakes, fog layers) that drift across the screen responding to device tilt via accelerometer/gyroscope sensors (expo-sensors).", "1. Gyroscopic Accelerometer Weather Particles: ")
    add_bullet("Integrated notification service alerting users 15 minutes before rainfall starts, or warning of rapid atmospheric pressure drops (barometric headache alert).", "2. Severe Weather & Hyperlocal Rain Push Notifications: ")
    add_bullet("Glanceable interactive home screen widgets for Android and iOS lock screens.", "3. Home Screen & Lock Screen Widgets: ")
    add_bullet("Community weather reporting allowing users to pin local weather events (e.g., sudden hail, visible rainbows) directly onto the shared WeatherMap.", "4. Crowdsourced Spotter Network: ")

    # -------------------------------------------------------------
    # 11. CONCLUSION & SIGN-OFF
    # -------------------------------------------------------------
    add_heading_1("10. Conclusion & Architectural Sign-Off")
    p = doc.add_paragraph()
    p.add_run("K & A Weather Version 1.0 represents a modern benchmark in mobile meteorology applications. By harmonizing accurate scientific telemetry (Open-Meteo), live animated precipitation radar (RainViewer), biometeorological health indices, astronomical golden-hour mechanics, dynamic ambient soundscapes, and offline cache resilience, the application delivers a complete, polished, and premium user experience ready for real-world deployment.")

    output_path = r"d:\PROJECTS\WEATHER_APP\K_and_A_Weather_v1.0_System_Documentation.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
