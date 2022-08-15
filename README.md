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
 
 Available command line options
 
 --target

 --environment
 
 --grid
 
 --retries
 
 --parallel
 
 --browser
 
 --application
 
 --tags
 
 --closeOnFail
 
--launchReport


**Special notes on test tags**
 

# Framework configuration options

**test**
- application
- environment
- retry
- preAuth

**grid params**

- useGrid
- gridType
- parallel

**browser params** 

- closeOnFail
- browserName

**reporter params**

- launchReport
- reportType
- takeScreenShot

**testRail params**

- testRailProjectName
- updateTestRail
- closeRun

**jira params**
- jiraProject
- updateJira

