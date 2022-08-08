/**
 * Custom errors created for use by the framework.
 *
 * @module errors
 */
module.exports = {};

/**
 * Creates a custom Error type that shows a test did not meet a certain condition, but does not necessarily mean the test failed.
 *
 * @extends Error
 */
class SkippedError extends Error {
    /**
     * Create the custom Error for when we want to skip a test instead of create a failure. EX: environment did not have data
     *
     * @param {string} message - The message relayed by the error.
     * @param {array|object} params - The remaining parameters passed to the error.
     */
    constructor(message, ...params) {
        super(message, ...params);
        this.name = this.constructor.name;
    }
}

/**
 * A custom error when an XHR request is unauthorized.
 *
 * @extends Error
 */
class UnauthorizedError extends Error {
    /**
     * Create the custom Error.
     *
     * @param {string} message - The message relayed by the error.
     * @param {array|object} params - The remaining parameters passed to the error.
     */
    constructor(message = 'Unauthorized', ...params) {
        super(message, ...params);
        Object.assign(this, ...params);
        this.name = 'UnauthorizedError';
    }
}

module.exports = {
    SkippedError,
    UnauthorizedError,
};
