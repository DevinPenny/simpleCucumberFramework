const {get} = require("lodash");
const authData = require("../data/environmentData");
const axios = require("axios");
const decodeToken = require("jwt-decode");

/**
 * authenticate with a specified environment url and set of users, this is to be executed before the cucumber
 * command so that we can provide all tokens as part of the world params, and share them with parallels on a grid
 * type environment.
 *
 * @param environment
 * @returns {Promise<void>}
 */
async function setUserTokens(environment) {

    const users = get(authData, `${environment}.users`);
    const authURL = get(authData, `${environment}.authUrl`);
    let creds;
    let res;

    /**create an instance of Axios called session to share with all tests.*/
    const session = await axios.create({
        baseURL: authData[environment].apiDomain,
        timeout: 25000,
        validateStatus: (status) => status >= 200,
        headers: {'Content-Type': 'application/json'}
    });

    for (const user of Object.keys(users)) {

        if (!users[user].skipEnv.includes(environment)) {
            //If we have an api key, use it, else use UN/PW
            if (users[user].apiKeys[environment] === '') {
                creds = {
                    username: get(users, `${user}.id`),
                    password: get(users, `${user}.pass`),
                    application: config.test.application,
                };
            } else {
                creds = {
                    'value': get(users, `${user}.apiKeys${environment}`)
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
                users[user].token = res.data.token;
                users[user].domainId = decodeToken(res.data.token).domain.id;

            }

            users[user].token = res.data.token;
            users[user].domainId = decodeToken(res.data.token).domain.id;
        } else {
            console.info(`\tSkipping auth for ${user} due to environment rules`);
        }
    }
}

module.exports = {
    setUserTokens
}