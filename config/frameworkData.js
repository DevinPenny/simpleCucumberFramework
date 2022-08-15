/**
 * Framework configuration data for test reporting and management
 */
module.exports = {
    //for test rail authentication
    testRailData: {
        user: 'user',
        password: 'nope',
        testRailUrL: 'https://www.gurock.com/testrail',
    },
    //for jira authentication
    jiraData: {
        user: 'user',
        password: 'pass',
        jiraUrL: "jira url goes here",
    },
    //for email
    mailData: {
        host: 'smtp.gmail.com',
        port: '587',
        secure: 'false',
        auth: {
            user: 'user',
            pass: 'pass'
        },
        subject: 'Automation test results report',
        from_mail: 'user',
        to_mail: 'pass'
    },
    gridData: {
        homeGrid: "https://some-url.com/wd/hub",
        browserStackGrid: "https://hub.browserstack.com/wd/hub",
    }
};