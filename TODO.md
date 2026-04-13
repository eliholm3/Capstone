BUGS/ISSUES:

Swipe image -> Press undo -> Kept/Discarded value doesn't revert

Logo in header displays at very top of screen on android (in same area as phone (system) notification bar and pinhole camera on S24+)
    Need to move logo down a bit so that it isn't getting covered

System top bar (notification bar and time bar on OneUI) displaying as black/gray over our application
    Is there a way to change which color this displays as?

New dataset create button displays as a thin white bar with no text on Android — may be a styling issue with the inline form introduced in the bottom nav refactor, needs testing on device.

when swiping, when the next image displays, it temporarily shows the previous image in a flash.

=============================================================================================================================

FEATURES TO ADD:

Dataset counts (approved/rejected/pending) on the Datasets tab go stale during a swipe session.
    useFocusEffect from @react-navigation/native could reload the summary when the user returns to the Datasets tab.

Update dataset thumbnail (recent_image) after swiping — newly approved images won't appear as the card thumbnail until the summary is re-fetched.

Change preview image to one that is in the dataset after dataset creation

Update dataset selection card during session (either when re-opening view or dynamically after each swipe)

Keyboard kind of covers form input fields when creating dataset, possibly fix this

Submit form on enter press when logging in

I think at some point we said that there would be a review screen for reviewing your choices. perhaps this could be added.
