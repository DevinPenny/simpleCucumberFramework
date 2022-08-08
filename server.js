const nodePackage = require('./package.json');
const config = nodePackage.config;
const {execSync} = require('child_process');
const path = require('path');
const working = path.dirname(process.argv[1]);
const fs = require('fs');
const {get} = require('lodash');
const decodeToken = require('jwt-decode');
const timestamp = require('moment')().format('MM-DD-HHmm');
const {each} = require('lodash');

const argopts = require('yargs').option({
    'tags': {type: 'array', desc: 'Enter multiple tags to run multiple tests'},
}).argv;

const launchReport = argopts.hasOwnProperty('launchReport') ? (/true/i).test(argopts.launchReport) : undefined;

const axios = require('axios');

const multiReporter = require('./reports/multiReporter');

/** declare the world variable which is used to share data to all parallel tests, many things are assigned to world for UI tests
 including user and password information, testRail project information*/
let world;

/**create a properly formatted string of tags to run cucumber with. Proper format: --tags '(@TEST1 or @TEST2)' */
let tagString;
if (argopts.hasOwnProperty('tags')) {

    tagString = '--tags \'(';
    for (let i = 0; i < argopts.tags.length; i++) {
        tagString = tagString + argopts.tags[i];

        if (i < (argopts.tags.length - 1)) {
            tagString = tagString + ' or '
        }
    }
    tagString = tagString + ')\''
}

/** apply any command line argument option overrides. */
Object.assign(config, argopts);
config.browser = config.browser || {};
config.reporter = config.reporter || {};


/** determine if we want to run on the grid, or locally */
config.grid.useGrid = argopts.grid ? argopts.grid : config.grid.useGrid;

/** determine what environment we want to run on, qa, uat, prod */
config.test.environment = argopts.environment ? argopts.environment : config.test.environment;

/** allow the ability to override closing the browser from command line*/
config.browser.closeOnFail = argopts.closeOnFail ? argopts.closeOnFail : config.browser.closeOnFail;

config.reporter.metadata = Object.assign(config.reporter.metadata || {}, {
    'App Version': nodePackage.version,
    'Product Tested': config.test.application.toUpperCase(),
    'Environment Tested': config.test.environment.toUpperCase(),
    'Browser': config.browser.browserName.replace(/.*/, (name) => name[0].toUpperCase() + name.substr(1).toLowerCase()) || 'Chrome',
});

config.reporter.launchReport = launchReport || config.reporter.launchReport;


/** The debugging port being used if `config.debug === true`.*/
let debug = '';

/** If we're in `--debug` mode delete the `--parallel` option so we can connect to the debugger and make sure to turn on debug mode for Node. */
if (config.debug) {
    delete config.grid.parallel;
    debug += 'node --inspect=22772 ';
}

/** Setup an array to generate `--switch value` pairs for each command line option.*/
const keys = [];
if (config.grid.parallel) keys.push('parallel');
if (config.debug) keys.push('debug');


if (argopts.testrail) {
    console.info('Updating testRail based on command line input testrail = true');
    config.testRail.updateTestRail = argopts.testrail;
}

/** ensure that we do not run locally with too many parallels **/
if (config.grid.useGrid) {
    console.info('Setting close on fail to true so we close browsers on the grid');
    config.browser.closeOnFail = true;
}

/** Concatenate all of the command line options into a single string.*/
let args = '';

/** Step through each argument... */
each(keys, (key) => {
    /** ...and create the `--switch value` pair for each. */
    if (key === 'parallel') {
        args += `--${key} ${config.grid[key]} `;
    } else {
        args += `--${key} ${config[key]} `;
    }

});


/** this is an ugly way to append the tagString into the full command run later */
if (tagString) {
    args += tagString;
}


/**configure the report format as well as the path to where it is saved after cucumber finishes. */
const reportPath = './reports';

/**Create a project folder if it does not exist to store the generated json report */
if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath);
}

const reportFormat = `json:${reportPath}/json/results.json`;

/** check value for executing the report, should be false if cucumer does not execute first*/
let executeReport;

async function authUsers(environment) {

    const authData = require('./data/environmentData');
    config.users = get(authData, `${environment}.users`);
    let authURL;
    let creds;
    let res;

    /**create an instance of Axios called session to share with all tests.*/
    const session = await axios.create({
        baseURL: authData[environment].apiDomain,
        timeout: 25000,
        validateStatus: (status) => status >= 200,
        headers: {'Content-Type': 'application/json'}
    });

    for (const user of Object.keys(config.users)) {

        if (!config.users[user].skipEnv.includes(environment)) {
            //If we have an api key, use it, else use UN/PW
            if (config.users[user].apiKeys[environment] === '') {
                authURL = '/security/v1/authenticate';
                creds = {
                    username: get(config.users, `${user}.id`),
                    password: get(config.users, `${user}.pass`),
                    application: config.application,
                };
            } else {
                authURL = '/security/v1/apiKey/authenticate';
                creds = {
                    'value': get(config.users, `${user}.apiKeys${environment}`)
                };
            }

            try {
                res = await session({
                    url: authURL,
                    method: 'post',
                    data: creds
                });

                // await console.log(`user: ${user}` + JSON.stringify(res.data));
                if(res.status !== 200){
                    console.info(`\n\tERROR: Unable to authorize user ${user}\n`);
                    console.info('\t' + res.data.message);
                    process.exit(1);
                }

            } catch (e) {
                console.info(`\t${user} auth FAILED: ${e}`);
            }

            if (res.data.token === '') {
                console.info(`\t${user} auth request failed! ${res.status}:${res.statusText}`);
            } else {

                if (res.data.resetPassword) {
                    console.info(`\t${user} password reset required! Stopping test execution until all users have updated passwords!`);
                    process.exit(1);
                }

                console.info(`\t${user} auth request complete`);
                config.users[user].token = res.data.token;
                config.users[user].domainId = decodeToken(res.data.token).domain.id;

            }

            config.users[user].token = res.data.token;
            config.users[user].domainId = decodeToken(res.data.token).domain.id;
        } else {
            console.info(`\tSkipping auth for ${user} due to environment rules`);
        }

    }

}

