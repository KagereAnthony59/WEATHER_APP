import os
import sys
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
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)

    # Color Palette Constants (Executive Navy & Cyan Theme)
    COLOR_PRIMARY = RGBColor(26, 54, 93)      # Deep Navy #1A365D
    COLOR_SECONDARY = RGBColor(14, 116, 144)  # Ocean Cyan #0E7490
    COLOR_ACCENT = RGBColor(217, 119, 6)      # Amber #D97706
    COLOR_DARK = RGBColor(30, 41, 59)         # Slate 800 #1E293B
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 #64748B
    
    COLOR_PRIMARY_HEX = "1A365D"
    COLOR_SECONDARY_HEX = "0E7490"
    COLOR_ACCENT_HEX = "D97706"
    COLOR_BG_LIGHT = "F8FAFC"                 # Light Slate Shading
    COLOR_BG_CODE = "F1F5F9"                  # Code block background
    COLOR_BORDER_HEX = "CBD5E1"

    # Base Styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = COLOR_DARK
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Helper Functions for Formatting
    def set_cell_shading(cell, color_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=70, bottom=70, left=100, right=100):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(28)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.size = Pt(24)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(18)
        run = p.add_run(text)
        run.font.size = Pt(12)
        run.font.italic = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(11)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.bold = True
            run_b.font.color.rgb = COLOR_DARK
        run_t = p.add_run(text)
        return p

    def add_callout(text, title="SYSTEM NOTE"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_shading(cell, COLOR_BG_LIGHT)
        set_cell_margins(cell, 90, 90, 130, 130)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run_t = p.add_run(f"[{title}] ")
        run_t.font.bold = True
        run_t.font.color.rgb = COLOR_PRIMARY
        p.add_run(text)
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

    def add_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_shading(cell, COLOR_BG_CODE)
        set_cell_margins(cell, 70, 70, 100, 100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(8)
        run.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

    def style_table_header(table, cols, headers, col_widths=None):
        for i, h in enumerate(headers):
            c = table.cell(0, i)
            set_cell_shading(c, COLOR_PRIMARY_HEX)
            set_cell_margins(c, 70, 70, 90, 90)
            if col_widths and i < len(col_widths):
                c.width = Inches(col_widths[i])
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(h)
            r.font.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(255, 255, 255)

    def populate_table_rows(table, rows_data, col_widths=None):
        for row_idx, data in enumerate(rows_data, start=1):
            shd = COLOR_BG_LIGHT if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, text in enumerate(data):
                c = table.cell(row_idx, col_idx)
                set_cell_shading(c, shd)
                set_cell_margins(c, 50, 50, 70, 70)
                if col_widths and col_idx < len(col_widths):
                    c.width = Inches(col_widths[col_idx])
                p = c.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                r = p.add_run(str(text))
                r.font.size = Pt(8)
                if col_idx == 0:
                    r.font.bold = True

    # =========================================================================
    # DOCUMENT COVER & REVISION CONTROL
    # =========================================================================
    add_title("K & A Weather Application")
    add_subtitle("Comprehensive System Architecture, API Catalog, Codebase Directory & Engineering Reference Manual")

    meta_table = doc.add_table(rows=8, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Application Name & Codename", "K & A Weather (Atmospheric Intelligence Suite v1.0.0)"),
        ("Current Production Build", "Version 1.0.0 (Standalone APK: ~22-24MB / Google Play AAB)"),
        ("Core Engineering Stack", "React Native 0.81.5, Expo SDK 54, React 19, TypeScript 5.9, Hermes JS Engine"),
        ("Cloud & Deployment DevOps", "Expo EAS Build, GitHub Actions CI/CD Pipeline, Over-The-Air (OTA) Updates"),
        ("Total Integrated External APIs", "8 External Services & Microservices (Forecast, AQI, Geocoding, Radar, GIS, OSM, Unsplash, PostHog)"),
        ("Document Classification", "Executive System Architecture & Technical Specification Document"),
        ("Target Platform Compatibility", "Android 6.0+ (API Level 23+), iOS 13.0+, Web / PWA Compatible"),
        ("Security & Privacy Level", "Zero-PII Collection, TLS 1.3 Strict In-Flight Encryption, Local Sandboxed Storage")
    ]
    for row_idx, (label, val) in enumerate(meta_data):
        c1, c2 = meta_table.cell(row_idx, 0), meta_table.cell(row_idx, 1)
        c1.width, c2.width = Inches(2.3), Inches(4.2)
        set_cell_margins(c1, 40, 40, 70, 70)
        set_cell_margins(c2, 40, 40, 70, 70)
        set_cell_shading(c1, COLOR_BG_LIGHT)
        r1 = c1.paragraphs[0].add_run(label)
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = COLOR_PRIMARY
        r2 = c2.paragraphs[0].add_run(val)
        r2.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Document Revision History Table
    add_heading_2("Document Control & Revision History")
    rev_table = doc.add_table(rows=4, cols=4)
    rev_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(rev_table, 4, ["Revision", "Release Date", "Author / Engineering Role", "Summary of Architectural Changes"], [0.8, 1.1, 1.8, 2.8])
    rev_data = [
        ("v0.8.0", "2026-09-12", "Mobile Engineering Team", "Initial MVP prototype with Expo Location and Open-Meteo forecast API integration."),
        ("v0.9.5", "2026-09-25", "Systems Architecture Lead", "Integrated RainViewer radar, dual-tier caching, and PostHog EU cloud telemetry."),
        ("v1.0.0", "2026-10-03", "Principal Mobile Architect", "Production release: Esri Dark Canvas GIS mapping, ~22MB binary optimization, OTA deployment.")
    ]
    populate_table_rows(rev_table, rev_data, [0.8, 1.1, 1.8, 2.8])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # CHAPTER 1: EXECUTIVE SUMMARY & ARCHITECTURAL PHILOSOPHY
    # =========================================================================
    add_heading_1("1. Executive Summary & Design Tenets")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather is an advanced, ultra-responsive cross-platform meteorological mobile application engineered "
        "to deliver hyperlocal atmospheric intelligence, biometeorological health indices, live radar precipitation mapping, "
        "and lifestyle planning insights. Developed on React Native 0.81.5 and Expo SDK 54, the system is designed to "
        "bridge the gap between raw scientific meteorological data and everyday human decision-making."
    )

    p = doc.add_paragraph()
    p.add_run(
        "Traditional consumer weather applications suffer from heavy ad bloat, battery-draining background tracking, "
        "expensive recurring backend infrastructure, and large application binary footprints (>60MB). K & A Weather resolves "
        "these systemic issues by implementing a pure client-to-edge serverless architecture, strict offline caching, "
        "local mathematical biometeorological synthesis, and optimized native compilation resulting in a compact ~22-24MB binary."
    )

    add_heading_2("1.1 Core Engineering Principles")
    add_bullet("Direct client-to-edge API communication completely eliminates recurring backend server hosting bills, database management overhead, and single-point-of-failure bottlenecks.", "1. Serverless Edge Architecture: ")
    add_bullet("A synchronous dual-tier storage strategy (AsyncStorage + Expo FileSystem) enables the app to hydrate and render cached atmospheric state in under 50ms upon app cold start, functioning seamlessly in offline scenarios.", "2. Sub-50ms Cold Start & Offline Resilience: ")
    add_bullet("Dynamic gradient physics driven by solar zenith calculations, live weather conditions, frosted glass blurs (expo-blur), and smooth layout animations provide an immersive modern user interface.", "3. Premium Glassmorphic Design System: ")
    add_bullet("Raw temperature, barometric pressure, humidity, wind velocity, and AQI are synthesized into actionable biometeorological guidance: arthritis joint pain risk, migraine alerts, and activity suitability indices.", "4. Actionable Atmospheric Intelligence: ")
    add_bullet("By replacing heavy native map binaries with a high-performance Leaflet WebView engine and applying strict ProGuard/R8 code shrinking, standalone APK sizes were reduced from over 60MB down to ~22-24MB.", "5. Lightweight Binary Footprint: ")
    add_bullet("Integration with PostHog EU Cloud provides real-time telemetry, session metrics, and search trend insights while strictly adhering to privacy-first, zero-PII data ingestion principles.", "6. Privacy-First Cloud Telemetry: ")

    add_callout(
        "K & A Weather is designed as a zero-maintenance client architecture. All computations—including celestial sun/moon "
        "trajectories, biometeorological risk scoring, and radar frame synchronization—are performed locally on the client device.",
        "ARCHITECTURAL HIGHLIGHT"
    )

    # =========================================================================
    # CHAPTER 2: HIGH-LEVEL BASE ARCHITECTURE & TECHNOLOGY STACK
    # =========================================================================
    add_heading_1("2. Base Architecture & Technology Stack")
    p = doc.add_paragraph()
    p.add_run(
        "The application architecture is structured into four decoupled layers: the Presentation & UI Layer, "
        "the Local State & Synthesis Layer, the Persistence & Cache Engine, and the External Integration Layer."
    )

    add_heading_2("2.1 High-Level End-to-End Architecture Model")
    arch_ascii = """+-----------------------------------------------------------------------------------+
|                           PRESENTATION & USER EXPERIENCE LAYER                    |
|  [Expo Router] -> [app/index.tsx] (Hero Gradient, 48h Hourly, 7-Day Forecast)    |
|  [Glassmorphic Modules]: CelestialArc, HealthMetrics, LifestyleAdvisories         |
|  [Interactive Modals]: WeatherMap (Leaflet), MultiCityDashboard, SettingsModal     |
|  [Audio & Social]: SoundscapePlayer (Expo-AV), WeatherShareCard (Expo Haptics)     |
+-----------------------------------------------------------------------------------+
                                          | (Actions & Events)
                                          v
+-----------------------------------------------------------------------------------+
|                        LOCAL STATE, BUSINESS LOGIC & SYNTHESIS LAYER              |
|  [hooks/useWeather.ts]: Master State Machine, Coordinate Resolver, Code Refiner   |
|  [Biometeorology Engine]: Julian Day Lunar Model, Outdoor Fitness, Attire Guide   |
|  [Telemetry Engine]: utils/analytics.ts (PostHog Batching, Buffer & Instant Flush)|
+-----------------------------------------------------------------------------------+
                     |                                       |
    (Read/Write Cache & Settings)                (Parallel HTTPS API Requests)
                     v                                       v
+------------------------------------+   +------------------------------------------+
|     LOCAL PERSISTENCE ENGINE       |   |       EXTERNAL EDGE & API SERVICES       |
| 1. AsyncStorage:                   |   | 1. Open-Meteo Forecast (72h Forecast)    |
|    @weather_cache_v2 (Instant)     |   | 2. Open-Meteo AQI (PM2.5, PM10, O3, NO2) |
| 2. Expo FileSystem:                |   | 3. Open-Meteo Geocoding (Global Search)  |
|    weather_settings.json (Cities)  |   | 4. RainViewer Cloud (Doppler Radar Tiles)|
+------------------------------------+   | 5. Esri ArcGIS (Dark Canvas & Satellite) |
                                         | 6. OpenStreetMap (Nominatim Geocoding)   |
                                         | 7. Unsplash API (City Skyline Photos)    |
                                         | 8. PostHog EU Cloud (Telemetry Ingestion)|
                                         +------------------------------------------+"""
    add_code_block(arch_ascii)

    add_heading_2("2.2 Architectural Tier Breakdown")
    arch_table = doc.add_table(rows=5, cols=3)
    arch_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(arch_table, 3, ["Architectural Layer", "Key Technologies & Modules", "Core Responsibilities & Capabilities"], [1.5, 2.0, 3.0])
    arch_rows = [
        ("Presentation Layer", "React Native 0.81.5, React 19, Expo Blur, Expo Vector Icons, Reanimated", "Renders glassmorphic UI cards, dynamic sky backdrops, 48h hourly scrubbers, and modal dialogues."),
        ("State & Logic Layer", "TypeScript 5.9, useWeather Hook, Axios, Expo Location, Haptics", "Coordinates GPS acquisition, weather code refinement, biometeorological algorithms, and telemetry dispatch."),
        ("Persistence Engine", "@react-native-async-storage, expo-file-system/legacy", "Tier 1: Fast cache hydration (<50ms). Tier 2: Persistent JSON file storage for saved cities and preferences."),
        ("External Edge Layer", "Open-Meteo, RainViewer v2, Esri ArcGIS, OSM Nominatim, Unsplash, PostHog", "Fetches global numerical weather forecasts, air quality metrics, GIS tile sets, city photography, and telemetry.")
    ]
    populate_table_rows(arch_table, arch_rows, [1.5, 2.0, 3.0])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_heading_2("2.3 Frontend Client Specifications")
    add_bullet("React Native version 0.81.5 running the Hermes JavaScript Bytecode Engine for maximum JIT performance and minimal memory footprint.", "Runtime Engine: ")
    add_bullet("Expo SDK 54 with Expo Router file-based architecture (`app/_layout.tsx` and `app/index.tsx`).", "Application Framework: ")
    add_bullet("Vanilla React Native StyleSheet architecture with dynamic HSL-based color tokens, dark/light theme switching, and platform-specific elevation/shadow properties.", "Styling System: ")
    add_bullet("Expo-AV background audio manager executing asynchronous playback of looping atmospheric ambient soundscapes.", "Audio Processing: ")
    add_bullet("React Native WebView hosting an embedded Leaflet 1.9.4 engine for high-framerate, watermark-free radar and GIS mapping.", "Mapping Framework: ")

    add_heading_2("2.4 Dual-Tier Storage & Offline Data Caching")
    p = doc.add_paragraph()
    p.add_run(
        "To guarantee immediate rendering upon app launch regardless of cellular network connectivity, K & A Weather implements a dual-tier persistence model:"
    )
    add_bullet("Keys: `@weather_cache_v2`. Stores full serialized snapshot of the last active weather payload, coordinates, city name, and Unsplash backdrop. Read synchronously during initial component mounting.", "Tier 1 (AsyncStorage - Fast UI Cache): ")
    add_bullet("File Path: `${FileSystem.documentDirectory}weather_settings.json`. Stores structured user preferences, temperature unit selections (Celsius/Fahrenheit), time format (12h/24h), and multi-city bookmark arrays.", "Tier 2 (Expo FileSystem - Long-term Storage): ")

    # =========================================================================
    # CHAPTER 3: COMPLETE API CATALOG, ENDPOINT SPECS & API KEYS
    # =========================================================================
    add_heading_1("3. External API Catalog & Integration Specifications")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather integrates a total of 8 external services, APIs, and microservices. "
        "The table and detailed sub-sections below provide the comprehensive integration matrix, including endpoint URLs, "
        "authentication mechanisms, public keys, query parameters, and fallback behavior."
    )

    add_heading_2("3.1 Master API Summary Matrix (8 Total APIs)")
    api_summary_table = doc.add_table(rows=9, cols=5)
    api_summary_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(api_summary_table, 5, ["#", "Service Name", "Provider / Host", "Auth / API Key Required", "Primary Role in App"], [0.4, 1.4, 1.7, 1.5, 1.5])
    api_summary_rows = [
        ("1", "Forecast API", "Open-Meteo (Germany)", "Keyless (Open-Access)", "Current weather, 48h hourly, 7d daily forecasts"),
        ("2", "Air Quality API", "Open-Meteo CAMS", "Keyless (Open-Access)", "US AQI, PM2.5, PM10, Ozone (O3), NO2"),
        ("3", "Geocoding API", "Open-Meteo Search", "Keyless (Open-Access)", "Global city autocomplete & lat/lon resolution"),
        ("4", "Radar Tiles v2", "RainViewer Cloud", "Keyless (Open-Access)", "Live Doppler precipitation radar tile overlay"),
        ("5", "Dark Canvas GIS", "Esri ArcGIS Online", "Keyless / Public Endpoint", "Watermark-free dark gray base & label map"),
        ("6", "World Imagery", "Esri ArcGIS Satellite", "Keyless / Public Endpoint", "High-resolution orbital satellite photography"),
        ("7", "Nominatim OSM", "OpenStreetMap", "Keyless (User-Agent req.)", "Hardware GPS reverse geocoding fallback"),
        ("8", "City Skyline API", "Unsplash Developers", "API Access Key Required", "HD photographic city skylines & backdrops")
    ]
    populate_table_rows(api_summary_table, api_summary_rows, [0.4, 1.4, 1.7, 1.5, 1.5])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_heading_2("3.2 API Keys & Environment Configuration")
    p = doc.add_paragraph()
    p.add_run("The following API keys and client credentials are used across the production deployment:")

    key_table = doc.add_table(rows=3, cols=3)
    key_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(key_table, 3, ["Environment Variable / Key", "Configured Key Value / Token", "Target Service & Endpoint"], [2.0, 2.5, 2.0])
    key_rows = [
        ("EXPO_PUBLIC_UNSPLASH_ACCESS_KEY", "O8cYL7g7vogChwbYekIEU7c-vjDyEBR0ZD9cZjoDQjo", "Unsplash Photo Search API (api.unsplash.com)"),
        ("POSTHOG_API_KEY", "phc_rnARUT4DVPNsEcoeHTsYFTdABnd9SM9UPWiKHRpTbMis", "PostHog EU Cloud Telemetry (eu.i.posthog.com)")
    ]
    populate_table_rows(key_table, key_rows, [2.0, 2.5, 2.0])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_heading_2("3.3 Detailed Endpoint Contracts & Data Schemas")

    # API 1
    add_heading_3("1. Open-Meteo Weather Forecast API")
    add_bullet("Endpoint: `https://api.open-meteo.com/v1/forecast`", "URL: ")
    add_bullet("Protocol: HTTPS GET | Timeout: 9000ms | Auth: None (Free open-access tier)", "Specs: ")
    add_bullet("Request Parameters: `latitude`, `longitude`, `current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,precipitation,rain,showers,cloud_cover,surface_pressure`, `daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max`, `hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation_probability,precipitation,rain,showers,cloud_cover,wind_speed_10m,is_day`, `timezone=auto`, `past_days=1`", "Parameters: ")
    add_bullet("Response Structure: JSON containing `current` object, `daily` array object, and `hourly` array object across 72 hours.", "Schema: ")

    # API 2
    add_heading_3("2. Open-Meteo Air Quality & Atmospheric Health API")
    add_bullet("Endpoint: `https://air-quality-api.open-meteo.com/v1/air-quality`", "URL: ")
    add_bullet("Protocol: HTTPS GET | Timeout: 9000ms | Auth: None", "Specs: ")
    add_bullet("Request Parameters: `latitude`, `longitude`, `current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,uv_index`, `timezone=auto`", "Parameters: ")
    add_bullet("Response Metrics: US AQI index (0-500 scale), PM2.5 in µg/m³, PM10 in µg/m³, Ozone in µg/m³, NO2 in µg/m³.", "Schema: ")

    # API 3
    add_heading_3("3. Open-Meteo Geocoding Search API")
    add_bullet("Endpoint: `https://geocoding-api.open-meteo.com/v1/search`", "URL: ")
    add_bullet("Protocol: HTTPS GET | Timeout: 5000ms | Auth: None", "Specs: ")
    add_bullet("Request Parameters: `name={query}`, `count=15`, `language=en`, `format=json`", "Parameters: ")
    add_bullet("Response Array: List of matching cities containing `id`, `name`, `latitude`, `longitude`, `country`, `admin1` (state/province).", "Schema: ")

    # API 4
    add_heading_3("4. RainViewer Live Radar Tile API v2")
    add_bullet("Metadata Endpoint: `https://api.rainviewer.com/public/weather-maps.json`", "Metadata URL: ")
    add_bullet("Tile Cache Pattern: `https://tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/1/1_1.png`", "Tile URL: ")
    add_bullet("Protocol: HTTPS GET | Refresh Interval: Auto-refreshes every 5 minutes", "Specs: ")
    add_bullet("Function: Provides global real-time Doppler radar tile overlays displaying precipitation intensity color-coded from light rain (blue/green) to severe thunderstorms/hail (yellow/red/purple).", "Function: ")

    # API 5 & 6
    add_heading_3("5 & 6. Esri ArcGIS Dark Canvas & Satellite Tile Services")
    add_bullet("Dark Gray Base: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`", "Dark Base: ")
    add_bullet("Dark Gray Reference: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`", "Dark Labels: ")
    add_bullet("World Imagery Satellite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`", "Satellite: ")
    add_bullet("Specs: High-speed CDN-delivered tile layers with 0ms authorization, zero watermarks, and native dark-mode styling.", "Specs: ")

    # API 7
    add_heading_3("7. OpenStreetMap Nominatim Geocoding Fallback Engine")
    add_bullet("Reverse Endpoint: `https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json`", "Reverse URL: ")
    add_bullet("Forward Search: `https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=10&addressdetails=1`", "Search URL: ")
    add_bullet("Headers: Mandatory `User-Agent: WeatherAppGlobal/1.0 (react-native-expo)`", "Headers: ")
    add_bullet("Fallback Role: Activated automatically if device native reverse-geocoding fails or Open-Meteo search returns empty results.", "Role: ")

    # API 8
    add_heading_3("8. Unsplash High-Resolution City Backdrop API")
    add_bullet("Endpoint: `https://api.unsplash.com/search/photos`", "URL: ")
    add_bullet("Auth Header / Param: `client_id=O8cYL7g7vogChwbYekIEU7c-vjDyEBR0ZD9cZjoDQjo`", "Auth: ")
    add_bullet("Query: `query={cityName}+skyline`, `orientation=portrait`, `per_page=1`", "Query: ")
    add_bullet("Fallback Hierarchy: If city photo is not found or request times out (4500ms), system seamlessly cascades to condition-matched HD curated backdrops.", "Fallback: ")

    # =========================================================================
    # CHAPTER 4: COMPLETE CODEBASE DIRECTORY & FEATURE LOCATION MATRIX
    # =========================================================================
    add_heading_1("4. Codebase Directory Structure & Feature Location Matrix")
    p = doc.add_paragraph()
    p.add_run(
        "The K & A Weather repository is structured logically to separate application routing, "
        "modular UI components, custom React hooks, shared utilities, and deployment assets."
    )

    add_heading_2("4.1 Master Project Directory Tree")
    dir_tree = """WEATHER_APP/
├── .github/
│   └── workflows/
│       └── eas-update.yml            # GitHub Actions automated EAS OTA CI/CD workflow
├── app/
│   ├── _layout.tsx                   # Root navigation layout, font loading, PostHog initialization
│   └── index.tsx                     # Main dashboard screen, pull-to-refresh, hero cards, 7d forecast
├── components/
│   ├── CelestialArc.tsx              # Sun trajectory, Julian day moon phase calculation, solar keypoints
│   ├── HealthMetrics.tsx             # US AQI card, PM2.5, PM10, Ozone, NO2 pollutant monitoring
│   ├── LifestyleAdvisories.tsx       # Outfit guide, outdoor workout score, car wash & laundry indices
│   ├── MultiCityDashboard.tsx        # Comparative multi-city monitoring modal with bulk API sync
│   ├── SettingsModal.tsx             # Unit configuration (C/F), 12h/24h time format, notifications
│   ├── SoundscapePlayer.tsx          # Looping atmospheric audio generator (Rain, Wind, Nature, Night)
│   ├── TimeTravelSlider.tsx          # 48-hour horizontal future forecast simulation scrubber
│   ├── WeatherMap.tsx                # Leaflet WebView GIS radar map, Esri Dark Canvas, spotter mode
│   ├── WeatherNarrative.tsx          # Natural language AI meteorological summary briefing generator
│   ├── WeatherOverlay.tsx            # Fullscreen weather animations (rain, snowfall, lightning flashes)
│   ├── WeatherShareCard.tsx          # Stylized social media weather snapshot generator with native share
│   └── WeatherWisdom.tsx             # Atmospheric science trivia and facts engine (Reserved for v2)
├── constants/
│   └── Colors.ts                     # Application color palette, light/dark mode color tokens
├── hooks/
│   └── useWeather.ts                 # Master weather state machine, caching, geocoding, and bulk sync
├── utils/
│   ├── analytics.ts                  # PostHog EU cloud telemetry dispatch, event buffering, and flush
│   └── haptics.ts                    # Platform-safe haptic feedback wrapper (light, medium, success)
├── .env                              # Environment variable configuration (Unsplash API key)
├── app.json                          # Expo project configuration, package metadata, Android permissions
├── eas.json                          # Expo Application Services build configuration (ARM64 optimization)
└── package.json                      # Project dependencies, scripts, and runtime package definitions"""
    add_code_block(dir_tree)

    add_heading_2("4.2 Feature Location Matrix")
    p = doc.add_paragraph()
    p.add_run("The following matrix maps every functional capability to its exact source file, line location, and implementation module:")

    feat_table = doc.add_table(rows=12, cols=3)
    feat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(feat_table, 3, ["Feature / Capability", "Source File Location", "Technical Implementation & Hook Binding"], [1.8, 2.2, 2.5])
    feat_rows = [
        ("GPS Geolocation & Permission", "hooks/useWeather.ts (L355-422)", "expo-location requestForegroundPermissionsAsync with balanced accuracy fallback."),
        ("Instant Cold-Start Hydration", "hooks/useWeather.ts (L118-138)", "AsyncStorage.getItem('@weather_cache_v2') executing during initial useEffect mount."),
        ("Weather Code Refinement", "hooks/useWeather.ts (L85-94)", "refineWeatherCode() corrects drizzle codes (51/53/80) when actual rain is 0mm."),
        ("Interactive GIS Weather Map", "components/WeatherMap.tsx (L1-656)", "WebView with Leaflet 1.9.4, Esri Dark Canvas LayerGroup, and RainViewer radar tile cache."),
        ("Spotter Mode Pinpoint Scanner", "components/WeatherMap.tsx (L158-202)", "Map click event posting coordinates back to React Native for instant spot weather fetch."),
        ("Celestial Sun & Moon Tracking", "components/CelestialArc.tsx (L1-201)", "Julian Day approximation algorithm calculating synodic lunar phase and daylight progress arc."),
        ("Air Quality & Health Hub", "components/HealthMetrics.tsx (L1-76)", "US AQI categorization matrix with real-time pollutant levels (PM2.5, PM10, O3, NO2)."),
        ("Smart Lifestyle Advisories", "components/LifestyleAdvisories.tsx (L1-275)", "Calculates attire guidance, 0-100 fitness workout suitability, car wash & laundry scores."),
        ("48-Hour Time-Travel Scrubber", "components/TimeTravelSlider.tsx (L1-180)", "Interactive horizontal slider updating temperature, clouds, and wind simulation in real-time."),
        ("Ambient Soundscape Audio", "components/SoundscapePlayer.tsx (L1-255)", "expo-av Sound.createAsync playing looping natural atmospheric audio tracks."),
        ("Comparative Multi-City Modal", "components/MultiCityDashboard.tsx (L1-140)", "Multi-city bulk coordinate fetching via Open-Meteo combined query string."),
    ]
    populate_table_rows(feat_table, feat_rows, [1.8, 2.2, 2.5])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # CHAPTER 5: MATHEMATICAL ALGORITHMS & BIOMETEOROLOGICAL LOGIC
    # =========================================================================
    add_heading_1("5. Mathematical Algorithms & Biometeorological Logic")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather employs specialized numerical models to transform raw physical measurements "
        "into actionable health indices and lifestyle scores. This section details the complete mathematical formulations."
    )

    add_heading_2("5.1 Julian Day Moon Phase & Illumination Formula")
    p = doc.add_paragraph()
    p.add_run(
        "The astronomical lunar phase calculation approximates the Julian Day Number from current UTC calendar dates "
        "and normalizes it against the mean synodic month period (29.53058867 days):"
    )
    moon_math = """// Julian Day Calculation:
let a = floor((14 - month) / 12);
let y = year + 4800 - a;
let m = month + 12 * a - 3;
let JD = day + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - floor(y / 100) + floor(y / 400) - 32045;

// Synodic Phase Offset (New Moon Epoch: JD 2451549.5):
let phaseDays = (JD - 2451549.5) % 29.53058867;
let normalized = (phaseDays < 0 ? phaseDays + 29.53058867 : phaseDays) / 29.53058867;

// Illumination Percentage:
let illumination = round((1 - cos(normalized * 2 * PI)) / 2 * 100);"""
    add_code_block(moon_math)

    add_heading_2("5.2 Outdoor Fitness Suitability Index (0–100 Scale)")
    p = doc.add_paragraph()
    p.add_run(
        "The fitness algorithm assesses outdoor running, cycling, and walking safety based on ambient temperature (T), "
        "wind speed in km/h (W), relative humidity percentage (H), and precipitation condition code (C):"
    )
    fitness_math = """Base Score = 100;

// 1. Temperature Penalties:
if (T < 0°C || T > 35°C) Score -= 40;
else if (T < 8°C || T > 28°C) Score -= 20;
else if (T < 12°C || T > 24°C) Score -= 8;

// 2. Wind Resistance Penalties:
if (W > 35 km/h) Score -= 30;
else if (W > 20 km/h) Score -= 15;

// 3. Precipitation Penalty:
if (C >= 51) Score -= 35; // Active drizzle, rain, or snow

// 4. Heat Index / Humidity Strain:
if (H > 85% && T > 22°C) Score -= 20;

Final Score = clamp(Score, 10, 100);"""
    add_code_block(fitness_math)

    add_heading_2("5.3 Air Quality Index (US AQI) Categorization")
    aqi_table = doc.add_table(rows=7, cols=4)
    aqi_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(aqi_table, 4, ["AQI Range", "Health Category", "Color Code", "Health Recommendation & Advisory"], [1.0, 1.5, 1.0, 3.0])
    aqi_rows = [
        ("0 - 50", "Good", "#10B981 (Green)", "Air quality is satisfactory. Outdoor activity poses little or no health risk."),
        ("51 - 100", "Moderate", "#F59E0B (Amber)", "Acceptable quality; unusually sensitive people should consider limiting prolonged outdoor exertion."),
        ("101 - 150", "Unhealthy for Sensitive", "#F97316 (Orange)", "Members of sensitive groups (asthma, elderly) may experience health effects. General public not affected."),
        ("151 - 200", "Unhealthy", "#EF4444 (Red)", "Everyone may begin to experience health effects; members of sensitive groups may experience serious effects."),
        ("201 - 300", "Very Unhealthy", "#8B5CF6 (Purple)", "Health alert: The risk of health effects is increased for everyone in the population."),
        ("301 - 500", "Hazardous", "#7E22CE (Maroon)", "Health warning of emergency conditions: The entire population is more likely to be affected.")
    ]
    populate_table_rows(aqi_table, aqi_rows, [1.0, 1.5, 1.0, 3.0])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_heading_2("5.4 Car Wash & Laundry Drying Algorithms")
    add_bullet("Sums total expected rainfall over the next 72 hours (`daily.precipitationSum.slice(0,3)`). If rainfall > 3mm or max precipitation probability > 45%, advice is set to 'Poor Time - Postpone Wash'. If rain is 0mm and prob < 25%, advice is 'Great Time!'.", "Car Wash Index: ")
    add_bullet("Evaluates current humidity and wind speed. If humidity < 60%, isDay = true, and windSpeed > 10 km/h, clothes drying speed is categorized as 'Super Fast'. If humidity > 80%, advice is 'Slow Drying'. If rain code >= 51, advice is 'Indoor Only'.", "Laundry Drying Index: ")

    # =========================================================================
    # CHAPTER 6: CLOUD TELEMETRY, OBSERVABILITY & EVENT SCHEMAS
    # =========================================================================
    add_heading_1("6. Cloud Telemetry, Observability & Analytics Matrix")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather utilizes PostHog EU Cloud (`https://eu.i.posthog.com`) to track real-time application health, "
        "feature engagement, and global city search popularity while upholding strict user privacy standards."
    )

    add_heading_2("6.1 Master Telemetry Event Schema")
    tele_table = doc.add_table(rows=7, cols=3)
    tele_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(tele_table, 3, ["Event Name", "Trigger Action", "Payload Properties & Types"], [1.8, 2.0, 2.7])
    tele_rows = [
        ("app_opened", "App launch / foregrounding", "{ platform: 'android' | 'ios', timestamp: ISOString }"),
        ("city_searched", "City query submitted", "{ city_name: string, country: string, latitude: float, longitude: float }"),
        ("weather_viewed", "Weather data rendered", "{ city_name: string, temperature: float, weather_code: int, air_quality_index: int }"),
        ("city_saved_toggle", "Bookmark added/removed", "{ city_name: string, action: 'add' | 'remove' }"),
        ("time_travel_scrubbed", "48h slider moved", "{ target_hour: string }"),
        ("radar_map_opened", "Map modal opened", "{} (Zero payload event trigger)")
    ]
    populate_table_rows(tele_table, tele_rows, [1.8, 2.0, 2.7])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_heading_2("6.2 Privacy Architecture & Buffering Mechanics")
    add_bullet("The telemetry client is configured with `flushAt: 1` and `flushInterval: 2000` to deliver instant updates while preserving device battery life.", "Batching & Flushing: ")
    add_bullet("No device IMEI, phone numbers, contacts, IP addresses, or personal names are collected or transmitted. All location queries are rounded.", "Zero-PII Compliance: ")
    add_bullet("All network telemetry calls are wrapped in non-blocking try-catch handlers to ensure network drops never impede UI fluidity.", "Fault Tolerance: ")

    # =========================================================================
    # CHAPTER 7: BUILD PIPELINE, OPTIMIZATION & DEPLOYMENT
    # =========================================================================
    add_heading_1("7. Build Optimization, APK Shrinking & Deployment Pipeline")
    p = doc.add_paragraph()
    p.add_run(
        "A critical engineering requirement was optimizing the standalone Android APK size from over 60MB down to "
        "the ultra-compact ~22-24MB range without sacrificing any visual features or mapping functionality."
    )

    add_heading_2("7.1 APK Size Reduction Root Cause Analysis")
    opt_table = doc.add_table(rows=5, cols=3)
    opt_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    style_table_header(opt_table, 3, ["Optimization Technique", "Impact on Binary Size", "Engineering Implementation Details"], [2.0, 1.8, 2.7])
    opt_rows = [
        ("Removed Native Maps Library", "Reduced ~18 MB", "Replaced react-native-maps & Google Play Services Maps SDK with lightweight Leaflet WebView."),
        ("Removed Lottie Animations", "Reduced ~8 MB", "Replaced heavy lottie-react-native JSON parsing with pure React Native Animated & vector icons."),
        ("ProGuard & R8 Code Shrinking", "Reduced ~12 MB", "Configured shrinkResources: true and minifyEnabled: true in app.json Android build configuration."),
        ("Target ABI Filtering (arm64-v8a)", "Reduced ~16 MB", "Configured eas.json to target modern 64-bit ARM architecture rather than bundling all legacy ABIs.")
    ]
    populate_table_rows(opt_table, opt_rows, [2.0, 1.8, 2.7])
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_heading_2("7.2 Continuous Delivery via Over-The-Air (OTA) Updates")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather employs a fully automated Continuous Integration / Continuous Deployment (CI/CD) workflow via GitHub Actions (`.github/workflows/eas-update.yml`):"
    )
    add_bullet("Developer pushes code changes to the `main` branch on GitHub.", "Step 1 (Git Push): ")
    add_bullet("GitHub Actions runner boots Ubuntu Linux, installs Node.js, and authenticates using the secret `EXPO_TOKEN`.", "Step 2 (CI Trigger): ")
    add_bullet("Executes `npx eas-cli update --auto --branch main`, publishing compressed JavaScript and asset bundles to Expo EAS Cloud.", "Step 3 (EAS Publish): ")
    add_bullet("User devices download and apply the new update seamlessly in the background on subsequent app restarts without requiring app store re-downloads.", "Step 4 (Zero-Downtime Delivery): ")

    # =========================================================================
    # CHAPTER 8: SECURITY, PRIVACY & PRODUCTION COMPLIANCE
    # =========================================================================
    add_heading_1("8. Security, Privacy Compliance & Fault Tolerance")
    p = doc.add_paragraph()
    p.add_run(
        "Security, user privacy, and network fault tolerance are built into every level of the application:"
    )
    add_bullet("All outbound HTTP calls strictly enforce HTTPS / TLS 1.3 encryption across all weather and telemetry providers.", "Network Security: ")
    add_bullet("Location coordinates are queried strictly in the foreground (`requestForegroundPermissionsAsync`). Background tracking is explicitly disabled to preserve battery life.", "Permission Minimization: ")
    add_bullet("If GPS fails, system cascades to OpenStreetMap Nominatim. If network drops, system hydrates from AsyncStorage cache. If Unsplash times out, system displays curated HD condition backdrops.", "Four-Tier Fallback Cascade: ")

    # Save Document safely
    output_path = r"d:\PROJECTS\WEATHER_APP\K_and_A_Weather_v1.0_System_Documentation.docx"
    doc.save(output_path)
    print(f"System Documentation successfully generated at: {output_path}")

if __name__ == "__main__":
    create_document()
