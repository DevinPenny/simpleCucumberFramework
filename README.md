# QA Automation Testing Framework

This GitHub repository contains a generic automation testing framework using Cucumber, Selenium, and Axios.

<ul>
<li>Author: Devin Penny</li>
<li>Email: devin.penny@gmail.com</li>
<li>Linkedin: https://www.linkedin.com/in/devinpenny/</li>
<li>Github: https://github.com/DevinPenny/simpleCucumberFramework</li>
</ul>

# Features
<ul>
<li>Fully configuration command line interface</li>
<li>Supports any number of test environments (QA,UAT,PROD, etc)</li>
<li>Provides two different types of reporting</li>
<li>TestRail integration</li>
<li>Can execute tests locally, on BrowserStack, or on a custom Selenium Grid</li>
<li>Ability to pre-authenticate user tokens and apply them to the browser</li>
<li>Uses a simple design pattern that ensures easy implementation and maintenance</li>
<li>Provides an extensive library of custom functions to ensure test reliability</li>
</ul>




# Usage and installation:

**To install**
<ol>
<li>Install NodeJS
<li>Install github
<li>clone the repo
<li>using a terminal, run "npm install"
</ol>

**To run tests**

Before you execute the run commands in terminal, please look at the available execution options located in the config object
of package.json. This framework allows tests to be run in many different configurations 
and contexts.

The base command "npm start" will execute all tests with the values provided in package.json,
however, you can override these values using command line parameters, this enables users
to specify various environments, browser specifics, local or grid execution, and determine
what tests are executed by the cucumber tag system "@tag" 

_Please note that you need to provide an empty long argument directly after the start command (See example below)_

 "npm start -- --target qa --environment local --grid false --application reference --tags @123"
 
 **Available command line options**

 --environment {string} Specify the environment to run on. 
 
 --grid {boolean} set to true in order to run on a selenium grid.
 
 --retries {number} define the number of time you wish to retry a failed test.
 
 --parallel {number} Set to define the number of parallel browsers you wish to use.
 
 --browser {string} either chrome or firefox
 
 --application {string} currently not implemented.
 
 --tags {string} provide one, or many tags that are found on feature files. "--tags @TEST1 @TEST2"
 
 --closeOnFail {boolean} Set to False if you want the browser to remain open after a failure.
 
--launchReport {boolean} Set to false if you do not wish to have the report automatically loaded after execution.


**Special notes on test tags**
 

# Framework configuration options

**test**
- application - Not yet implemented. This refers to the folder structure within /features/enabled and allows a user to select tests only in that folder
- environment - Provides a means to run tests against differing URL's that are configured in /data/environmentData
- retry - Enables tests that fail to be rerun, it is a means to reduce flaky test results
- preAuth - When configured properly, is a means to authenticate all of the users found in environmentData, store the token, and apply it to the browser before cucumber executes.

**grid params**

- useGrid - True or False. For running tests on a grid, or on a local machine
- gridType - Either "homegrid" or "browserstack" used to specify what selenium grid environment you wish to use.
- parallel - Set the number of parallel tests you wish to run.

**browser params** 

- closeOnFail - When running tests locally, set to true and the browser will remain open after a failure. This lets testers evaluate the state of the page.
- browserName - set to either Chrome or Firefox to run tests with specified browser.

**reporter params**

- launchReport - True or False. Launch a report after test execution
- reportType - Values are "single" or "multi" and enable different reports depending on the needs of the team
- takeScreenShot - True or False. When a test fails, attach a screen shot to the report for evaluation.

**testRail params**

- testRailProjectName - Set to the name of the test rail project you want to update test results for.
- updateTestRail - True or False. Updating test rail is based on this flag.
- closeRun - When a test run completes and results are updated in test rail, you can opt in or out of closing the test run.

**jira params**
- jiraProject - Not yet implemented. The Jira project you wish to update
- updateJira - Not yet implemented. True or False. Update Jira with test status.

