const {Given, When, Then} = require('@cucumber/cucumber');
const signinPage = require('../../../pages/ui/signInPageObjects');

this.World = require('../../../support/world');

Given('I log into the passport {string} page as the user {string} and verify I am on the landing page', {timeout: 60 * 1000}, function (page, account) {
    return signinPage.navigateToLogin(this, page, account);
});
