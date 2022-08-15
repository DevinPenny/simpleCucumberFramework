const axios = require('axios');
const {get, set} = require('lodash');
const decodeToken = require('jwt-decode');
const config = require('../package.json').config;
const Page = require('./uiBaseObjects');

/**
 * Decode a JWT token and return an object of the decoded token.
 * @param {string} token - The JWT to decode.
 * @returns {Promise<*>} A promise that contains the decoded token data.
 */
async function jwtDecode(token) {
    return await decodeToken(token);
}

/**
 * Create an instance of Axios, if a user is provided, then the user token will be applied to the default Axios header
 * and a decoded token will be added to the instance object that contains account specific data such as a domain id.
 *
 * This function also implements an easy means through lodash to get and set temporary data values that can be used
 * in subsequent API calls.
 *
 * Lastly, using interceptors and some formatting features, allows all API call request and response bodies to be
 * stored in a way that allows them to be added into the final execution report.
 *
 * @param {object} world - the cucumber world instance
 * @param {string} user - The name of a user to provide for creating an authenticated header when needed.
 * @return {object} An axios instance to be used for mocha tests.
 */
async function createSession(world, user) {
    //get environment data for testing
    const environment = await Page.getDataValues(world, 'environmentData', world.config.environment);

    //organize user data to authenticate
    const credentials = environment.users[user];

    //build a base64 string using username and password
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
}


/**
 * Create a timestamp formatted as a string, optionally it can be dash separated if you pass the function true
 *
 * @param {boolean} separator - flag used to format the string with dashes
 * @returns {string} A string representing the current date and time
 */
async function currentDateTime(separator = false) {
    if (separator) {
        return require('moment')().format('YYYY-MM-DD-HH-mm');
    } else {
        return require('moment')().format('YYYYMMDDHHmm');
    }
}

/**
 * create a timestamp using moment
 *
 * @returns {Promise<string>}
 */
async function timestamp() {
    return require('moment')().format();
}


/**
 * Convert days to date
 *
 * @param days
 * @returns {Promise<string>}
 */
async function daysToDate(days) {
    return new Date(new Date().getTime() + parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * create a unix time formatted string representing the number of seconds seconds since January 1, 1970 at 00:00:00 UTC
 * @returns {Promise<number>}
 */
async function getUnixTime() {
    return new Date().getTime() / 1000; //getTime returns the time in milliseconds, divide by 1000 to get seconds
}

module.exports = {
    createSession,
    jwtDecode,
    currentDateTime,
    timestamp,
    daysToDate,
    getUnixTime,
};

