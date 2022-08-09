const axios = require('axios');
const {promisify} = require('util');
const timeDelay = promisify(setTimeout);
const {get, set} = require('lodash');
const decodeToken = require('jwt-decode');
const {v4: uuid} = require('uuid');
const {expect} = require('chai');
const config = require('../package.json').config;

/**
 * Retrieve data from the file specified.
 *
 * @param {string} fileName - The core portion of the filename used to retrieve the data.
 * @param {string} keyName - The name of the data value to retrieve.
 * @return {string|object} The data being requested.
 */
const getDataValues = (fileName, keyName) => {
    const data = require(`${config.remotePathRoot}/data/${fileName}`);
    return get(data, keyName);
};

/**
 * Wait for a specified number of seconds to delay testing
 *
 * @param {number} seconds - The number of seconds to wait.
 * @return {Promise} A Promise that will be resolved when the specified seconds have passed.
 */
const waitSeconds = async (seconds) => {
    return await timeDelay(1000 * seconds);
};

/**
 * Decode a JWT token and return an object of the decoded token.
 * @param {string} token - The JWT to decode.
 * @returns {Promise<*>} A promise that contains the decoded token data.
 */
const jwtDecode = async (token) => {
    return decodeToken(token);
};

/**
 * Create an instance of Axios, if a user is provided, then the user token will be applied to the default Axios header
 * and a decoded token will be added to the instance object that contains account specific data such as a domain id.
 *
 * @param {object} world - the cucumber world instance
 * @param {string} user - The name of a user to provide for creating an authenticated header when needed.
 * @return {object} An axios instance to be used for mocha tests.
 */
const createSession = async (world, user) => {

    //Get environment config options dictated from node. If debugging, you must set the package.json config parameters to the appropriate values
    //This is because running from webstorm does not create a node instance and so process is undefined.


    let credentials = credentials.users[user];
    const Authorization = `Basic ${Buffer.from(`${credentials.id}:${credentials.pass}`).toString('base64')}`;
    //create an instance of Axios called session to share with all tests.
    const session = await axios.create({
        baseURL: get(environment, 'apiDomain'), //<-- get the baseURL
        timeout: 60000,
        validateStatus: (status) => status >= 200,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': Authorization
        }
    });
    //Create a data store object  working with test data
    session.temp = {};

    //lodash set wrapper function to set values
    session.set = (prop, value) => set(session, `temp.${prop}`, value);

    session.get = (prop, defaultVal = undefined) => {
        if (get(session, `temp.${prop}`) === undefined)
            set(session, `temp.${prop}`, defaultVal);
        return get(session, `temp.${prop}`);
    };

    session.env = (prop, val = null) => val === null ? get(session.envData, prop, false) : set(session.envData, prop, val); ///<--- Get/Set environment data
    session.reset = () => set(session, 'temp', {});

    session.envData = {
        target: process.env.mocha_target === undefined ? config.target : process.env.mocha_target,
        userId: credentials.userId,
        baseURL: get(environment, 'apiDomain')
    };

    //use an intercept to collect the request and response payloads and put them in a place we can use for report logging
    session.interceptors.request.use(function (intercept) {
        session.testRequestPayload = (intercept.params ? JSON.stringify(intercept.params) : JSON.stringify(intercept).substring(0, 1000));
        return intercept;
    }, function (intercept) {
        return intercept;
    });

    //use an intercept to collect the response payloads and put them in a place we can use for report logging
    session.interceptors.response.use(function (intercept) {
        session.testResponseData = JSON.stringify(intercept.data).substring(0, 1000);
        return intercept;
    }, function (intercept) {
        return intercept;
    });

    return session;
};


/**
 * Create a timestamp formatted as a string, optionally it can be dash separated if you pass the function true
 *
 * @param {boolean} separator - flag used to format the string with dashes
 * @returns {string} A string representing the current date and time
 */
const currentDateTime = (separator = false) => {
    if (separator) {
        return require('moment')().format('YYYY-MM-DD-HH-mm');
    } else {
        return require('moment')().format('YYYYMMDDHHmm');
    }
};

const timestamp = () => require('moment')().format();

const setDueDate = (noOfDays = 0) => {

    return require('moment')().add(noOfDays, 'days').format('l');
};

//Convert days to date
const daysToDate = (days) => new Date(new Date().getTime() + parseInt(days) * 24 * 60 * 60 * 1000).toISOString();

