#IDEAS

##Collaborative datasets

###Idea

Create a way for users to add other users to their datasets, that way the dataset is shared.
Shared dataset will allow for users to all be able to swipe for images from the gathered images at the same time.
This would be done by keeping the main buffer of images in the dataset, then partitioning those images into user
 specific buffers, ensuring pagination is kept consistent and no duplicate images are sent.

##More image sources

###Idea

Allow the user to decide which provider to gather images from (Wikimedia Commons, Unsplash, Pexels, etc.).
Database already allows for this to be implemented via the provider_offsets JSONB.
New services for each provider would need to be created.
