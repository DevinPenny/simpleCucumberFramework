const config = require('../package.json').config;
const timestamp = require('moment')().format('MM-DD-HHmm');
const testrail = require('testrail-api');
const frameworkData = require('../config/frameworkData');

const testRail = new testrail({
    host: frameworkData.testRailData.testRailUrL,
    user: process.env.testRailUser,
    password: process.env.testRailPass
});

/**
 * Get project data from TestRail.
 * @returns {Promise<void>}
 */
const getProjects = async (config) => {
    let result;
    try {
        result = await testRail.getProjects({});

    } catch (e) {
        throw new Error(`Unable to get test project: ${e}`);
    }

    let testProject;
    for (let i = 0; i < result.body.projects.length; i++) {
        if (result.body.projects[i].name.toLowerCase() === config.testRail.testRailProjectName.toLowerCase()) {
            console.info(`\t\tTest Rail project ${result.body.projects[i].name} found!. Project id = ${result.body.projects[i].id}`);

            config.testRail.project = result.body.projects[i];
            testProject = result.body.projects[i];
        }
    }

    if (!config.testRail.project.id) {
        throw new Error(`Could not find test rail project with name ${config.testRail.testRailProjectName}`)
    }

    return testProject;
};

/**
 * Get suite data from Test Rail
 *
 * @param projectData - pass in a project ID in order to filter by project.
 * @returns {Promise<void>}
 */
//get suites is currently not used
const getSuites = async (projectData = '') => {

    const projectId = (projectData === '') ? projectData : world.config.testRail.project.id;

    let result;
    try {
        result = await testRail.getSuites(projectId, {});
    } catch (e) {
        throw new Error(`Unable to get suites: ${e}`);
    }

    config.testRail.suites = result.body[0];
    const suites = result.body[0];

    if (!config.testRail.suites) {
        throw new Error(`Error getting Test Rail suites: ${error.message}`);
    }

    console.info(`\t\tTest rail project suites for ${config.testRail.testRailProjectName} found!`);
    return suites;
};


/**
 * Get test runs from Test rail
 * @param projectId - the project ID
 * @param filterData - filter criteria to be provided in the get request
 * @returns {Promise<void>}
 */
//get runs is currently not used.
const getRuns = async (projectId = '', filterData = {}) => {

    const id = (projectId = '') ? projectId : world.config.project.id;
    const filters = {...filterData};

    let result;
    try {
        result = await testRail.getRuns(id, filters);
    } catch (e) {
        throw new Error(`Unable to get test runs: ${e}`);
    }

    world.config.testRail.runs = [];
    let testRuns = [];

    for (let i = 0; i > result.body.runs.length; i++) {
        const {id, suite_id, name, is_completed, project_id, created_on, url} = result.body.runs[i];
        //we have to strip out any special characters from the test case name, otherwise it will break the bash command for cucumber.
        const tempName = name.replace(/[^a-zA-Z ]/g, '');
        world.config.testRail.runs.push({id, suite_id, name: tempName, is_completed, project_id, created_on, url});
        testRuns.push({id, suite_id, name: tempName, is_completed, project_id, created_on, url});
    }


    console.info(`\t\tTest rail project runs for ${config.testRail.testRailProjectName} found!`);

    if (testRuns.length > 1) {
        throw new Error(`Error getting Test Rail runs for project: ${config.testRail.testRailProjectName}`);
    }

    return testRuns;
};

/**
 * Get a list of all cases from Test rail, this is based on project ID.
 *
 * @param config - The config object which contains the Project ID, suite ID, section ID to be used to get the cases for the project
 * @returns {Promise<void>}
 */
const getCases = async (config) => {

    /**append what we need from the test rail response into a cases array in config. */
    config.testRail.cases = [];
    let testCases = [];

    for (let i = 0; i < config.testRail.sections.length; i++) {
        const body = {
            project_id: config.testRail.project.id,
            // suite_id: suite,
            // created_after: '',
            // created_before: '',
            // created_by: '',
            //filter tests by the interface field, we want GUI only.
            filter: {"mode": "1", "filters": {"cases:custom_interface": {"values": ["1"]}}},
            // limit: '250',
            // milestone_id: '',
            // offset: '',
            // priority_id: '',
            // refs: '',
            section_id: config.testRail.sections[i].id,
            // template_id: '',
            // type_id: '',
            // updated_after: '',
            // updated_before: '',
            // updated_by: ''
        };

        let result;
        try {
            result = await testRail.getCases(config.testRail.project.id, body);
        } catch (e) {
            throw new Error(`Unable to get cases: ${e}`);
        }

        for (let i = 0; i < result.body.cases.length; i++) {
            const {id, title, section_id, template_id, type_id} = result.body.cases[i];
            //we have to strip out any special characters from the test case name, otherwise it will break the bash command for cucumber.
            const tempTitle = title.replace(/[^a-zA-Z ]/g, '');
            config.testRail.cases.push({id, title: tempTitle, section_id, template_id, type_id});
            testCases.push({id, title: tempTitle, section_id, template_id, type_id});
        }
    }

    console.info(`\t\tTest rail cases for project ${config.testRail.testRailProjectName} found!`);

    if (testCases.length < 1) {
        throw new Error(`Error getting Test Rail cases for project: ${config.testRail.testRailProjectName}`);
    }

    return testCases;
};

