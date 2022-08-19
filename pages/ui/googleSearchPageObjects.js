const driver = require('selenium-webdriver');
const {By} = driver;
const Page = require('../../pages/uiBaseObjects');


/**
 * locators used to identify elements on a page
 * @type {{loginError: !By}}
 */
const elements = {
    pageErrors: By.css('.error'),
    searchField: By.css('input[name="q"]'),
    searchButton: By.css('input[value*="Google Search"]'),
    luckyButton: By.css('input[value*="Lucky"]')
};

/**
 * Provides methods used on the application login page.
 *
 * @module signInPageObjects
 */
module.exports = {
    /**
     * enters search text into any input field on the google search page
     * @param world
     * @param {string} value - the value to enter into the field
     * @param {string} field - the named locator of the field you want to enter text into
     * @returns {Promise<void>}
     */
    enterSearchValue: async (world, value, field) => {
        await Page.enterText(world, value, elements[`${field}Field`], false, `Unable to enter ${value} in the ${field} field!`);
    },

    /**
     * Clicks on any located button on the Google search page.
     * @param world
     * @param {string} button - the elements name of the locator of the button you wish to click on.
     * @returns {Promise<void>}
     */
    clickGoogleSearchButton: async (world, button = 'search') => {
        await Page.clickElement(world, elements[`${button}Button`], true, `Unable to click on the ${button} button on the google search page!`);

        //wait a moment for the page to do what it needs to do
        await Page.waitSeconds(world, .5);

        //check for an error
        const errors = await Page.getElementCount(world, elements.pageErrors);

        if (errors > 0) {
            const errorMessage = await Page.getText(world, elements.pageErrors);
            throw new Error(`Could not do the thing, got error: ${errorMessage}`);
        }
    }
};