const driver = require('selenium-webdriver');
const {By} = driver;
const get = require('lodash/get');
const Page = require('../../pages/baseObjects');

/**
 * The purpose of element map, is to give easy names to identify elements. This map has to
 * be used with the wrapper functions found in Page.locators.
 *
 * @type {{passField: string, landingPage: string, nameField: string, signInButton: string}}
 */
const elementMap = {
    signInButton: 'user_login_submit',
    nameField: 'userName',
    passField: 'password',
    landingPage: 'some-locator',
};

/**
 * elements is used to identify elements on a page by a specific locator, and does not need to be used with Page.locators
 * @type {{loginError: !By}}
 */
const elements = {
    loginError: By.css('.error'),
};

/**
 * Provides methods used on the application login page.
 *
 * @module signInPageObjects
 */
module.exports = {
    /**
     * Navigate to the passport login page (admin or subscriber) and sign in as a user
     *
     * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
     * @param {string} page - The HTML page to visit. Either admin or subscriber
     * @param {string} account - The user to log in with.
     * @param {string} title - title of the page
     * @return {Promise} The result of the [navigateToPage] method.
     */
    navigateToLogin: async (world, page, account, title = 'Passport Portal') => {
        await Page.navigateToPage(world, `${world.envData[page]}`, title, 3);
        await Page.enterText(world, Page.locators.byId(elementMap.nameField), get(world.envData, `users.${account}.id`, ''));
        await Page.enterText(world, Page.locators.byId(elementMap.passField), get(world.envData, `users.${account}.pass`, ''));
        await Page.clickElement(world, Page.locators.byId(elementMap.signInButton));

        //TODO: check for error when logging in
        // await Page.clickElement(world, Page.locators.byId(elementMap.signInButton)).then(() => {
        //     return Page.waitToBeVisible(world, elements.loginError, '', 3000, 3000).then((saveFailed) => {
        //         return saveFailed.getText().then((errorMessage) => {
        //             return Promise.reject(Error(`An error occurred when attempting to log in: ${errorMessage}`));
        //         });
        //     });
        // })
    },

    /**
     * Uses the [navigateToPage]{@link module:baseObjects.navigateToPage} method to load the login page, then authenticates using the API and sets a `user` cookie with the generated token.  Finally, refresh the page so the authentication cookie is read, and the app finally loads the default user page.
     *
     * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
     * @param {string} account - The account being used for the test.
     * @param {string} title - The HTML page title expected.
     * @param {boolean} ignoreUrl - set to true if you want to skip the url check.
     * @return {Promise} The result of the [navigateToPage]{@link module:baseObjects.navigateToPage} method.
     */
    async authenticateWithToken(world, account, title, ignoreUrl = false) {
        await Page.navigateToPage(world, get(world.envData, 'domain', '') + '/login', title, 1, ignoreUrl);
        //store the account info in world so we can use it later
        world.account = account;

        if (world.config.users[account].noTest) {
            await Page.rejectStep(world, new SkippedError(`Test skipped because user account ${account} is not configured to authenticate in the ${world.config.target} environment`))
        }

        await world.driver.manage().addCookie({
            name: 'user',
            value: JSON.stringify({
                username: account,
                token: world.config.users[account].token,
                mustChangePassword: false,
            }),
            expiry: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        });

        //If the page takes too long to load after logging in, increase the wait here.
        await Page.refreshPage(world);
    },

    /**
     * wait for a number of seconds
     * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
     * @param seconds {string/number} - the number of seconds to wait
     * @returns {Promise<void>}
     */
    waitSeconds: async (world, seconds = 10) => {
        await Page.waitSeconds(world, seconds)
    },

};