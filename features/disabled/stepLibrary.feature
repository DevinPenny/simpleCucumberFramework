@stepLibrary
Feature: stepLibrary.feature

  This is a an example feature to document the steps provided for testing

  Scenario: This is to be used as a documentation library for feature file steps that anyone can use.

    Each web page generally requires 4 things you need to do, click, enter text, get text, and wait
    With this overall strategy, you can create feature files that only require a small number of steps
    in order to test a large number of scenarios within a page of a web application.

#    Navigates to a specified page, takes a url as a string
    Given Navigate to the page "https://www.google.com/"

#    wait a specified amount of time, takes a number as a string
    And Wait "1" seconds

#    verify the page url against a specified string
    And Verify that the page url contains "google"

#    enters a value in a text field, takes two string params. the value you want to enter and the named locator in elements
    And Enter the value "test" in the "search" bar

#    clicks on a specified button, takes a string that relates to the page element button
    And Click on the "search" button on the "search" page

