const cucumber = require('@cucumber/cucumber');
const {Given, When, Then} = cucumber;
const googleSearchPage = require('../../../pages/ui/googleSearchPageObjects');


Given('Enter the value {string} in the {string} bar', {timeout: 60 * 1000}, function (value, element) {
    return googleSearchPage.enterSearchValue(this, value, element);
});

When('Click on the {string} button on the {string} page', {timeout: 60 * 1000}, function (element, page) {
    return googleSearchPage.clickGoogleSearchButton(this, element, page);
});

