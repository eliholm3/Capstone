BUGS/ISSUES:

When swiping, the next image temporarily flashes the previous image during transition.

=============================================================================================================================

FEATURES TO ADD:

Dataset counts (approved/rejected/pending) on the Datasets tab go stale during a swipe session. useFocusEffect from @react-navigation/native could reload the summary when the user returns to the Datasets tab.

Update dataset thumbnail (recent_image) after swiping — newly approved images won't appear as the card thumbnail until the summary is re-fetched.

Keyboard covers form input fields when creating a dataset on the Datasets screen. Consider KeyboardAvoidingView or scroll-on-focus behavior.

Submit form on enter press when logging in.

Review screen for browsing approved/rejected images in a dataset.
