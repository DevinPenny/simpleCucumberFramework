@referenceTest
Feature: referenceTest.feature

  This is a an example feature to demonstrate how to write automated test steps for the passport application

  @TEST1
  Scenario: TEST1 verify cucumber and selenium can open a page and verify the url

    This test is expected to pass

    Given I navigate to the page "https://www.google.com/"
    And I wait "1" seconds
    And I verify that the page url contains "google"

  @TEST2
  Scenario: TEST2 verify cucumber and selenium can open a page and verify the page title

    This test is expected to fail

    Given I navigate to the page "https://www.google.com/"
    And I wait "1" seconds
    And I verify that the page title is "1Google"

  @TEST3 @skip
  Scenario: TEST3 verify cucumber and selenium can open a page and verify the page title

  This test is expected to be skipped

    Given I navigate to the page "https://www.google.com/"
    And I wait "1" seconds
    And I verify that the page title is "Google"
