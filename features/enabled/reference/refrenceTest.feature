@referenceTest
Feature: referenceTest.feature

  This is a an example feature to demonstrate how to write automated test steps

  @TEST1
  Scenario: TEST1 verify cucumber and selenium can open a page and verify the url

    This test is expected to pass

    Given Navigate to the page "https://www.google.com/"
    And Wait "1" seconds
    And Verify that the page url contains "google"

  @TEST2
  Scenario: TEST2 verify cucumber and selenium can open a page and verify the page title

    This test is expected to fail

    Given Navigate to the page "https://www.google.com/"
    And Wait "1" seconds
    And Verify that the page title is "1Google"

  @TEST3 @skip
  Scenario: TEST3 verify cucumber and selenium can open a page and verify the page title

  This test is expected to be skipped

    Given Navigate to the page "https://www.google.com/"
    And Wait "1" seconds
    And Verify that the page title is "Google"
