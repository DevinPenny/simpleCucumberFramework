const cucumber = require('@cucumber/cucumber');
const testRail = require('../../../support/testRailObjects');
const {Before, After, AfterAll, Status} = cucumber;
const config = require('../../../package.json').config;

/**
 * Hooks are used for setup and teardown of the environment before and after each scenario.
 *
 * - Multiple **Before** hooks are executed in the order that they were defined.
 * - Multiple **After** hooks are executed in the reverse order that they were defined.
 *
 * For more information on hooks see [Hooks JS]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/hooks.md}.
 *
 * @module hooks
 */


/** Before scenario to designate specific tests as skipped. This prevents test execution and does not set a failure in the report. */
Before({tags: '@wip or @skip', order: 0}, (scenario, callback) => callback(null, 'skipped'));


/** If we're running `prod` tests, skip tests _not_ marked as `@prod`. */
if (config.target === 'prod') Before({tags: `not @${config.target}`}, (scenario, callback) => callback(null, 'skipped'));


AfterAll({}, async function () {
    //close the test run if we want to
    if (config.testRail.updateTestRail) {
        if (config.testRail.closeRun) {
            console.info('Test execution complete, closing test run!');
            await testRail.closeRun(config);
        } else {
            console.info('\nTest execution complete, please note that the run has not been closed!');
        }
    }
});

/** After hook used for TestRail reporting. If the test exists in test rail, set the execution status, otherwise create it and set the status. */
After({}, async function (scenario) {
    const world = this;
    if (config.testRail.updateTestRail) {

        if (scenario.result.status) {

            const runId = world.config.testRail.run.id;
            let caseId = null;
            let testTag;

            //get the proper test tag. It should start with @C
            for(let i = 0; i < scenario.pickle.tags.length; i++){
                if(scenario.pickle.tags[i].name.substring(0,2) === '@C'){
                    testTag = scenario.pickle.tags[i].name.replace('@C', '');
                    caseId = testTag.replace('@C', '');
                    break;
                }
            }

            // remove "@C" from the tag in the test so that we have the proper ID to update TestRail
            const testResults = scenario.result;

            //TODO: Need to implement a means to determine if we update or create tests, for now, we just update the status.
            // if (world.config.testRail.cases.some(testCase => testCase.id.toString() === scenario.pickle.tags[1].name.replace('@', ''))) {
            //for debugging
            // if (true) {

            // await console.log(`CaseId:${caseId} Status:${testResults.status}`);
            //set the status of the testRail case based on the cucumber result

            if (caseId != null) {
                let result = await testRail.addResultsForCase(runId, caseId, scenario);
                // await console.log(`CaseId:${caseId} Status:${testResults.status} API:${result.response.statusCode}`);
                // await console.log(`${JSON.stringify(result.response)}`)
            } else {
                await console.info(`No proper case id for test ${scenario.pickle.name}`)
            }

            //
            // } else {
            //     await console.log('Create test, add to run set results');
            //
            //     // create the test in test rail
            //     await testRail.addCase(scenario.pickle);
            //
            //     // add the test to a test run
            //     await testRail.updateRun();
            //
            //     //set the test status based on the cucumber result.
            //     await testRail.addResultsForCase(runId, caseId, testResults);
            // }
        } else {
            console.log('No tests to update, did something not work out?');
        }
    }
});


/** After hook to handle test failures. This causes screenshots to be attached to the cucumber run report when there is a failure. */
After({order: 1}, async function (scenario) {
    const world = this;
    if (world.driver) {
        if (scenario.result.status === Status.FAILED) {
            /** if the report type is cucumber then take a screen shot and attach it to the report when a test fails */
            if (config.reporter.takeScreenShot === true) {
                return world.driver.takeScreenshot().then(async function (screenshot) {
                    world.attach(screenshot, 'image/png');
                    if (config.browser.closeOnFail === true) {
                        try {
                            // for debugging
                            // console.log('Test Failure with screenshot: ' + scenario.pickle.name);
                            await world.driver.quit();
                        } catch (e) {
                            throw new Error(e);
                        }
                    }
                });
            } else {
                if (config.browser.closeOnFail === false || config.environment === 'grid') {
                    try {
                        //for debugging
                        // console.log('Test Failure: ' + scenario.pickle.name);
                        await world.driver.quit();
                    } catch (e) {
                        throw new Error(e);
                    }
                }
            }
        } else {
            try {
                //for debugging
                // console.log('Test Pass: ' + scenario.pickle.name);
                await world.driver.quit();
            } catch (e) {
                throw new Error(e);
            }
        }
    }
});