async function startCucumber() {

    /** display runtime options for cucumber in terminal */
    console.info('\nExecuting cucumber tests with runtime options:\n');

    Object.keys(config).forEach((key) => {
        if (typeof config[key] !== 'object') {
            if (config[key] !== 'server.js') {
                console.info(`\t${key} = ${config[key]}`);
            }
        }
        if (key === 'tags') {
            console.info(`\t${key} = ${config.tags.toString()}`);
        }
    });

    if (config.browser) {
        Object.keys(config.browser).forEach((browserKey) => {
            console.info(`\t${browserKey} = ${config.browser[browserKey]}`);
        });
    }


    /**get user tokens to share with all browsers before test execution. */
    if (config.test.preAuth) {
        try {
            console.info('\n\tGenerating auth tokens for users...');
            await authUsers(config.test.environment);
            console.info('\tAll tokens ready');

        } catch (e) {
            console.log(e);
            process.exit(1);
        }
    }

    /**if we are integrating with TestRail, then get the project ID and add it to the world object*/
    if (config.testRail.updateTestRail) {
        await getTestRailData();
    } else {
        /** create the world object to share with any parallel browsers */
        console.info(`Skipping test rail integration steps. config.testRail.updateTestRail = ${config.testRail.updateTestRail}`)
        world = JSON.stringify(config);
    }


    /**create and execute the cucumber command */
    const command = `${debug}./node_modules/.bin/cucumber-js ` +
        `--require ${working}/features/enabled ` +
        `--format ${reportFormat} ${working}/features/enabled ` +
        `--retry ${config.test.retry} ` +
        `--world-parameters '${world}' ` +
        '--publish-quiet ' +
        args;

    //for debugging
    // console.log('COMMAND ' + command);

    try {
        process.exitCode = 0;
        execSync(command, {stdio: 'inherit'});

    } catch (e) {
        process.exitCode = 1;
    }

    executeReport = true;
    console.info(`\ndone`)
    process.exit(process.exitCode);
}

/**
 * Create the cucumber HTML report, derived from the JSON output of the cucumber execution step.
 * @returns {Promise<void>}
 */
async function reportCucumber() {
    if(executeReport){
        if (config.reporter.launchReport === true) {
            if (config.reporter.reportType === 'multi') {
                await multiReporter.reporter(config, timestamp, working);
            } else {

                try {
                    /**execute the single report command */
                    const command = `${working}/reports/reporter ` +
                        `--timestamp ${timestamp} ` +
                        `--config '${JSON.stringify(config)}'`  //<-- pass the config object to report.js

                    execSync(command, {stdio: 'inherit'});

                    //I put a blank line here because it makes terminal look better
                    console.info('\n');
                } catch (e) {
                    console.info(`Unable to generate HTML report due to errors! ${e} \n`);
                    throw e;
                }
            }
        }
    }

}


/** get the test rail project data and append into the config object, then convert config into a string to be used as part of cucumber world parameters*/
async function getTestRailData() {

    const testRailSupport = require('testrail-api');

    console.info(`\tConnecting to Test Rail for project data.`)

    /** Get test rail project information and determine the project id */
    const project = await testRailSupport.getProjects(config);

    //TODO: if we want to use an existing run we need to implement a way to identify that run, find the ID, and skip getSections, getCases, addRun.
    //instead we will just want to identify all of the cases in the run so we can determine if we want to create a new test or not.

    /** Get the test sections to get a list of all tests in the automation folder*/
    const sections = await testRailSupport.getSections(config);

    /** get all cases assigned to the run*/
    const cases = await testRailSupport.getCases(config);

    /** add a test run to the suite*/
    await testRailSupport.addRun(config);

    /** Append all of the project and case information from config into world as a string so that we can pass it into cucumber */
    world = JSON.stringify(config);

    console.info('\n\tTest Rail project data setup complete!\n');
}

//provide a means to create the test report after execution.
process.on('exit', async function (code) {
    config.totalExecutionTime = new Date(process.uptime() * 1000).toISOString().substr(11, 8);
    console.info(`Process exit code = ${code}`);
    console.info(`Cucumber execution completed with total execution time = ${config.totalExecutionTime}`);

    await reportCucumber();
});

/** DO all the things! */
startCucumber();
