// Test script to be run in browser console
console.log('🧪 Testing Planetary Scale Controls');

// Function to click buttons and observe scale changes
function testScaleButtons() {
    const buttons = {
        'City': document.querySelector('button:contains("City")'),
        'Metro': document.querySelector('button:contains("Metro")'),
        'Region': document.querySelector('button:contains("Region")',
        'Country': document.querySelector('button:contains("Country")',
        'Continental': document.querySelector('button:contains("Continental")',
        'Global': document.querySelector('button:contains("Global")'
    };

    // Test each scale
    Object.entries(buttons).forEach(([name, button], index) => {
        setTimeout(() => {
            if (button) {
                console.log(`🔄 Testing ${name} scale...`);
                button.click();

                // Check if scale changed
                setTimeout(() => {
                    const scaleDisplay = document.querySelector('.planetary-controls');
                    console.log(`✅ ${name} scale active`, scaleDisplay?.textContent);
                }, 500);
            } else {
                console.log(`❌ ${name} button not found`);
            }
        }, index * 2000); // 2 second delay between clicks
    });
}

// Alternative method using CSS selectors
function testScaleButtonsDirect() {
    const planetaryControls = document.querySelector('[style*="680px"]'); // Find planetary controls
    if (planetaryControls) {
        const buttons = planetaryControls.querySelectorAll('button');
        console.log('🎮 Found buttons:', buttons.length);

        buttons.forEach((button, index) => {
            setTimeout(() => {
                console.log(`🔄 Clicking button: ${button.textContent}`);
                button.click();
            }, index * 1500);
        });
    } else {
        console.log('❌ Planetary controls not found');
    }
}

// Run the test
testScaleButtonsDirect();

// Export for manual use
window.testPlanetaryScale = testScaleButtonsDirect;