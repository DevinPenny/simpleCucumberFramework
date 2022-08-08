/**
 * User and environment data for testing.
 *
 * @memberOf module:environmentData
 */
const users = {
    //default is for the admin page
    user1: {
        id: 'user1',
        pass: 'ABCD1234',
        //if we want to use api keys to authenticate, put them here
        apiKeys: {
            qa: 'QA_KEY_GOES_HERE',
            uat: 'UAT_KEY_GOES_HERE',
            sandbox: 'SB_KEY_GOES_HERE',
            prod: 'PROD_KEY_GOES_HERE',
        },
    },
    //aman is for the subscriber page
    user2: {
        id: 'user2',
        pass: 'ABCD1234',
        //if we want to use api keys to authenticate, put them here
        apiKeys: {
            qa: 'QA_KEY_GOES_HERE',
            uat: 'UAT_KEY_GOES_HERE',
            sandbox: 'SB_KEY_GOES_HERE',
            prod: 'PROD_KEY_GOES_HERE',
        },
    },

};

/**
 * Data used during tests.
 *
 * @module environmentData
 */
module.exports = {
    local: {
        domain: 'http://localhost:8080',
        apiDomain: 'http://localhost:8080/',
        users: users,
    },
    qa: {
        customer: 'https://some-url.com',
        admin: 'https://some-url.com',
        other: 'https://some-url.com',
        apiDomain: 'https://qa.api.url.com',
        users: users,
    },
    uat: {
        customer: 'https://some-url.com',
        admin: 'https://some-url.com',
        other: 'https://some-url.com',
        apiDomain: 'https://qa.api.url.com',
        users: users,
    },
    sandbox: {
        customer: 'https://some-url.com',
        admin: 'https://some-url.com',
        other: 'https://some-url.com',
        apiDomain: 'https://qa.api.url.com',
        users: users,
    },
    prod: {
        customer: 'https://some-url.com',
        admin: 'https://some-url.com',
        other: 'https://some-url.com',
        apiDomain: 'https://qa.api.url.com',
        users: users,
    },
};