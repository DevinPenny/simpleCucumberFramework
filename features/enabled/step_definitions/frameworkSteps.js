const cucumber = require('@cucumber/cucumber');
const {Given, When, Then} = cucumber;
const Page = require('../../../pages/baseObjects');


Given('I wait {string} seconds', {timeout: 60 * 1000}, function (seconds) {
    return Page.waitSeconds(this, seconds);
});

Given('I navigate to the page {string}', {timeout: 60 * 1000}, function (page) {
    return Page.navigateToPage(this, page);
});

Given('I verify that the page title is {string}', {timeout: 60 * 1000}, function (title) {
    return Page.verifyPageTitle(this, title);
});

Given('I verify that the page url contains {string}', {timeout: 60 * 1000}, function (url) {
    return Page.verifyPageUrlContains(this, url);
});
