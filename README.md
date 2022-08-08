# QA Automation Testing Framework

This repo houses the Cucumber framework files and configurations for automated UI testing.  
It is installed as a dependency of other projects.  Those projects will contain Cucumber Feature files 
and Step Definitions specific to that project.  Those files will be run through this Cucumber 
framework to perform the automated tests against a Selenium grid both from a developer level 
utilizing Cucumber Tags for specifying tests, as well as in an appropriate Git hook somewhere 
in the Pull Request process, to be determined at a later time.


#Usage and installation:

**To install:**
Step 1: Install NodeJS
Step 2: Install git
Step 3: clone the repo
Step 4: in terminal, run "npm install"

**Test execution and setting/parameters**

Before you run tests, please look at the available execution options located in the config object
of package.json because this framework allows tests to be run in many different configurations 
and contexts.

The base command "npm start" will execute all tests with the values provided in package.json
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
 
