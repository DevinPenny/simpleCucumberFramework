const report = require('multiple-cucumber-html-reporter');
//TODO: pass driver to this funciton so we can get browser information in this report. (version, etc)
//TODO: Implement a means to provide failing step details into this report as a column in the custom data object
async function reporter(config, timestamp, working) {
    try {

        let data = [];

        Object.keys(config).forEach((key) => {
            if (typeof config[key] !== 'object') {
                if (config[key] !== 'server.js') {
                    data.push({label: `${key}`, value: `${config[key]}`});
                }
            }
            if (key === 'tags') {
                console.info(`\t${key} = ${config.tags.toString()}`);
                data.push({label: `${key}`, value: `${config.tags.toString()}`});
            }
        });

        await report.generate({
            openReportInBrowser: config.reporter.launchReport,
            jsonDir: `${working}/reports/json`,
            reportPath: `${working}/reports/html/${config.test.application}-results-${timestamp}.html`,
            metadata: {
                browser: {
                    name: config.browser.browserName,
                    version: '60'
                },
                device: 'Local test machine',
                platform: {
                    name: 'ubuntu',
                    version: '16.04'
                }
            },
            customData: {
                title: `Test Results for ${config.test.application} Project`,
                data: data
            }
        });

    } catch (e) {
        console.info(`Unable to generate HTML report due to errors! ${e} \n`);
        throw e;
    }
}

module.exports = {
    reporter
};