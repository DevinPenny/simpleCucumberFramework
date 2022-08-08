const get = require('lodash/get');
const chai = require('chai');
const expect = chai.use(require('chai-as-promised')).expect;
chai.use(require('chai-as-promised')).should();
const moment = require('moment');
const {v4: uuid} = require('uuid');
const {until, promise, Key, By} = require('selenium-webdriver');



/**
 * Wait for an element to be displayed on the page.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that identifies the element to be visible.
 * @param {string} [message=''] - The custom error message, meant to indicate the true nature of the error as opposed to a missing element.
 * @param {int} [visibleWait=25000] - The number of milliseconds to wait for the element to be visible.
 * @return {Element} The [Selenium WebElement]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html} you were waiting to be visible.
 */
async function waitToBeVisible(world, locator, message = '', visibleWait = 25000) {

    try {
        const element = await world.driver.findElement(locator);
        if (element == null) {
            return null;
        }

        const condition = await until.elementIsVisible(element);
        await world.driver.wait(condition, visibleWait);
        return await element;

    } catch (e) {
        throw new Error(message !== '' ? `${message}\n error:${e}` : e);
    }

}

/**
 * Wait for an element to be located on the page.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that identifies the element to be located.
 * @param {string} [message=''] - The custom error message, meant to indicate the true nature of the error as opposed to a missing element.
 * @param {int} [locateWait=25000] - The number of milliseconds to wait for the element to be located.
 * @return {Element} The [Selenium WebElement]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html} you were waiting to be located.
 */
async function waitToBeLocated(world, locator, message = '', locateWait = 25000) {
    try {
        await world.driver.wait(until.elementLocated(locator), locateWait);
        return await world.driver.findElement(locator);

    } catch (e) {
        throw new Error(message !== '' ? `${message}\n error:${e}` : e);
    }
}

/**
 * Wait for a specific number of seconds. This should not be heavily used.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {number} seconds - The number of seconds to wait.
 * @return {void}
 */
async function waitSeconds(world, seconds) {
    await world.driver.sleep(1000 * seconds);
}

/**
 * Get text of a set of elements
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {string} elements - The {@link WebDriver} method that locates the elements whose texts are being checked.
 * @param {string} message - The error message to throw if the function fails
 * @param {boolean} expectingText - send False if you are expecting an array with 0 elements in it. Good for checking error messages.
 *
 * @returns {array} Array of elements texts
 */
async function getTexts(world, elements, message = '', expectingText = true) {
    const foundElements = await world.driver.findElements(elements);

    const texts = [];

    for (let i = 0; i < foundElements.length; i++) {
        let foundText = await foundElements[i].getText();
        texts.push(foundText);
    }

    return texts;
}

/**
 * Get text of an element
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the elements whose texts are being checked.
 * @returns {string} the element text.
 */
async function getText(world, locator) {
    const locatedElement = await waitToBeLocated(world, locator, 'Could not find the text field!');

    //get text is not always the right means to get text, if getText does not work, it returns an empty string
    // sometimes we want the value attribute instead.

    let elementText = await locatedElement.getText();

    if (elementText === '') {
        elementText = await getElementAttribute(world, locator, 'value');
    }

    if (elementText === ' ') {
        elementText = await getElementAttribute(world, locator, 'value');
    }

    return elementText;
}

/**
 * Clear an input field, then enter text into the field.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that identifies the input box to enter text into.
 * @param {string} text - The text to put in the input field.
 * @param {boolean} [ignore=false] - Set this parameter to true if the field should not be cleared (date fields) or the value is reformatted after entry. Example: Phone number 1112223333 becomes (111) 222-3333
 * @param {string} message - the error message to provide in the test report if there is an error.
 * @param {boolean} [visibleWait=true] - set to false in order to wait to be located instead of visible.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the text in the input field is what we expected.
 */
