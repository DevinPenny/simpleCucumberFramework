/**
 * User and environment data for testing.
 *
 * @memberOf module:environmentData
 */
const users = {
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
        authUrl: '/security/authenticate',
        users: users,
    },
    uat: {
        customer: 'https://some-url.com',
        admin: 'https://some-url.com',
        other: 'https://some-url.com',
        apiDomain: 'https://qa.api.url.com',
        authUrl: '/security/authenticate',
        users: users,
    },
    sandbox: {
        customer: 'https://some-url.com',
        admin: 'https://some-url.com',
        other: 'https://some-url.com',
        apiDomain: 'https://qa.api.url.com',
        authUrl: '/security/authenticate',
        users: users,
    },
    prod: {
        customer: 'https://some-url.com',
        admin: 'https://some-url.com',
        other: 'https://some-url.com',
        apiDomain: 'https://qa.api.url.com',
        authUrl: '/security/authenticate',
        users: users,
    },
};