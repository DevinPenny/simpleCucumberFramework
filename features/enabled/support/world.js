const webdriver = require('selenium-webdriver');
const remoteWebDriver = require('selenium-webdriver/remote');
const config = require('../../../package.json').config;
const {setWorldConstructor, setDefaultTimeout} = require('@cucumber/cucumber');
const frameworkData = require('../../../config/frameworkData');


const buildDriver = () => {

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
    let basicCapabilities = {
        browserName: config.browser.browserName,
        acceptSslCerts: true,
        cleanSession: true,
        javascriptEnabled: true,
        takesScreenshot: true,
    };


    const parallelTestBaseCapability = {
        "buildName": "BStack Build Number 1",
        "local": "false",
        "seleniumVersion": "4.0.0",
        "userName": process.env["BROWSERSTACK_USERNAME"] || "devinpenny_o8VUT5",
        "accessKey": process.env["BROWSERSTACK_ACCESS_KEY"] || "mUmAUpMqdxLwa2YYATj5"
    };

    let browserStackCapabilities = [
        {
            'bstack:options': {
                "os": "OS X",
                "osVersion": "Sierra",
                "sessionName": "Parallel test 1",
                ...parallelTestBaseCapability
            },
            "browserName": "Chrome",
            "browserVersion": "latest",
        },
        {
            'bstack:options': {
                "os": "OS X",
                "osVersion": "Sierra",
                "sessionName": "Parallel test 2",
                ...parallelTestBaseCapability
            },
            "browserName": "Safari",
            "browserVersion": "latest",
        },
        {
            'bstack:options': {
                "os": "windows",
                "osVersion": "11",
                "sessionName": "Parallel test 3",
                ...parallelTestBaseCapability
            },
            "browserName": "Chrome",
            "browserVersion": "latest",
        },
    ];

    /** Either use the grid or run locally. */
    if (config.grid.useGrid === true){
        return new webdriver.Builder()
            .withCapabilities(config.grid.gridType.toLowerCase() === 'browserstack' ? browserStackCapabilities : basicCapabilities)
            .usingServer(config.grid.gridType.toLowerCase() === 'browserstack' ? frameworkData.gridData.browserStackGrid : frameworkData.gridData.homeGrid)
            .build();

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
setDefaultTimeout(240*1000);