async function enterText(world, locator, text, ignore = false, message = '', visibleWait = true) {
    const input = (visibleWait) ? await waitToBeVisible(world, locator, message) : await waitToBeLocated(world, locator, message);
    if (!ignore) {
        await clearField(world, locator);
    }

    await input.sendKeys(text);

    //wait for animations or other oddities.
    await world.driver.sleep(300);

    if (!ignore) {
        const foundText = await getElementAttribute(world, locator, 'value');
        if (foundText !== text) {
            throw new Error(`The value ${text} was not entered in the field ${locator}`);
        }
    }
}

/**
 * Clear an input field. Do not use this on date fields or anything with values that persist after clearing.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the elements whose texts are being checked.
 * @return {Element} The [Selenium WebElement]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html} that was cleared.
 */
async function clearField(world, locator) {
    const field = await waitToBeVisible(world, locator, `Could not locate the input field: ${locator}`);
    await field.clear();
    field.getAttribute('value').should.become('', `Could not clear the input field: ${locator}`);
    return field;
}

/**
 * Clear an input field using the backspace character
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the elements whose texts are being checked.
 * @return {Element} The [Selenium WebElement]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html} element that was cleared.
 */
async function clearWithBackSpace(world, locator) {

    let text;
    const element = await waitToBeLocated(world, locator);

    text = await getText(world, locator);

    if (text.length < 1) {
        text = await getElementAttribute(world, locator, 'value');
    }

    for (let i = 0; i < text.length; i++) {
        await element.sendKeys(Key.BACK_SPACE);
        await waitSeconds(world, .002);
    }

    const emptyText = getText(world, locator);
    if (emptyText === '') {
        throw new Error(`Unable to clear the input field ${locator}`);
    } else {
        return element;
    }


}

/**
 * Find the text of an element and compare it to a string.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the element whose text is being checked.
 * @param {string} text - The text that is expected.
 * @param {string} [message=''] - The custom error message, meant to indicate the true nature of the error as opposed to a missing element.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the element matches the expected text.
 */
async function expectText(world, locator, text, message = 'The text did not match') {
    const element = await waitToBeVisible(world, locator);
    const elementText = await element.getText();

    await expect(elementText).to.equal(text, message);
}

/**
 * Find the text of an element and verify it contains a string.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the element to get the text from.
 * @param {string} text - The text to compare it to.
 * @param {string} message - The error message to throw if there is a failure
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the page being visited has the expected title.
 */
async function expectTextContains(world, locator, text, message = '') {
    const element = await waitToBeVisible(world, locator);
    return element.getText().should.eventually.contains(text, (message === '') ? 'The text did not contain the phrase' : message);
}

/**
 * Find the element from a given list that mat87ches the text provided and return that element.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the element whose text is being checked.
 * @param {string} label - The element text to match.
 * @param {Boolean} ignoredCase - whether to ignore the list item case
 * @param {Boolean} exactMatch - Changes the function to find an element containing the text
 * @return {element} Either the array of [Selenium WebElement(s)]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html} that match the element or the [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the array has more than zero elements.
 */