/**
 * get the test rail sections
 *
 * @param config
 * @returns {Promise<*[]>}
 */
const getSections = async (config) => {

    let result;
    let counter = 0;
    let done = false;

    let testSections = [];
    config.testRail.sections = [];

    while (!done) {
        //each time we iterate, start at 0, then i by 250
        let body = {
            offset: (counter = 0 ? 0 : 250 * counter),
            limit: 250
        };

        try {
            result = await testRail.getSections(config.testRail.project.id, body);
        } catch (e) {
            throw new Error(`Unable to get test sections: ${e}`);
        }

        for (let i = 0; i < result.body.sections.length; i++) {
            if (config.testRail.testFolders.includes(result.body.sections[i].name)) {
                config.testRail.sections.push(result.body.sections[i]);
                testSections.push(result.body.sections[i]);
            }
        }

        //check if we need to iterate through more records or not
        if (result.body.sections.length < 250) {
            done = true;
        } else {
            counter++
        }
    }

    if (testSections.length < 1) {
        throw new Error(`Error getting Test Rail sections for project!`);
    }

    await console.log(`\t\tFound ${testSections.length} sections with UI tests`);

    return testSections;
};


/**
 * Add a test run for a particular project in Test Rail.
 *
 * @param config - the config object which has an array of case id's that you want to add to the suite.
 * @returns {Promise<void>}
 */
const addRun = async (config) => {

    //if cases is empty, then testrail will add all tests to the run.
    let cases = [];

    for (let i = 0; i < config.testRail.cases.length; i++) {
        cases.push(config.testRail.cases[i].id);
    }

    await console.log(`Found ${cases.length} test cases!`);

    const body = {
        // project: '',
        // projectId: config.testRail.project.id,
        // suite_id: config.testRail.currentSuite,
        name: `${config.testRail.testRailProjectName} UI automation test run in ${config.test.environment.toUpperCase()} at ${timestamp}`,
        description: 'Test run created by the UI automation framework',
        // milestone_id: '',
        // assignedto_id: '',
        include_all: false,
        case_ids: cases,
        // refs: '',
    };

    if (cases.length < 1) {
        throw new Error(`Did not find any cases when attempting to add a run`);
    }

    let result;
    try {
        result = await testRail.addRun(config.testRail.project.id, body)
    } catch (e) {
        throw new Error(`Unable to add test run: ${e}`);
    }

    config.testRail.run = result.body;
    return result;
};

/**
 * Adds a new test case to test rail
 *
 * @param testData - The test data required to create the test.
 * @param sectionId - the ID of the folder you want to save the test in.
 * @returns {Promise<void>}
 */
const addCase = async (testData, sectionId = '') => {
    //for testing use ID 13684
    const section = (sectionId !== '') ? sectionId : config.testRail.currentSuite;

    //get all of the step info and format it for testRail
    let steps = [];
    for (let i = 0; i < testData.steps.length; i++) {
        steps.push({
            content: `Step ${i}: ${testData.name}`,
            expected: 'Expected Result'
        });
    }

    const body = {
        section_id: section,
        title: testData.name,
        template_id: '',
        type_id: 1,
        priority_id: 3,
        estimate: '',
        milestone_id: '',
        refs: '',
        custom_steps_separated: steps
    };

    let result;

    try {
        result = await testRail.addCase(section, body);
    } catch (e) {
        throw new error(`Error creating Test Rail case: ${e}`);
    }

    world.config.testRailData.newCase = result.body;
    return result;
};

/**
 * add test results for a test run in TestRail
 * @param runId
 * @param testData
 * @returns {Promise<void>}
 */
