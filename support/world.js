const webdriver = require('selenium-webdriver');
// const remoteWebDriver = require('selenium-webdriver/remote');
const config = require('../package.json').config;
const {setWorldConstructor, setDefaultTimeout} = require('@cucumber/cucumber');

/**
 * The world constructor object for cucumber
 *
 * Loaded by [Cucumber]{@link https://github.com/cucumber/cucumber-js} before the step definitions and feature files, `world` is responsible
 * for setting up and exposing various methods and properties required within the hooks, step definitions, and page objects.
 * For more info see [World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md}.
 *
 * @module world
 * @param webdriver
 * @param remote
 * @param config
 * @param cucumber
 */


/** Set the browser name to the one provided or the default. */
// config.browser = config.browser.browserName || {
//     name: config.browser.browserName.toLowerCase() || 'chrome',
// };

/** Set the browser configs to the one provided or the default empty. */
config.browser.chrome = config.browser.chrome || {args: []};
config.browser.firefox = config.browser.firefox || {args: []};

/** If we get an `unhandledRejection` error, just keep on truckin'! */
process.on('unhandledRejection', () => true);
process.on('rejectionHandled', () => true);

/**
 * Create an instance of a driver based on a parameter.
 *
 * @returns {promise}
 * @memberOf module:world
 */
const buildDriver = async () => {

    /**
     * Setup default browser capabilities.
     *
     * @property {object} capabilities - A browser `capabilities` object.
     * @property {string} capabilities.browserName=<config.browser.name> - The name of the browser.
     * @property {boolean} capabilities.acceptSslCerts=true - Whether the browser should accept SSL certificates.
     * @property {boolean} capabilities.cleanSession=true - Whether the browser should start with a clean user session.
     * @property {boolean} capabilities.javascriptEnabled=true - Whether the browser should enable JavaScript execution.
     * @property {boolean} capabilities.takeScreenshot=true - Whether the browser should allow screenshots to be taken.
     * @memberOf module:world
     */
    let capabilities = {
        browserName: config.browser.browserName,
        acceptSslCerts: true,
        cleanSession: true,
        javascriptEnabled: true,
        takesScreenshot: true,
    };
    /**
     * Command line arguments to be used when each browser is started.
     *
     * @property {object} devArgs - The arguments arrays for each browser type.
     * @property {array} devArgs.firefox=[] - The empty arguments array for the `Firefox` browser.
     * @property {array} devArgs.chrome=[] - The empty arguments array for the `Chrome` browser.
     */
    const devArgs = {
        firefox: [],
        chrome: [],
    };

    /** Set various command line arguments depending on if we want to run on the grid or locally. */
    if (config.grid.useGrid) {
        devArgs.firefox.push(
            // '-devtools',
            // '-headless',
        );
        devArgs.chrome.push(
            // '-auto-open-devtools-for-tabs',
            // '-headless',

        );
    } else {
        devArgs.chrome.push(
            // '-auto-open-devtools-for-tabs',
        );
    }

    /** Apply `capabilities` depending on which browser is being used. */
    switch (config.browser.browserName) {
        case 'firefox':
            capabilities = Object.assign(capabilities, {
                'moz:firefoxOptions': {
                    args: devArgs.firefox,
                },
            });
            break;
        default:
            capabilities = Object.assign(capabilities, {
                chromeOptions: {
                    args: devArgs.chrome,
                },
            });
            break;
    }

    /** Either use the grid or run locally. */
    if (config.grid.useGrid === true) {
        return await new webdriver.Builder().withCapabilities(capabilities).usingServer(config.grid.gridUrl + '/wd/hub').build();
    } else {
        return await new webdriver.Builder().withCapabilities(capabilities).build();
    }
};

/**
 * Create the world object and attach all of the required parameters to it.
 *
 * @constructor
 * @param {function} attach - The [Cucumber method]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/attachments.md} for attaching items to tests, like error messages and screenshots.
 * @param {object} parameters - Variables sent to Cucumber for use throughout the framework.
 * @property {object} config - The [config] instance passed throughout the framework.
 * @property {promise} driver - The [Selenium WebDriver]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html} used for testing, passed throughout the framework.
 * @property {function} setDefaultTimeout - Sets the page load timeout used throughout the framework.
 * @memberOf module:world
 */
function CustomWorld({attach, parameters}) {
    Object.assign(config, parameters);
    this.attach = attach;
    this.config = config;
    this.driver = buildDriver();
    // this.driver.setFileDetector(new remoteWebDriver.FileDetector());
    this.app = config.test.application;
    this.environment = config.test.environment;
    //Load Environment Data
    this.envData = {...require(`${process.cwd()}/data/environmentData.js`)[config.test.environment]};
}

/** Constructor to allow browser object to be shared with other classes. */
setWorldConstructor(CustomWorld);

/** After we have created world, set the default timeout for all steps. */
setDefaultTimeout(240*1000);