async function pickOne(world, locator, label, ignoredCase = true, exactMatch = true) {
    const resolvedList = await promise.filter(
        world.driver.findElements(locator),
        async (listItem) => {
            const item = await world.driver.wait(until.elementIsVisible(listItem));
            let text = await item.getText();
            if (ignoredCase) {
                text = text.toLowerCase();
                label = label.toLowerCase();
            }
            if (exactMatch ? text.trim() === label : text.trim().includes(label)) {
                return true;
            }
            return false;

        }
    );
    try {
        if (resolvedList.length > 0) {
            return resolvedList;
        } else {
            throw new Error(`Could not find element any element with label'${label}'`);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Switch to the next opened browser tab
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @return {Promise} - Promise resolution that the tab has switched to the subsequent tab of the browser.
 */
async function switchToNextTab(world) {
    const handles = await world.driver.getAllWindowHandles();
    const handle = await world.driver.getWindowHandle();
    const index = handles.indexOf(handle);
    await world.driver.switchTo().window(handles[(index + 1) < handles.length ? index + 1 : handles.length - 1]);
}

/**
 * Command the browser to navigate to a specific page.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {string} url - The application page to visit.
 * @param {string} [title=''] title - An optional string used to validate the page title after navigating to the page.
 * @param {int} wait - An optional element to wait on before checking the page title.
 * @param {boolean} ignoreUrl - set to true if you want to skip the url check.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the page being visited has the expected title.
 */
async function navigateToPage(world, url, title = '', wait = 1, ignoreUrl = false) {
    // await world.driver.manage().window().maximize();
    await world.driver.get(url);
    //Give the browser a few seconds to open and load the page.
    await world.driver.sleep(1000 * wait);
    if (!ignoreUrl) {
        await world.driver.getCurrentUrl().should.become(url, `The url ${url} could not be reached`);
    }
    await waitSeconds(world, wait);
}

/** Refresh the browser window.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {number} seconds - the amount of time to wait after refreshing the page.
 * @return {void} - Lets you know when the refresh is complete
 */
async function refreshPage(world, seconds = 7) {
    await world.driver.navigate().refresh();
    await waitSeconds(world, seconds);
}

/**
 * Verify that a page url contains an expected string
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {string} url - The application page to visit.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the page being visited has the expected title.
 */
async function verifyPageUrl(world, url) {
    return world.driver.getCurrentUrl().should.eventually.contain(url, 'The page url is not correct');
}

/**
 * This is used for all mouse clicks.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that identifies the input box to enter text into.
 * @param {boolean} [visibleWait=false] - A [Selenium WebElement]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html} that should be visible before clicking the `locator` item.
 * @param {string} [message=''] - The custom error message, meant to indicate the true nature of the error as opposed to a missing element.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the text in the input field is what we expected.
 */
async function clickElement(world, locator, visibleWait = false, message = '') {
    //either wait for an element to be located, or wait for it to be visible.
    const element = (visibleWait) ? await waitToBeVisible(world, locator, message) : await waitToBeLocated(world, locator, message);

    try {
        await element.click();
    } catch (error) {
        throw new Error(`Could not click on the element '${locator} \n ${error}'`);
    }
    await waitSeconds(world, .5);
    return element;
}

/**
 * Find all of the elements matching a selector, then compare the text of each element until a match is found. When a match is found, click on the element.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {!By} locator - The {@link WebDriver} method that locates the list of elements being scanned for label.
 * @param {string} label - The text of the list item to be clicked.
 * @param {Boolean} ignoredCase - whether to ignore the list item case
 * @param {Boolean} exactMatch - whether to click on the first item that contain the given label
 * @param {string} [message=''] - The custom error message, meant to indicate the true nature of the error as opposed to a missing element.
 * @return {Element} The [Selenium WebElement]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html} element that was clicked on.
 */
async function clickListItem(world, locator, label, message = '', ignoredCase = true, exactMatch = false) {
    await waitToBeLocated(world, locator, message);
    const picked = await pickOne(world, locator, label, ignoredCase, exactMatch);

    try {
        await picked[0].click();
    } catch (e) {
        throw new Error(`Could not click on an element with text: ${label} \n ${e}`);
    }
    await waitSeconds(world, .5);
    return picked;
}

/**
 * Resolve a step after performing any necessary conditional checks.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {*} result - The result of the original Promise, passed through as-is.
 * @return {Promise} A resolved Promise.
 */
async function resolveStep(world, result) {
    return Promise.resolve(result);
}

/**
 * Reject a step after performing any necessary conditional checks.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {SkippedError} error - The error generated in the step.
 * @return {Promise} A rejected Promise.
 */
async function rejectStep(world, error) {
    if (error.name === 'SkippedError') {
        world.attach(error.message);
        return Promise.resolve('skipped');
    }
    return Promise.reject(error);
}

/**
 * verify the page title is a specific string
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {string} title - the expected title of the page
 * @returns {Promise<void>} Assertion that the page title the same as the specified input.
 */
async function verifyPageTitle(world, title) {
    await world.driver.getTitle().should.become(title, 'The page title is not correct:');
}

/**
 * Verify that the page URL contains a string, can be a substring of a larger URL as an example.
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {string} url - the string you want to verify is part of the URL
 * @returns {Promise<void>} Assertion that the URl contains the string input.
 */
async function verifyPageUrlContains(world, url) {
    await world.driver.getCurrentUrl().should.eventually.contain(url, 'The page url is not correct');
}

/**
 * returns the URL of a page
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @returns {Promise<*>} the url of the page
 */
async function getPageUrl(world) {
    return await world.driver.getCurrentUrl();
}

/**
 * Retrieve data from the file specified. Data files must be present in the ./data folder
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {string} fileName - The core portion of the filename used to retrieve the data.
 * @param {string} keyName - The name of the data value to retrieve.
 * @return {string|string[]} The data being requested.
 */
async function getDataValues(world, fileName, keyName) {
    const data = require(`${process.cwd()}/data/${fileName.replace(/\s/g, '')}Data`)(world);
    return await get(data, keyName, '');
}

/**
 * Helper method to find the number of elements matching a locator and return the count.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The locator to identify all of the elements on the page.
 * @returns {number} - The size of the array of elements matching the locator.
 */
async function getElementCount(world, locator) {
    let elements = await world.driver.findElements(locator);
    return elements.length;
}

/**
 * Get the index of an element that have the text match the given table
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {!(By|Function)} locator - element locators
 * @param {String} value - value of the element that want to find the index of
 * @param {boolean} exactMatch - set to false if the text match uses contains instead of exactly equals
 * @return {Promise} the positional index of the located element using the matching element text.
 */
async function getElementIndex(world, locator, value, exactMatch = true) {
    const texts = await getTexts(world, locator);

    if (texts.length === 0) {
        throw new Error(`Did not find any elements matching ${locator}`);
    }

    if (exactMatch) {
        if (texts.indexOf(value) === -1) {
            throw new Error(`Elements found by locator does not contain the value: ${value}`);
        }
        return texts.indexOf(value) + 1;
    } else {
        for (let i = 0; i < texts.length; i++) {
            if (texts[i].includes(value)) {
                return i + 1;
            } else {
                throw new Error(`Elements found by locator does not contain the value: ${value}`);
            }
        }
    }
}

/**
 * Wait for the page title contains the given text
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {String} text - given text to assert
 * @param {number} timeout - timeout
 * @return {Promise} The title of the page
 */
async function waitUntilTitleContains(world, text, timeout = 15000) {
    const title = await world.driver.wait(until.titleContains(text), timeout);

    if (title !== text) {
        throw new Error(`Timeout: The title does not contain ${text} after ` + timeout / 1000 + ' seconds');
    }
    return title;
}

/**
 * switch to any tab on the browser. If the index is less than 0, the first tab will be selected. If the index is greater the number of tabs, the last
 * tab will be selected
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {number} index - tab index
 * @return {Promise} - Promise resolution that the browser tab has been changed to the indexed tab.
 */
async function switchToTab(world, index) {
    const handles = await world.driver.getAllWindowHandles();
    await world.driver.switchTo().window(handles[index < handles.length ? (index > 0 ? index : 0) : handles.length - 1]);
}


/**
 * Opens a new tab and navigates to the specified URL.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {string} url - The specified URl to visit. Note that this must be formatted properly with https and www in the string.
 * @return {Promise} - Promise resolution that a new tab has been opened to the specified URL.
 */
async function openInNewTab(world, url) {
    await world.driver.executeScript('window.open()');
    await switchToNextTab(world);
    await navigateToPage(world, url);
    await verifyPageUrl(world, url);
}


/**
 * Verify that all elements are visible on the page
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {object|Array<Element>} elements - The {@link WebDriver} method that locates the elements
 * @param {boolean} [visible=true] - set to false in order to only wait for located
 * @param {int} [waitTime=1000] - The number of milliseconds to wait for the element to be visible/located.
 * @return {Promise} assert that every elements are visible on the page
 */
async function verifyElements(world, elements, visible = true, waitTime = 1000) {
    for (const key in elements) {
        if (elements.hasOwnProperty(key)) {
            if (visible) {
                await waitToBeVisible(world, elements[key], `Element ${key} is not visible`, waitTime);
            } else {
                await waitToBeLocated(world, elements[key],`Element ${key} can not be located`, waitTime);
            }
        }
    }
}

/**
 * Scroll the page so that the element is visible on the view
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the elements whose texts are being checked.
 * @return {Promise} - Promise resolution that the browser javascript executor has changed the scroll position of the page.
 */
async function scrollIntoView(world, locator) {
    const element = await waitToBeLocated(world, locator);
    await world.driver.executeScript('arguments[0].scrollIntoView(true);', element);
    return element;
}

/**
 * Get the dimensions of the browser
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @return {object<{width: number, height: number}>} The size of the browser for use with responsive layouts
 */
async function getWindowSize(world) {
    return await world.driver.manage().window().getSize();
}

/**
 * Creates a random @email.com email address that is intended to be unique
 *
 * @param {string} domain - An optional user specified domain for email addresses.
 * @returns {string} a string formatted into an email address with a random number.
 */
async function randomEmail(domain = 'email.com') {
    let string = '';
    const characters = '0123456789';

    for (let i = 0; i < 7; i++) {
        string += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `qaTest${string}@${domain}`;
}

/**
 * Creates a random string of numbers.
 *
 * @param {string} size - the length of the random number to be created
 * @returns {string} a string formatted into an email address with a random number.
 */
async function randomNumber(size) {
    let random = '';
    const characters = '0123456789';

    for (let i = 0; i < size; i++) {
        random += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return random;
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
 * Get a random String
 * @param {number} size - length of the string
 * @return {String} a string
 */
async function randString(size) {
    let random = '';
    const characters = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';

    for (let i = 0; i < size; i++) {
        random += await characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return random;
}

/**
 * Generate a unique Id
 * @return {String}
 */
async function generateId() {
    return uuid();
}

/**
 * Get an attribute of an element
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - element locator
 * @param {String} attribute - element attribute
 * @return {Promise} - The attribute of the element
 */
async function getElementAttribute(world, locator, attribute) {
    const element = await world.driver.findElement(locator);
    return element.getAttribute(attribute);
}

/** check if attribute is present for an element
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - element locator
 * @param {String} attribute - element attribute
 * @return {boolean} - true or false if the attribute is present.
 */
async function verifyAttributePresence(world, locator, attribute) {
    const result = await world.driver.findElement(locator).getAttribute(attribute);
    return result !== null;
}

/**
 * Get a Css Value of an element
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - element locator
 * @param {String} prop - element css style property
 * @return {Promise} - The css value
 */
async function getElementCssValue(world, locator, prop) {
    const element = await waitToBeVisible(world, locator);
    return await element.getCssValue(prop);
}

/** Press the return button for when a field has no submit button.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - element in focus. The same one you typed into with enterText
 */
async function pressReturn(world, locator) {
    const element = await waitToBeLocated(world, locator);
    await element.sendKeys(Key.RETURN);
    await waitSeconds(world, .5);
    return element;
}

/** Press the return button for when a field has no submit button.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - element in focus. The same one you¬ typed into with enterText
 */
async function pressTab(world, locator) {
    const element = await waitToBeLocated(world, locator);
    await element.sendKeys(Key.TAB);
    return element;
}

/**
 * Find all of the elements matching a locator, then compare the text of each element to a an array provided by some source.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the elements to check.
 * @param {array} values - an array of strings to verify against the locator array of strings.
 * @param {string} message - an error message to display if the compare fails.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the page being visited has the expected title.
 */
async function compareListContents(world, locator, values, message = '') {
    const elementTexts = await getTexts(world, locator);
    expect(elementTexts, message !== '' ? message : 'Lists do not match').to.have.ordered.members(values);
}

/**
 * Convert a rgba value to hex value
 * @param {String| Array<number>} value - rgba value
 */
async function rgbaToHex(value) {
    let result = '#';
    if (typeof value === 'string')
        value = value.match(/\d+,\s*\d+,\s*\d+,\s*\d*/)[0].split(/\s*,\s*/);
    value.forEach((val, index) => {
        if (index < 4)
            result += parseInt(val).toString(16).padStart(2, '0');
        else if (index === 4)
            result += Math.round(parseInt(val) * 255).toString(16).padStart(2, '0');
    });
    return result;
}

/**
 * Convert a string to camel style string
 *
 * @param {string} str - The string to be converted to camelCase.
 * @return {string} The string converted to camelCase.
 */
async function toCamelCase(str) {
    return str.toLowerCase()
        .replace('+', 'Plus')
        .replace(/\W/g, ' ')
        .replace(/\s+(.)/g, function ($1) {
            return $1.toUpperCase();
        })
        .replace(/\s/g, '');
}

/**
 * Retrieves the relative time frame and input value and compares the calculated date to the date reported by the UI.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} timeFrameInput - The {@link WebDriver} method that identifies the input box for the relative time amount.
 * @param {method} timeFrameSelect - The {@link WebDriver} method that identifies the `<select />` dropdown representing the relative time frame.
 * @param {method} timeFrameLabel - The {@link WebDriver} method that identifies the element containing the calculated relative date and time.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the relative date has been set.
 */
async function checkDateRange(world, timeFrameInput, timeFrameSelect, timeFrameLabel) {
    let units = {}, timeFrom = '';
    const start = moment();
    // const timeFrameInput = await waitToBeLocated(world, locator);
    world.driver.findElement(timeFrameInput).getAttribute('value').then((timeFrameValue) => {
        timeFrameValue = parseInt(timeFrameValue);
        units = {
            's': {text: 'Seconds ago', range: {seconds: timeFrameValue}},
            'm': {text: 'Minutes ago', range: {minutes: timeFrameValue}},
            'h': {text: 'Hours ago', range: {hours: timeFrameValue}},
            'd': {text: 'Days ago', range: {days: timeFrameValue}},
            'w': {text: 'Weeks ago', range: {weeks: timeFrameValue}},
            'M': {text: 'Months ago', range: {months: timeFrameValue}},
            'y': {text: 'Years ago', range: {years: timeFrameValue}},
        };
        world.driver.findElement(timeFrameSelect).getAttribute('value').then((timeFrameRange) => {
            timeFrom = 'From: ' + start.subtract(units[timeFrameRange].range).format('YYYY-MM-DD');
            expectTextContains(world, timeFrameLabel, timeFrom).then(() => {
            }, (error) => {
                return Promise.reject(`When adjusting the time range, the new value '${timeFrom}' ` +
                    `does not match the expected value '${error.actual.slice(0, 16)}'`);
            });
        });
    });
}

/**
 * Find all of the elements matching a locator, then compare the text of each element to a table list provided by a feature file.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - The {@link WebDriver} method that locates the elements to check.
 * @param {object} table - The table provided by the feature file.
 * @return {Promise} [Chai as Promised]{@link https://github.com/domenic/chai-as-promised} assertion that the page being visited has the expected title.
 */
async function verifyFeatureTableContents(world, locator, table) {
    await waitToBeVisible(world, locator);
    let providedList = [];
    const foundList = await getTexts(world, locator);

    for (let i = 0; i < table.rawTable.length; i++) {
        providedList.push(table.rawTable[i][0]);
    }

    expect(foundList, 'Lists do not match').to.have.ordered.members(providedList);
}


/**
 * Wait until all elements for a locator are not visible on the page.
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {Element} target - The [Selenium WebElement]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/
 * @param {int} [timeout=2500] - timeout(ms)
 * @param {String} error - error message when fails
 * @return {Promise} - resolution of waitToBeHidden
 */

async function waitToBeHidden(world, target, timeout = 25000, error = null) {
    const elements = await getElementCount(world, target);

    if (elements < 0){
        throw new Error(`waitToBeHidden: Can not find any elements matching locator ${locator}`)
    }

    const element = await waitToBeLocated(world, target);

    try {
        await world.driver.wait(until.elementIsNotVisible(element), timeout, error ? 'Timeout: The element is still visible after ' + timeout / 1000 + ' seconds' : error);
    } catch (e){
        throw new Error(`Error waiting to be hidden: ${e}`);
    }

}

/**
 * Wait until the element contains a specific text. Useful for element text that will change
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {method} locator - element locator
 * @param {String} text - assertion text
 * @param {number} timeout - timeout milliseconds
 * @param {String} error - custom error
 */
async function waitUntilTextContains(world, locator, text, timeout = 30000, error = null) {
    const element = await world.driver.findElement(locator);
    await world.driver.wait(until.elementIsVisible, timeout, error === null ? 'Timeout: The element is not visible after ' + timeout / 1000 : error);
    await world.driver.wait(until.elementTextContains(element, text), timeout, error === null ? 'Timeout: The element is not visible after ' + timeout / 1000 + ` seconds or the text does not contains ${text}` : error);
}


/**
 * Hover over an element and verify if the expected element is visible
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {!(By|Function)} hover - element locator that will be hovered on
 * @param {!(By|Function)} elementClick - expected element that will be visible after hovering
 * @return {Promise} Assert that the expected element is visible when hover the mouse over the element
 */
async function hoverOverElementAndClick(world, hover, elementClick) {
    const element = await world.driver.findElement(hover);

    const actions = world.driver.actions({async: true});
    await actions.move({origin: element}).perform();

    await waitSeconds(world, 1);
    await element.click();
    await waitSeconds(world, 2);
}


/**
 * Hover over an element and verify if the expected element is visible
 *
 * @param {object} world - The custom [Cucumber World]{@link https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/world.md} instance.
 * @param {!(By|Function)} hover - element locator that will be hovered on
 * @return {Promise} Assert that the expected element is visible when hover the mouse over the element
 */
async function hoverOverElement(world, hover) {
    const element = waitToBeLocated(world, hover);
    const actions = world.driver.actions({async: true});
    await actions.move({origin: element}).perform();
    await waitSeconds(world, 1);

}

module.exports = {
    waitToBeVisible,
    waitToBeLocated,
    waitToBeHidden,
    waitSeconds,
    getTexts,
    getText,
    enterText,
    pressTab,
    clearField,
    clearWithBackSpace,
    expectText,
    expectTextContains,
    pickOne,
    switchToNextTab,
    navigateToPage,
    refreshPage,
    verifyPageUrl,
    clickElement,
    clickListItem,
    resolveStep,
    rejectStep,
    verifyPageTitle,
    verifyPageUrlContains,
    getPageUrl,
    getDataValues,
    getElementCount,
    getElementIndex,
    waitUntilTitleContains,
    waitUntilTextContains,
    switchToTab,
    openInNewTab,
    verifyElements,
    scrollIntoView,
    getWindowSize,
    randomEmail,
    randomNumber,
    currentDateTime,
    randString,
    generateId,
    getElementAttribute,
    verifyAttributePresence,
    getElementCssValue,
    pressReturn,
    compareListContents,
    rgbaToHex,
    toCamelCase,
    verifyFeatureTableContents,
    hoverOverElementAndClick,
    hoverOverElement,

};