const addResults = async (runId, testData) => {

    const body = {
        status_id: '',
        comment: '',
        version: '',
        elapsed: '',
        defects: '',
        assignedto_id: '',
        ...testData
    };

    let result;
    try {
        result = await testRail.addResult(/*TEST_ID=*/1, /*CONTENT=*/body);
    } catch (e) {
        throw new Error(`Error creating Test Rail result: ${e}`);
    }
    return result;
};

/**
 * Add test results from cucumber to a test case in a test run/suite
 * @param runId - The id of the test run
 * @param caseId - The ID of the case you wish to set the results of.
 * @param testData - The test result data to be passed to TestRail.
 * @returns {Promise<void>}
 */
const addResultsForCase = async (runId, caseId, testData) => {
    //TODO: do we need to make this function usable in multiple contexts?.
    // let run = (runId !== '') ? runId : world.config.testRail.currentSuite;
    // let testCase = (caseId !== '') ? caseId : world.config.testRail.cases.id;

    let statusId;

    switch (testData.result.status.toLowerCase()) {
        case 'passed':
            statusId = '1'
            break;
        case 'failed':
            statusId = '5'
            break;
        case 'skipped':
            statusId = '2'
            break;
    }

    let resultMessage;

    if (testData.result.message) {
        resultMessage = testData.pickle.name;
        for (let i = 2; i < testData.gherkinDocument.comments.length; i++) {
            resultMessage = resultMessage + `\n${testData.gherkinDocument.comments[i].text}`
        }

        resultMessage = resultMessage + '\n\n\n********* FAILURE DETAILS *********\n\n\n';
        resultMessage = resultMessage + `\n${testData.result.message}`;

    } else {
        resultMessage = 'Test was executed via UI automation project';
    }

    const body = {
        status_id: statusId,
        comment: resultMessage,
        // version: '',
        // elapsed: duration.toString(),
        // defects: '',
        // assignedto_id: '',
    };

    let result;
    try {
        result = await testRail.addResultForCase(runId, caseId, body);
    } catch (result) {
        throw new Error(`Error creating Test Rail caseId:${caseId} runId: ${runId} response:${JSON.stringify(result.message)}`);
    }
    return result;
};

/**
 * Adds a suite to the test project
 *
 * @param config - The config object containing the ID of the project you want to add the suite to.
 * @param suiteDesc - The description of the suite
 * @returns {Promise<void>}
 */
//this is currently not used, currently teams do not use suites
const addSuite = async (config, suiteDesc = '') => {

    const description = (suiteDesc !== '') ? suiteDesc : `Automation test suite for ${name} application, created on ${timestamp}`;

    const body = {
        name: `${config.application} automation suite ${timestamp}`,
        description: description
    };

    let result;

    try {
        result = await testRail.addSuite(config.testRail.project.id, body);
    } catch (e) {
        throw new Error(`Error creating Test Rail suite for project: ${error.message}`);
    }

    //store the suite ID for later use
    config.testRail.currentSuite = result.body;
    // console.log(result);
    return result.body;

};

/**
 * Add new cases to a run
 * @param runId - the id of the test run
 * @param {array} testCases - the id's of the test cases you wish to addd
 * @returns {Promise<void>}
 */
const updateRun = async (runId = '', testCases = []) => {

    const run = (runId === '') ? runId : world.config.testRail.run.id;
    //build a case array containing only the test case ID's that we want to add to the run.
    let cases = [];
    cases = (testCases.length !== 0) ? testCases : cases.push(world.config.testRail.newCase.id);

    const body = {
        include_all: false,
        case_ids: cases
    };

    let result;

    try {
        result = await testRail.updateRun(run, body);
    } catch (e) {
        throw new Error(`Error creating Test Rail suite for project: ${error.message}`);
    }

    world.config.testRail.currentSuite = result.body;

    return result.body;
};

/**
 * Closes an existing test run. Warning, this means the run can no longer be used. Close carefully!
 *
 * @param config - the config object containing the id of the run you want to close.
 * @returns {Promise<void>}
 */
const closeRun = async (config) => {

    const body = {};

    let result;
    try {
        result = await testRail.closeRun(config.testRail.run.id, body);
    } catch (e) {
        throw new Error(`Error closing Test Rail run for project: ${e}`);
    }

    world.config.testRail.currentSuite = result.body;

    return result;
};

//TODO: complete attachResultToRun
const attachResultToRun = async (config) => {

};


module.exports = {
    getProjects,
    getCases,
    getRuns,
    getSuites,
    getSections,
    addRun,
    updateRun,
    addResults,
    addResultsForCase,
    addCase,
    addSuite,
    closeRun,
    attachResultToRun
};