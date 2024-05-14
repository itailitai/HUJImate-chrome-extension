

# HUJInsight Chrome Extension

![HUJInsight Moodle](assets/moodlelogo.png)


## Overview

The HUJInsight Chrome Extension is designed to enhance the user experience on the HUJInsight website. This extension allows users to save their when visiting HUJInsight, facilitating seamless integration for sharing courses via the HUJI Personal Information website. Additionally, it provides functionality to interact with HUJInsight's Moodle platform, simplifying navigation and improving overall UI.

## Features

1. **Token Handling**: 
   - Automatically retrieves and saves tokens when visiting the HUJInsight website.

2. **Custom Button Integration**:
   - Adds a "שתפו ציונים ב-HUJInsight" button on the HUJI grades page to facilitate easy grade sharing.

3. **Moodle Interaction**:
   - Enhances the Moodle experience by dynamically fetching and replacing content, adding a custom scrolling menu for better navigation, and modernizing the UI.

4. **Loading Overlays**:
   - Provides visually appealing loading overlays during data fetching processes for a better user experience.

## Installation

1. Clone or download the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the folder containing the extension files.

## Files

- **manifest.json**: Defines the extension's properties and permissions.
- **background.js**: Handles background tasks and listeners.
- **contentScript.js**: Runs in the context of the HUJI Personal Information webpage to inject custom button for grade sharing.
- **popup.js**: Manages the extension's popup UI.
- **hujinsight.js**: Contains functions to grab the token when visiting HUJInsight.
- **moodle-script.js**: Enhances Moodle platform functionality.

## Usage

1. **Saving JWT Token**:
   - Upon navigating to the HUJInsight website, the extension will automatically retrieve the JWT token from local storage and save it for future use.

2. **Sharing Grades**:
   - On the HUJInsight grades page, a custom button labeled "שתפו ציונים ב-HUJInsight" will appear. Click this button to share your grades. If not logged in, an alert will prompt you to log in first.

3. **Moodle Enhancements**:
   - The extension will enhance the Moodle interface by dynamically fetching content, replacing images, and adding a custom scrolling menu for easier navigation.


## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Feel free to customize the README further to suit your specific needs.
