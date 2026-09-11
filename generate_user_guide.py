import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_user_guide():
    doc = Document()

    # Set 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Color Palette
    COLOR_PRIMARY = RGBColor(26, 54, 93)      # Deep Navy #1A365D
    COLOR_SECONDARY = RGBColor(14, 116, 144)  # Ocean Blue #0E7490
    COLOR_ACCENT = RGBColor(217, 119, 6)      # Amber #D97706
    COLOR_DARK = RGBColor(30, 41, 59)         # Slate 800 #1E293B
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 #64748B
    COLOR_BG_LIGHT = "F8FAFC"
    COLOR_PRIMARY_HEX = "1A365D"
    COLOR_SECONDARY_HEX = "0E7490"
    COLOR_BORDER_HEX = "CBD5E1"
    COLOR_CALLOUT_BORDER = "38BDF8"

    # Base Styles
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
        p.paragraph_format.space_before = Pt(28)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.size = Pt(26)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(20)
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.italic = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.bold = True
            run_b.font.color.rgb = COLOR_DARK
        p.add_run(text)
        return p

    def add_tip_box(text, title="PRO TIP"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_shading(cell, COLOR_BG_LIGHT)
        set_cell_margins(cell, 100, 100, 140, 140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run_t = p.add_run(f"💡 {title}: ")
        run_t.font.bold = True
        run_t.font.color.rgb = COLOR_SECONDARY
        p.add_run(text)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def add_screenshot_placeholder(caption, height_in=3.2):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(5.8)
        set_cell_shading(cell, "F1F5F9")
        set_cell_margins(cell, 180, 180, 180, 180)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(4)
        
        run_icon = p.add_run("📸 [INSERT SCREENSHOT HERE]\n")
        run_icon.font.bold = True
        run_icon.font.color.rgb = COLOR_MUTED
        run_icon.font.size = Pt(11)

        run_cap = p.add_run(caption)
        run_cap.font.italic = True
        run_cap.font.color.rgb = COLOR_SECONDARY
        run_cap.font.size = Pt(10)
        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------
    # DOCUMENT COVER & OVERVIEW
    # -------------------------------------------------------------
    add_title("K & A Weather App — User Guide")
    add_subtitle("Step-by-Step Instructions, Feature Walkthroughs & Troubleshooting")

    add_tip_box(
        "Welcome to K & A Weather! This guide is designed to help you install, customize, and get the most out of your real-time meteorological intelligence application.",
        "WELCOME"
    )

    # -------------------------------------------------------------
    # 1. INSTALLATION & SETUP
    # -------------------------------------------------------------
    add_heading_1("1. Installation & Initial Setup (Android)")
    p = doc.add_paragraph()
    p.add_run("Follow these quick steps to install the app on any Android device:")

    add_bullet("Click the download link provided by the app administrator (e.g., https://tinyurl.com/ka-weather or the GitHub Releases link).", "Step 1 (Download): ")
    add_bullet("If your phone displays 'File might be harmful', tap 'Download anyway'. This is a standard Android prompt for apps downloaded outside Google Play.", "Step 2 (Bypass Warning): ")
    add_bullet("Once downloaded, tap the notification or open the file in your phone's 'Downloads' folder and tap 'Install'.", "Step 3 (Install): ")
    add_bullet("When opening the app for the first time, tap 'Allow' when prompted for Location permissions so the app can automatically detect your local weather.", "Step 4 (Grant Permissions): ")

    add_screenshot_placeholder("Figure 1: Initial App Launch & Location Permission Prompt")

    # -------------------------------------------------------------
    # 2. MAIN SCREEN & LIVE TELEMETRY
    # -------------------------------------------------------------
    add_heading_1("2. Main Dashboard & Live Telemetry")
    p = doc.add_paragraph()
    p.add_run("The main screen gives you an immediate, comprehensive overview of current atmospheric conditions:")

    add_bullet("Displays current temperature, 'Feels Like' apparent temperature, and dynamic weather condition description.", "Main Temperature Hero: ")
    add_bullet("An intelligent meteorologist summary that provides natural language recommendations based on today's rain probability, wind, and humidity.", "AI Weather Narrative: ")
    add_bullet("Displays high/low temperature comparison relative to yesterday, keeping you prepared for temperature drops or heat waves.", "Yesterday vs Today Delta: ")
    add_bullet("Dynamic photographic backgrounds automatically update to match the searched city and current weather conditions.", "Adaptive City Backdrops: ")

    add_screenshot_placeholder("Figure 2: Main Home Dashboard with Temperature Hero & AI Narrative")

    # -------------------------------------------------------------
    # 3. SEARCHING FOR CITIES & SAVING FAVORITES
    # -------------------------------------------------------------
    add_heading_1("3. Searching for Cities & Managing Favorites")
    p = doc.add_paragraph()
    p.add_run("You can explore weather for any city, town, or village globally:")

    add_bullet("Tap the top search bar, type at least 2 letters of any city or country (e.g., 'London', 'Kampala', 'Tokyo'), and select your location from the instant dropdown.", "Searching a City: ")
    add_bullet("Tap the GPS Location button next to the search bar to immediately return to your live physical GPS location.", "Return to Current Location: ")
    add_bullet("Tap the Star (★) icon next to the city name to save it to your favorite quick-access list.", "Bookmarking Favorites: ")
    add_bullet("Saved cities appear in the horizontal quick bar below the search bar for one-tap switching.", "Quick Switching: ")
    add_bullet("Tap the 'Compare' button to view a side-by-side weather dashboard of all your saved cities at once.", "Multi-City Comparison: ")

    add_screenshot_placeholder("Figure 3: Searching for a City with Instant Dropdown Suggestions")
    add_screenshot_placeholder("Figure 4: Saved Cities Quick-Bar & Multi-City Compare Modal")

    # -------------------------------------------------------------
    # 4. 24-HOUR TIME TRAVEL SIMULATION
    # -------------------------------------------------------------
    add_heading_1("4. Interactive 24-Hour Time-Travel Scrubber")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather includes an interactive time-travel simulation tool. "
        "Drag the horizontal slider across the 24-hour timeline to preview how temperature, precipitation chance, and day/night sky lighting will evolve throughout the day."
    )

    add_tip_box("To exit time-travel preview mode and return to real-time live data, simply tap anywhere on the main temperature hero card.", "RESET TIME-TRAVEL")

    add_screenshot_placeholder("Figure 5: 24-Hour Time-Travel Forecast Slider in Action")

    # -------------------------------------------------------------
    # 5. BIOMETEOROLOGY, AIR QUALITY & POLLEN HUB
    # -------------------------------------------------------------
    add_heading_1("5. Biometeorological Health & Pollen Hub")
    p = doc.add_paragraph()
    p.add_run("Protect your health with integrated environmental telemetry:")

    add_bullet("Monitors European Air Quality Index (AQI) with color-coded safety tiers (Good, Moderate, Unhealthy).", "European AQI Rating: ")
    add_bullet("Live tracking of fine particulates (PM2.5), coarse dust (PM10), Nitrogen Dioxide (NO2), and Surface Ozone (O3).", "Particulate Breakdown: ")
    add_bullet("Botanical pollen index for Grass, Birch tree, and Ragweed pollen to help allergy and asthma sufferers plan outdoor activities.", "Allergy & Pollen Alerts: ")
    add_bullet("Peak solar radiation tracking with dermatological sun protection recommendations.", "UV Index Rating: ")

    add_screenshot_placeholder("Figure 6: Air Quality, Pollen Counts & Health Advisories")

    # -------------------------------------------------------------
    # 6. LIVE PRECIPITATION RADAR MAP
    # -------------------------------------------------------------
    add_heading_1("6. Live Precipitation Radar & Storm Spotter")
    p = doc.add_paragraph()
    p.add_run("Track incoming rain, snow, and storms in real time:")

    add_bullet("Scroll down to the 'Live Precipitation Radar' card and tap 'Interactive Weather Map'.", "Opening Radar: ")
    add_bullet("Pinch to zoom in or pan across neighboring districts and countries.", "Navigation: ")
    add_bullet("The map displays high-definition radar satellite loops showing storm movements over the past 2 hours and upcoming 30-minute nowcasts.", "Radar Loop: ")

    add_screenshot_placeholder("Figure 7: Interactive RainViewer Radar Satellite Map")

    # -------------------------------------------------------------
    # 7. GENERATING & SHARING WEATHER CARDS
    # -------------------------------------------------------------
    add_heading_1("7. Sharing Weather Reports with Friends")
    p = doc.add_paragraph()
    p.add_run("You can generate and share sleek, high-definition weather graphic cards to WhatsApp, Instagram, Twitter/X, or SMS:")

    add_bullet("Tap the Share icon in the top control bar.", "Step 1: ")
    add_bullet("The app generates an aesthetic snapshot of your current city, temperature, condition, and backdrop.", "Step 2: ")
    add_bullet("Tap 'Share Forecast' to send the card directly via your favorite social or messaging app.", "Step 3: ")

    add_screenshot_placeholder("Figure 8: High-Definition Weather Card Ready for Sharing")

    # -------------------------------------------------------------
    # 8. SETTINGS & PREFERENCES
    # -------------------------------------------------------------
    add_heading_1("8. Settings & Customization")
    p = doc.add_paragraph()
    p.add_run("Tap the Settings (⚙️) gear icon in the top control bar to customize your app experience:")

    add_bullet("Switch between Celsius (°C) and Fahrenheit (°F).", "Temperature Units: ")
    add_bullet("Switch between Kilometers per hour (km/h) and Miles per hour (mph).", "Wind Speed Units: ")
    add_bullet("Toggle between 12-Hour (AM/PM) and 24-Hour military time format.", "Time Format: ")
    add_bullet("Toggle between Dark Glassmorphism and Light Sky visual themes.", "App Theme: ")

    add_screenshot_placeholder("Figure 9: Settings & Preferences Modal")

    # -------------------------------------------------------------
    # 9. TROUBLESHOOTING & FAQ
    # -------------------------------------------------------------
    add_heading_1("9. Frequently Asked Questions (FAQ)")

    add_heading_2("Q: The app says 'Location permission denied'. How do I fix it?")
    p = doc.add_paragraph()
    p.add_run("Go to your phone's Settings > Apps > K & A Weather > Permissions > Location, and set it to 'Allow while using the app'. Alternatively, you can always search for any city manually using the top search bar.")

    add_heading_2("Q: Does the app work when I am offline?")
    p = doc.add_paragraph()
    p.add_run("Yes! The app automatically caches the most recent weather report. If you open the app without an internet connection, it will display the cached forecast along with an 'Offline Cache' indicator.")

    add_heading_2("Q: How do I receive app updates? Do I need to re-download the app?")
    p = doc.add_paragraph()
    p.add_run("No re-downloading is required! K & A Weather features automatic Over-The-Air (OTA) background updates. Whenever a new feature or improvement is published by the developer, the app silently downloads the update in the background. Simply open or refresh the app, and you will instantly have the latest version.")

    output_path = r"d:\PROJECTS\WEATHER_APP\K_and_A_Weather_User_Guide.docx"
    try:
        doc.save(output_path)
        print(f"User Guide successfully created at: {output_path}")
    except PermissionError:
        output_path_alt = r"d:\PROJECTS\WEATHER_APP\K_and_A_Weather_User_Guide_Updated.docx"
        doc.save(output_path_alt)
        print(f"Original file was open in Word. Updated User Guide successfully created at: {output_path_alt}")

if __name__ == "__main__":
    create_user_guide()
