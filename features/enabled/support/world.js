const webdriver = require('selenium-webdriver');
const remoteWebDriver = require('selenium-webdriver/remote');
const config = require('../../../package.json').config;
const {setWorldConstructor, setDefaultTimeout} = require('@cucumber/cucumber');
const frameworkData = require('../../../config/frameworkData');


const buildDriver = () => {

    /**
     * Setup default browser and local/grid capabilities.
     *
     * @property {object} capabilities - A browser `capabilities` object.
     * @property {string} capabilities.browserName=<config.browser.name> - The name of the browser.
     * @property {boolean} capabilities.acceptSslCerts=true - Whether the browser should accept SSL certificates.
     * @property {boolean} capabilities.cleanSession=true - Whether the browser should start with a clean user session.
     * @property {boolean} capabilities.javascriptEnabled=true - Whether the browser should enable JavaScript execution.
     * @property {boolean} capabilities.takeScreenshot=true - Whether the browser should allow screenshots to be taken.
     * @memberOf module:world
     */
    let basicCapabilities = {
        browserName: config.browser.browserName,
        acceptSslCerts: true,
        cleanSession: true,
        javascriptEnabled: true,
        takesScreenshot: true,
    };

    //TODO: implement parameters from command line to setup test configurations.
    // need a profile loading system to provide os, browser, and versions
    const browserStackCapabilities = {
        'bstack:options': {
            "os": "OS X",
            "osVersion": "Big Sur",
            "buildName": "browserstack-build-1",
            "sessionName": "Parallel test 3",
        },
        browserName: "chrome",
        browserVersion: "104.0",
    }

    /** Either use a grid or run locally. */
    if (config.grid.useGrid === true) {

        switch (config.grid.gridType.toLowerCase()) {
            case 'browserstack':
                return new webdriver.Builder()
                    .usingServer(frameworkData.gridData.browserStackGrid)
                    .withCapabilities({
                        ...browserStackCapabilities,
                        ...browserStackCapabilities['browserName'] && {browserName: browserStackCapabilities['browserName']}  // Because NodeJS language binding requires browserName to be defined
                    })
                    .build();
            case 'homegrid':
                return new webdriver.Builder().withCapabilities(basicCapabilities).usingServer(config.grid.homeGrid).build();
            default:
                return new webdriver.Builder().withCapabilities(basicCapabilities).build();
        }

    } else {
        return new webdriver.Builder().withCapabilities(basicCapabilities).build();
    }
};


/**
 * The world constructor object for cucumber
 *
 * Loaded by [Cucumber]{@link https://github.com/cucumber/cucumber-js} before the step definitions and feature files, `world` is responsible
 * for setting up and exposing various methods and properties required within the hooks, step definitions, and page objects.
 * For more info see [World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md}.
 *
 * @constructor
 * @param {function} attach - The [Cucumber method]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/attachments.md} for attaching items to tests, like error messages and screenshots.
 * @param {object} parameters - Variables sent to Cucumber for use throughout the framework.
 * @property {object} config - The [config] instance passed throughout the framework.
 * @property {!ThenableWebDriver} driver - The [Selenium WebDriver]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html} used for testing, passed throughout the framework.
 * @property {function} setDefaultTimeout - Sets the page load timeout used throughout the framework.
 */
function CustomWorld({attach, parameters}) {
    Object.assign(config, parameters);
    this.attach = attach;
    this.config = config;
    this.driver = buildDriver();
    this.driver.setFileDetector(new remoteWebDriver.FileDetector());
    this.application = config.test.application;
    this.environment = config.test.environment;
    //Load Environment Data
    this.envData = {...require(`${process.cwd()}/data/environmentData.js`)[config.test.environment]};
}

/** Constructor to allow browser object to be shared with other classes. */
setWorldConstructor(CustomWorld);

/** After we have created world, set the default timeout for all steps. */
setDefaultTimeout(240 * 1000);
