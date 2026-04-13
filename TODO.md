BUGS/ISSUES:

Swipe image -> Press undo -> Kept/Discarded value doesn't revert

Logo in header displays at very top of screen on android (in same area as phone (system) notification bar and pinhole camera on S24+)
    Need to move logo down a bit so that it isn't getting covered

System top bar (notification bar and time bar on OneUI) displaying as black/gray over our application
    Is there a way to change which color this displays as?

New dataset create button displays as a thin white bar with no text on Android

When swiping, the next image temporarily flashes the previous image during transition.

=============================================================================================================================

FEATURES TO ADD:

Dataset counts (approved/rejected/pending) on the Datasets tab go stale during a swipe session.
    useFocusEffect from @react-navigation/native could reload the summary when the user returns to the Datasets tab.

Update dataset thumbnail (recent_image) after swiping — newly approved images won't appear as the card thumbnail until the summary is re-fetched.

Keyboard covers form input fields when creating a dataset on the Datasets screen.
    Consider KeyboardAvoidingView or scroll-on-focus behavior.

Submit form on enter press when logging in.

Review screen for browsing approved/rejected images in a dataset.
