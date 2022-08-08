@referenceTest
Feature: referenceTest.feature

  This is a an example feature to demonstrate how to write automated test steps for the passport application

  @366631 @TEST1
  Scenario: TEST1 verify cucumber and selenium can open a page and verify the url
    Given I navigate to the page "https://www.google.com/"
    And I wait "1" seconds
    And I verify that the page url contains "google"

  @366632 @TEST2
  Scenario: TEST2 verify cucumber and selenium can open a page and verify the page title
    Given I navigate to the page "https://www.google.com/"
    And I wait "1" seconds
    And I verify that the page title is "1Google"