//Get the number of seconds since January 1, 1970 at 00:00:00 UTC
const getUnixTime = () => new Date().getTime() / 1000; //getTime returns the time in milliseconds, divide by 1000 to get seconds

const getUUID = () => uuid();

/**
 * Wait until a response object from a specified function (primarily an API call) matches a specified piece of data.
 * The data param MUST be a function if comparing responses outside of the data key from an API call. EX HTTP status, non-API functions
 *
 * @param {function} session - An open and authenticated axios session
 * @param {function} searchAPI - A function that contains the desired API call
 * @param {Object|function} data - An object containing a key:value pair expected to be in the response OR a function that returns true:false based on if the data is a match
 * @param {string} keyReturned - The key from the response that will be returned. Defaults to 'data.id', object paths are supported ('data.obj.name') but not required ('data')
 * @param {number} retries - The number of iterations until the function gives up on finding a response.
 * @param {boolean} exp - false will throw an error if a match is found, true will throw a match if one is not found
 * @param {Array} searchAPIParams - Array of arguments for the searchAPI argument. Session will be an argument by default, do not include in searchAPIParams
 * @param {number} initTime - The time (in seconds) that the function will wait until triggering another searchAPI call
 * @param {number} growthrate - The change initTime per iteration. initTime = initTime * (2^growthrate). 1 will double each iteration, -1 will half each iteration, and 0 will be constant
 * @param {string} error - The message attached to the assertionError if it is thrown
 * @return {Promise<string>} - The keyReturned value from the successfully found response object
 */
const apiWaiting = async (session, searchAPI, data = {}, keyReturned = 'data.id', retries = 3, exp = false, searchAPIParams = [], initTime = 1, growthrate = 1, error = '') => {
    //Wait for the save until the save filter is created
    let isFound = false;
    let returnValue = '';
    let lastWaitTime = 0;
    //Try to retry to verify to a certain number before giving up
    for (let retry = 0; retry < retries; retry++) {
        const res = searchAPIParams.length === 0 ? await searchAPI(session) : await searchAPI(session, ...searchAPIParams);
        //Loop through all the records and check if it found a record that match all the key values
        if (res.data.hasOwnProperty('recordCount')) {
            for (let i = 0; i < res.data.recordCount && !isFound; i++) {
                //Loop through each keys to see if all the keys are matched
                if (typeof data === 'function') {
                    isFound = data(res.data.records[i]);
                } else {
                    for (const key of Object.keys(data)) {
                        if (res.data.records[i][key] !== data[key]) {
                            isFound = false;
                            break;
                        } else
                            isFound = true;
                    }
                }
                //Get the Id of the found record
                if (isFound)
                    returnValue = get(res, keyReturned);
            }
        } else {
            if (typeof data === 'function') {
                isFound = data(res);
            } else {
                for (const key of Object.keys(data)) {
                    if (res.data[key] !== data[key]) {
                        isFound = false;
                        break;
                    } else
                        isFound = true;
                }
            }
            if (isFound) {
                returnValue = get(res, keyReturned);
            }
        }
        if ((!isFound && exp) || (isFound && !exp)) {
            isFound = false;
            lastWaitTime = lastWaitTime === 0 ? initTime : lastWaitTime * (2 ** growthrate);
            await waitSeconds(lastWaitTime);
        } else
            break;
    }
    await expect(isFound,
        error === '' ? typeof data === 'function' ? 'Record not found' : `${JSON.stringify(data)} not found` : error).to.equal(exp);
    return returnValue;
};


/**
 * Provide methods for communicating with an API and logging the response to be used in mocha tests.
 *
 * - [waitSeconds]{@link module:integrationUtils.waitSeconds}
 * - [getDataValues]{@link module:integrationUtils.getDataValues}
 * - [createSession]{@link module:integrationUtils.createSession}
 * - [jwtDecode]{@link module:integrationUtils.jwtDecode}
 * - [randString]{@link module:integrationUtils.randString}
 * - [randomEmail]{@link module:integrationUtils.randomEmail}
 * - [randomNumber]{@link module:integrationUtils.randomNumber}
 * - [currentDateTime]{@link module:integrationUtils.currentDateTime}
 *
 * @module integrationUtils
 */
module.exports = {
    getDataValues,
    waitSeconds,
    createSession,
    jwtDecode,
    currentDateTime,
    timestamp,
    daysToDate,
    getUnixTime,
    getUUID,
    apiWaiting,
    setDueDate
};

