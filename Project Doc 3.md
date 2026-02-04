# Capstone I - Project Documentation III

## Mobile Image Dataset Builder

**Team Members:**
- Xavier Hampton
- Eli Holm
- Keehin McCann
- Wyatt Allinger

---

## Table of Contents

1. [Project Documentation I](#project-documentation-i)
   - [Team Information](#team-information)
   - [Introduction](#introduction)
   - [Requirements](#requirements)
2. [Research Documentation](#research-documentation)
   - [Image Source and Data Collection](#image-source-and-data-collection)
   - [Database Design and Storage](#database-design-and-storage)
   - [Frontend Framework Choice](#frontend-framework-choice)
   - [Backend Framework and API Design](#backend-framework-and-api-design)
   - [UI/UX Design](#uiux-design)
   - [Deployment and Hosting](#deployment-and-hosting)
   - [Licensing and Legal Concerns](#licensing-and-legal-concerns)
3. [Project Documentation II](#project-documentation-ii)
   - [System Architecture](#system-architecture)
   - [Database Design](#database-design)
   - [Backend & API Design](#backend--api-design)
   - [Frontend & UI/UX](#frontend--uiux)
   - [Image Collection Flow](#image-collection-flow)
   - [Deployment Flow CI/CD Pipeline](#deployment-flow-cicd-pipeline)
4. [Project Documentation III](#project-documentation-iii)
   - [Development Strategy](#development-strategy)
   - [Development Timeline/Schedule](#development-timelineschedule)
   - [Work Delegation](#work-delegation)
   - [Contingency Planning](#contingency-planning)
   - [Roadblocks](#roadblocks)
   - [Testing Plan](#testing-plan)

---

# Project Documentation I

## Team Information

### Group 1

| Member | Role & Bio |
|--------|------------|
| **Xavier Hampton** | **Backend & API Integration** - 3rd year student studying Computer Science. I like data structures and algorithms. |
| **Eli Holm** | **Deployment** - 3rd year studying computer science. I am interested in using ML solutions to solve complex data problems. |
| **Keehin McCann** | **Frontend/Backend** - 3rd year studying Computer Science. I'm most interested in low level programming. |
| **Wyatt Allinger** | **UI/UX & App design** - 3rd year student studying Computer Science and Information Technology. I'm interested in technology consulting and implementing/managing IT systems in an enterprise environment. |

### Our Mentor

**Bill Chapin**
Owner of Gate 67 Consulting
Email: Bill.chapin@gate67consulting.com

We chose Bill because he has an extensive background in the technology sector. He has multiple decades of experience managing M&A from a technological standpoint, as well as managing projects in an enterprise environment.

### Our Mission

> We believe in enhancing the lives of everyday developers. Developers change the world from providing quick EMS services to creating a model making the next medical breakthroughs. If we can create a tool that speeds up the development process, we have done our job of giving time back to the people who make the world a better place.

---

## Introduction

### Problem Statement

Gathering data for machine learning starting from scratch and without a tool is often a long process, and it can take a while to gather and filter data. This takes time away from creating the actual model and can add unneeded complexities to a project.

### Problem Resolution

We plan to solve this problem by creating a program that scrapes images from the internet and puts them in a database. An app will then allow users to swipe left to reject the photo or right to confirm the photo.

### Benefits of Solution

This will make the process of gathering data for a project easier and more streamlined. The main solution is that it will save time for anyone working on a project that involves scraping for their machine learning models.

---

## Requirements

### Hardware/Software Requirements

#### Mobile Application

**iOS:**
- OS: iOS 17 or newer
- Device: iPhone XR or iPhone SE (2nd Generation) or newer
- Internet connection required

**Android:**
- OS: Android 13 or newer
- CPU: 4 Cores, 1.4 GHz clock speed
- RAM: 2 GB
- Storage: 16 GB
- Display: 3.3 inches
- Internet connection required

#### Desktop Application

- OS: Windows 10, Windows 11
- CPU: 2 Cores, 1 GHz clock speed
- RAM: 4 GB
- Storage: 64 GB
- Display: 720p, 9" display
- Internet connection required

#### Browser Application

- Chrome
- Chromium based
- Firefox
- Safari

#### Server

- CPU: 4 Cores, 1.4 GHz clock speed
- RAM: 2 GB
- Storage: 50 GB (Varies depending on data stored by users)

### Functional Requirements

- Users will create a user account with username and password
- Users will login before being able to classify or export data
- Users should be able to access an app on their phone
- Users should be able to swipe either direction, right to confirm photos, left to reject photos
- Users should be able to access their previously confirmed and unconfirmed photos
- The app should be able to produce a clean database with the images the user has selected
- Have an API endpoint that the database could point to
- User can pay for more space if needed
- An export will be available in a zip file format
  - Photos will be PNG or JPEG
- Admin accounts will be pre provisioned as necessary
- Admins will have database access and will be able to access debugging features in the app

### Non-Functional Requirements

- There should consistently be pictures for a user to approve/deny
- The app should have a clean UI
  - The user should not have any confusion when using the app with helpful UI elements
  - Provide more space for a user if needed

---

# Research Documentation

## Introduction to Research Section

This section will cover the areas of the **Image Scraper & User Labeling Tool** that we still have questions about. The goal of this section is to answer our questions and give us a better idea of what we will need to do to create our application. Some of the topics covered in this section include the image sources, database design, and UI/UX.

---

## Image Source and Data Collection

### Introduction & Thesis

Collecting a large number of images for the user to sort through is a challenging problem. The basis of our application relies on the initial collection of images that may be relevant to the user's needs. This means that we need an image source that contains many images that can be searched with related labels, and the source must allow for easy access to these images. Wikimedia Commons offers an open, reliable, and well documented API that will allow for free access to a vast library of public domain images, making it the easiest and most ethical source of images.

### Problem Statement

Collecting large image datasets is difficult due to licensing restrictions, anti-scraping rules, and limited APIs, so we need an image source that permits high-volume downloads of images with permissive licenses.

### Research

There were three main platforms that we examined to determine which source we should gather images from: Wikimedia Commons, Unsplash, and Pexels.

| Source | Pros | Cons |
|--------|------|------|
| **Wikimedia Commons** | Large collection of images; API allows for structured queries; Contains a large number of public domain images; Reliable metadata | Some low quality images; API requires handling pagination |
| **Unsplash** | High quality images; Easy to use API | Restrictive license for machine learning dataset use; Limited free API rate |
| **Pexels** | Simple API; Quality images | Unclear legal use for machine learning datasets; Limited metadata |

### Conclusion

After comparing the three sources, we have decided that we will use Wikimedia Commons as our source for images. This is because of the vast number of images that are public domain, as well as the ease of use with the official API. This will allow for our application to ethically and efficiently gather images for machine learning use.

Our application will integrate with the Wikimedia Commons API in order to fetch images relating to the search term provided by the user. The system will store the image URLs and metadata, thus keeping track of the images without having to download them. Only images that are kept by the user will be stored when the user decides to export their dataset.

### Citations

- Wikimedia Foundation. *"Wikimedia Commons API Documentation."* https://commons.wikimedia.org/wiki/Commons:API
- Unsplash Developers. *"Unsplash API Guidelines."* Unsplash, 2024, https://unsplash.com/documentation
- Pexels. *"API Documentation."* Pexels, 2024, https://www.pexels.com/api/

---

## Database Design and Storage

### Introduction & Thesis

A well-structured database is critical for storing and managing large collections of labeled images efficiently. For our project, we needed a database that could track images, user confirmations, metadata, and support scalable queries for multiple clients.

### Problem Statement

How can we design a database that efficiently manages metadata for thousands of images while remaining scalable, cost-effective, and easy to query for our mobile and web apps?

### Research

Several database options were considered for our project:

- **Relational Databases (PostgreSQL, MySQL)**: Provide structured tables, strong data integrity, and support for complex queries. PostgreSQL is particularly known for its advanced indexing, foreign key relationships, and scalability.
- **NoSQL Databases (MongoDB)**: Offer schema-less flexibility and easier horizontal scaling but can introduce complexity for enforcing relationships between users, images, and labels.

We also researched **image storage strategies**:

- **Storing raw images in the database** (as BLOBs) can increase database size and slow down queries.
- **Storing image URLs** (linking to Wikimedia or cloud storage) keeps the database lightweight and improves retrieval performance.

| Database Type | Pros | Cons |
|---------------|------|------|
| **PostgreSQL (Relational)** | Strong data integrity, supports complex queries, easy to model relationships between users, images, and labels | Slightly more setup complexity, schema changes require migrations |
| **MySQL (Relational)** | Widely used, simple to deploy | Fewer advanced features than PostgreSQL |
| **MongoDB (NoSQL)** | Flexible schema, easy to scale horizontally | Harder to enforce relationships, can be less efficient for batch queries |
| **Storing raw images in DB** | Everything in one place | Large size, slower queries, harder to scale |
| **Storing image URLs** | Lightweight, fast queries, easy to integrate with API | Requires external storage, URLs must remain valid |

### Results

Our team decided on a PostgreSQL relational database with image URLs because it fits both our technical needs and our workflow. It allows us to enforce relationships, query efficiently, and manage the app's metadata without storing heavy files. By selecting this structure, we can focus on building a smooth, reliable user experience while keeping our backend and database simple to maintain. This choice reflects our team's priorities: efficiency, scalability, and leveraging our existing skills with relational database design.

### Citations

- PostgreSQL Documentation. PostgreSQL Global Development Group, 2025, https://www.postgresql.org/docs/
- *MongoDB Manual.* MongoDB, Inc., 2025, https://www.mongodb.com/docs/

---

## Frontend Framework Choice

### Introduction & Thesis

For our project, we needed a cross-platform framework that could efficiently support both mobile (iOS/Android) and desktop web applications while maintaining a consistent codebase for fast development cycles.

### Problem Statement

How can we build a mobile and web application that shares a consistent interface, minimizes duplicated code, and maintains strong performance across all platforms?

### Research

#### React Native Overview

React Native, developed by Meta, allows developers to build native mobile applications using JavaScript and React. It bridges JavaScript components to native iOS and Android views, providing near-native performance while reusing much of the web-based React ecosystem.

#### Flutter Overview

Flutter, developed by Google, uses the Dart language and its own rendering engine to build applications across platforms. It provides a single UI framework for mobile, web, and desktop with high performance and expressive UI components.

| Feature | React Native | Flutter |
|---------|--------------|---------|
| **Language** | JavaScript / TypeScript | Dart |
| **Learning Curve** | Easier for teams with web/React experience | Requires learning Dart |
| **Performance** | Near-native, relies on native components | Excellent, uses its own rendering engine |
| **UI Consistency** | Uses platform-native widgets (iOS/Android look different) | Consistent UI across all platforms |
| **Ecosystem** | Mature, large JS/React ecosystem | Growing rapidly, smaller community |
| **Web Integration** | Strong (shares logic/components with React.js) | Weaker — Flutter Web less mature |
| **Third-Party Libraries** | Extensive (NPM ecosystem) | More limited compared to JS |
| **Development Speed** | Fast with hot reloading and shared code | Fast, but web support less seamless |

### Conclusion

React Native was the best fit for our project because it aligns with our team's existing JavaScript knowledge, supports true cross-platform development, and integrates easily with web and mobile interfaces. While Flutter offers better rendering performance and visual consistency, React Native's web compatibility, mature ecosystem, and developer familiarity make it more practical for our use case.

### Citations

- "React Native · Learn Once, Write Anywhere." React Native, Meta Platforms, Inc., 2025, https://reactnative.dev/
- *Flutter documentation.* Flutter.dev, Google, 28 Oct. 2025, https://docs.flutter.dev/
- "Cross-Platform Mobile App Development Frameworks: Comparing Flutter, React Native, and More." Decode Agency, Decode Ltd., 2025, https://decode.agency/article/cross-platform-mobile-app-development-framework/

---

## Backend Framework and API Design

### Introduction & Thesis

Choosing the right backend framework and API architecture can determine a project's scalability, speed, and developer efficiency. Our project requires a lightweight, cost-effective backend capable of handling batch image requests and interactions between a database, mobile app, and web app.

### Problem Statement

Building a reliable backend and API is challenging because it must balance speed, scalability, and cost while efficiently serving multiple clients. The system also needs simple, low-overhead endpoints that can handle batch image retrieval and labeling.

### Research

Several backend frameworks are commonly used for full-stack applications, including **Express.js (Node.js)**, **Django (Python)**, and **Spring Boot (Java)**.

- **Express.js** is known for its minimalistic design, fast performance, and wide library support. Built on Node.js, it allows asynchronous I/O operations, which is ideal for handling many small concurrent requests—like our image confirmation process.
- **Django**, while offering strong built-in features and security, can be heavier and slower to scale for lightweight APIs.
- **Spring Boot** provides powerful enterprise-level features but can be overkill for a smaller project that doesn't require complex business logic.

In addition, cost optimization can be achieved through **batch sending** — grouping multiple API requests or database operations into a single transaction to reduce network overhead and server processing time.

| Framework | Pros | Cons |
|-----------|------|------|
| **Express.js (Node.js)** | Lightweight, fast, scalable, strong community support, simple to deploy | Minimal built-in structure, requires manual setup for security & validation |
| **Django (Python)** | Built-in ORM, admin interface, robust security | Slower for high-I/O apps, heavier for small APIs |
| **Spring Boot (Java)** | Enterprise-grade, highly modular, excellent for large systems | Verbose setup, higher memory use, slower iteration |

### Conclusion

After evaluating multiple backend frameworks, our team determined that **Express.js (Node.js)** best fits our project's needs and our own strengths. Its lightweight design and asynchronous capabilities align with our approach to efficiently handle batch image requests while keeping costs low. Choosing Express.js also leverages our team's familiarity with JavaScript, allowing us to share knowledge across frontend and backend development, iterate quickly, and maintain a clean, unified codebase.

### Citations

- "Express — Node.js Web Application Framework." ExpressJS, OpenJS Foundation, 2025, https://expressjs.com/
- Django Documentation. Django Software Foundation, 2025, https://docs.djangoproject.com/
- *Spring Boot Documentation.* Spring.io, VMware, 2025, https://spring.io/projects/spring-boot

---

## UI/UX Design

### Introduction & Thesis

To optimize the performance and user experience of a highly interactive image classification tool across iOS, Android, and Desktop interfaces we will need to find and utilize a cross-platform UI/UX framework that can provide a unified, responsive interface while maintaining UI and swipe performance across platforms.

### Problem Statement

We need a single cross-platform image-labeling tool with fast swipe gestures, but traditional frameworks often cause performance and animation bottlenecks that lead to inconsistent, non-native experiences. This threatens both usability and adoption.

### Research

**Swiping Direction:** There are two options, swiping up & down or swiping left & right. In a study showing swiping vertically vs. horizontally with elderly patients using home devices, it was shown that swiping horizontally had the advantage of faster switching speeds and greater resistance to interference. This is why we will be using a horizontal (left and right) system of swiping photos rather than vertically.

**Undo Button vs. Confirmation Screen:** In an article discussing both, it explains how if the user were to make a mistake without an undo button, they would have to deliberately go to the "trashcan" portion of the app and retrieve the data, adding an extra step. If we had a "are you sure" prompt for every photo, this could get tedious and cause the user to possibly automatically go through the prompt and possibly still make a mistake. While having an undo feature would be slightly more difficult to implement, it is much more convenient for the user. We could have an "are you sure" prompt for the very last photo, making sure the user doesn't have any more undo's left they would want to use before sending the photos to our DB.

**Navigation Bar vs. Dropdown Menu:** It has been shown that dropdown menus lead to worse performance overall and more errors coming from the user. The user also gets more confused about what all the features are as they only get to see the list of features when clicking on the menu. A bottom navigation bar on the other hand, provides the user with more transparency. It also lets the user always see the features and since it is at the bottom of the screen, it is closest part of the phone to the finger. This will cause less error and possible strain as the user won't have to stretch out their finger as far.

### Results & Comparisons

In conclusion there were some design choices that we decided on using studies and consensus shown with the type of development we're doing:

1. We will be using **horizontal swiping** to go through images instead of vertical swiping
2. We decided to have an **undo button** instead of having to confirm after every image
3. We decided to have a **navigation bar** on the bottom of the app instead of having a dropdown menu (hamburger style)

These UI differences will cause a smoother and better experience for the user.

### Citations

- Zhou, C., et al. (2023). *Impact of swiping direction on the interaction performance of mobile user interfaces*. Behaviour & Information Technology. https://pmc.ncbi.nlm.nih.gov/articles/PMC9948611/
- Hoober, S. (2020, March 9). *"Are You Sure?" vs. Undo: Design and Technology*. UXmatters. https://www.uxmatters.com/mt/archives/2020/03/are-you-sure-versus-undo-design-and-technology.php
- Pernice, K., & Budiu, R. (2016, June 26). *Hamburger menus and hidden navigation hurt UX metrics*. Nielsen Norman Group. https://www.nngroup.com/articles/hamburger-menus/
- "Electron | Build Cross-Platform Desktop Apps with JavaScript, HTML, and CSS." www.electronjs.org
- Flutter. "Flutter - Beautiful Native Apps in Record Time." Flutter.dev, Google
- Ionic. "Ionic - Cross-Platform Mobile App Development." Ionic Framework, 2019
- Nowak, Maja. "Flutter vs. React Native in 2022." Nomtek, 2 Jan. 2024
- React Native. "React Native · a Framework for Building Native Apps Using React." Reactnative.dev, 2024

---

## Deployment and Hosting

### Introduction & Thesis

In order to effectively host the app, we must find an effective CI/CD pipeline and choose an adequate backend or cloud hosting service. Due to the cross-platform nature of the app we must generate distinct packages between iOS, Android, and Web/Desktop. This introduces complexity into the release process. The choice of deployment and hosting platform will dictate our application's scalability, real-time functionality, security, and maintenance overhead.

Platform diagnostic tools like Azure DevOps and GitLab CI provide the foundational CI/CD automation necessary for multi-platform delivery. A backend-as-a-service solution, specifically Google Cloud or AWS, is required to achieve operational efficiency, minimize overhead, and ensure consistent, scalable performance across all platforms.

### Problem Statement

We must find the optimal deployment and hosting strategy for our multi-platform application. We must balance the need for rapid, consistent cross platform delivery with the requirements of scalability, real time data synchronization, and controlled infrastructure costs.

### Research

| Deployment/Hosting Strategy | Pros (Advantages) | Cons (Challenges) |
|-----------------------------|-------------------|-------------------|
| **Google Firebase (BaaS)** | Superior Real-time Services (Firestore), simple SDK integration for Flutter/RN, fast setup, a good free tier, excellent for rapid prototyping | Vendor lock-in to Google Cloud Platform, less flexibility for complex, custom backend logic, NoSQL database may struggle with highly relational data |
| **AWS Amplify (BaaS/CLI)** | Deep integration with AWS ecosystem, offers greater control and flexibility for custom infrastructure, scalability, supports multiple programming languages via AWS Lambda | Steeper learning curve due to reliance on multiple AWS services (Cognito, DynamoDB), can be more costly for small, low-traffic apps, initial setup is more time-consuming |
| **Azure Pipelines / GitLab CI (CI/CD)** | Automated builds for all targets (iOS, Android, Web) from a single code commit, enforces DevOps best practices (testing, code review), seamless integration with source control | Requires dedicated server/VM for building, especially for iOS deployment (needs a macOS runner/agent), initial configuration of pipeline scripts (YAML) is complex and framework-specific |
| **Self-Hosted Backend (Custom Cloud VMs)** | Total control over infrastructure, allows for extreme performance optimization, can potentially be cheaper for predictable, high-volume traffic | High maintenance overhead (server patching, scaling, security), requires maintenance, vastly slower time-to-market compared to BaaS |

### Results & Comparisons

AWS is the deployment solution we will use due to its high compatibility with React Native and the team's familiarity with JavaScript. A secondary option we will keep under consideration is Google Firebase if we decide to utilize Flutter instead.

### Works Cited

- Dubey, Khushi. "10 Best DevOps Platforms to Know in 2025." *Devtron Blog*, 16 Apr. 2025, www.devtron.ai/blog/10-best-devops-platforms-to-know-in-2025/
- Еugenia Еremenko. "Amplify vs. Firebase: Which Platform Is Best Suited for Your Project?" *Jelvix*, 18 Sept. 2024, www.jelvix.com/blog/amplify-vs-firebase
- Microsoft. "What Is Azure DevOps? - Azure DevOps." *Learn.microsoft.com*, 10 Oct. 2022
- Pandya, Jignen. "Amplify vs Firebase: Which Is Best Suited for Your App Project?" *Expertappdevs.com*, Expert App Devs, 4 Aug. 2023

---

## Licensing and Legal Concerns

### Introduction & Thesis

When gathering images for machine learning, it is important to ensure that all images are being used legally. Improperly using copyrighted images can lead to legal issues and restrict the resulting datasets. This section discusses the use of Wikimedia Commons focusing on how their system enables us to lawfully collect images.

### Problem Statement

Ensuring that all images gathered for use in machine learning are legally used is a major challenge when sourcing images from online. Different websites have varying licenses, and not all licenses allow for use with machine learning, especially when the result may be used publicly or commercially.

### Research

Since we have decided to use Wikimedia Commons for our image source, we will explore how it allows for legal image collection. Wikimedia Commons primarily contains images with Creative Commons or Public Domain licenses. Images used for machine learning must be under the:

- **CC0** (Public Domain Dedication)
- **CC BY** (Creative Commons Attribution)
- **CC BY-SA** (Creative Commons Attribution-ShareAlike)

These licenses allow for reuse, adaptation, and redistribution even for commercial use. Wikimedia Commons' API allows for strict license filtering by passing a license parameter.

### Conclusion

Therefore, we will be using only CC0, CC BY, and CC BY-SA by filtering for those specific images when using the Wikimedia Commons API, ensuring our application and the resulting datasets comply with the law.

### Citations

- "Commons:Licensing." *Wikimedia Commons*, Wikimedia Foundation, https://commons.wikimedia.org/wiki/Commons:Licensing
- "Creative Commons Licenses." *Creative Commons*, https://creativecommons.org/licenses/
- "Wikimedia Commons API Documentation." *MediaWiki API*, Wikimedia Foundation, https://www.mediawiki.org/wiki/API:Main_page

---

# Project Documentation II

## Introduction to Section II

This section details the design methodology of the **Image Scraper & User Labeling Tool**. It provides diagrams, pseudocode, and workflows to enable another team to implement the system. The design covers the frontend, backend, database, image collection, UI/UX, and deployment architecture.

---

## System Architecture

### Overview

- **Mobile Client** — Built with React Native for iOS/Android, used by end-users to swipe and label images.
- **Export Web Panel** — A simple web panel to securely retrieve labeled data.
- **Backend API** — AWS EC2 running Express.js handles requests from both the mobile app and admin panel. EC2 will be running Ubuntu and use a Docker Container to containerize our API endpoints. We will have two main endpoint functions `/usr` and `/export`. `/usr` will allow the mobile app to retrieve and label images and `/export` will export image metadata.
- **Database** — Amazon RDS (PostgreSQL) stores image metadata, user info, and labels.

![System Architecture Diagram](media/image6.png)

### High-Level System Architecture Flow

1. User opens mobile app → requests batch of images
2. Backend EC2 Express fetches images (via Wikimedia Commons API) and returns URLs/metadata
3. User confirms or rejects images; actions sent to EC2 API
4. EC2 stores labeled data on Amazon RDS
5. Export panel retrieves labeled data via API endpoints

### Client Flow

1. User opens the app and creates an account or logs in
2. The client contacts the server to display the user's created datasets
3. The user clicks on a dataset or creates a new dataset
4. If the user creates a new dataset, they specify the search query and the maximum number of images
5. The client contacts the server for a buffer of unreviewed images to show the user
6. The user swipes left to discard an image or right to keep an image
7. After the user reviews the full buffer (for example, 10 images), the client sends a batch update to the server
8. The client requests the next buffer of unreviewed images
9. After the final buffer is submitted, the dataset is marked as fully reviewed

### Server Flow

1. The server receives user login or account creation requests and validates credentials
2. The server returns an authentication token for all future client requests
3. The server receives a request for the user's datasets and returns the list from the database
4. When a new dataset is created, the server receives the search term and max image count
5. The server queries the Wikimedia Commons API and stores the returned image metadata in PostgreSQL with each image marked as unreviewed
6. The server receives a request for a buffer of unreviewed images and returns the next batch to the client
7. The server receives batch updates from the client after each buffer is reviewed
8. The server updates the status of each image in the database as kept or discarded
9. The server sends the next buffer of unreviewed images when requested by the client
10. When no unreviewed images remain, the server marks the dataset as fully reviewed
11. The server receives dataset export requests and returns all kept images and metadata

![Client-Server Flow Diagram](media/image7.jpg)

---

## Database Design

### Overview

The database will be hosted using Amazon RDS with a PostgreSQL database.

### ER Diagram

![ER Diagram](media/image8.png)

### Entity Tables

![Entity Tables](media/image9.png)

---

## Backend & API Design

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/images` | GET | Returns a buffer of unreviewed images for the user to label |
| `/api/user/labels` | POST | Receives a batch of label updates (kept/discarded) from the client and saves them to the database |
| `/api/user/login` | POST | Authenticates a user and returns a session token |
| `/api/user/create` | POST | Creates a new user account and initializes their profile in the database |
| `/api/export/images` | GET | Exports all kept images and metadata for a selected dataset |
| `/api/export/login` | POST | Authenticates an admin user to access export features |

![API Design Diagram](media/image10.png)

### API Flowchart — User Labeling

1. User logs in (`POST /api/user/login`)
2. User gets images (`GET /api/user/images`)
3. User labels images as correct or incorrect (keep or discard)
4. When user is done, post results into server (`POST /api/user/labels`)
5. Server validates input and goes into the database

### API Flowchart — Export

1. Users log into the export panel website on their computer
2. User selects dataset to export (`GET /api/export/images`)
3. Server retrieves all kept images and metadata
4. Server returns exported file as a CSV

---

## Frontend & UI/UX

### Overview

The frontend will be developed using React Native. The languages used for the frontend will be TypeScript, HTML, and CSS.

### Mobile Design

**Main Screens:**
- Home
- Categories (Category 1, Category 2, etc.)
- Gallery
- Settings

### Mobile Gestures

- **Swipe right** → confirm
- **Swipe left** → reject
- **Undo** → revert last action

### Export Panel Design

![Export Panel Design](media/image12.png)

The Export Panel provides a streamlined interface for managing the user labeling workflow. After users log in and retrieve their assigned images, once all labeling is finished, the panel allows users to retrieve their results back to the server. The panel ensures that submitted data is validated, properly formatted, and ready for data pipelines.

---

## Image Collection Flow

![Image Collection Flow](media/image13.png)

### Image Collection Flow Descriptions

- **User inputs search term** — The user types a keyword or phrase in the mobile app to specify the type of images they want to label.
- **API requests images from Wikimedia** — The backend (AWS EC2/Express) sends a query to the Wikimedia Commons API using the search term and retrieves a batch of image URLs and metadata.
- **Images presented in app** — The mobile app displays the fetched images to the user in a swipe-able interface for easy labeling.
- **User labels images** — The user swipes right to confirm or left to reject each image, providing input that determines whether the image will be included in the dataset.
- **Labeled images saved to database** — The backend receives the user's labels via API endpoints and stores them in Amazon RDS, linking each label to the corresponding user and image metadata.

---

## Pseudo Code

### Account Creation and Login

```
username = GetInput()
password = GetInput()

// create account if user is new
if (UserDoesNotExist(username)):
    CreateAccount(username, password)

// attempt login
session = Login(username, password)

// backend verifies credentials
if (session invalid):
    Show(error_message)
    STOP

// session token allows secure requests
Store(session.token)
```

### Dataset Creation

```
FUNCTION CreateDatasetForUser(user_id):
    search_term = GetUserSearchTerm()
    image_count = GetUserImageCount()

    results = QUERY_WIKIMEDIA_API(search_term, image_count)
    actual_count = LENGTH(results)

    dataset_id = INSERT_INTO_DATASETS(
        user_id = user_id,
        name = "Dataset: " + search_term,
        search_term = search_term,
        total_images = actual_count,
        created_at = NOW()
    )

    FOR item IN results:
        INSERT_INTO_IMAGES(
            dataset_id = dataset_id,
            url = item.url,
            title = item.title,
            license = item.license,
            status = "unreviewed",
            added_at = NOW()
        )

    RETURN dataset_id
```

### Photo Swiping

This code processes unreviewed photos in small batches while supporting user actions like keep, discard, and undo. It loads 10 photos at a time into a buffer and processes each photo based on user input. An undo stack stores recent actions so the user can revert to the last few decisions. Every five processed photos, the system sends a batch update to the server. After all photos are reviewed, any remaining items are confirmed and sent as a final batch.

```
BUFFER_SIZE = 10
OFFSET = 5
COUNTER = 0
UNDO_LIMIT = 10
undo_stack = []

// load unreviewed images from DB for a given dataset
all_photos = DB_GET(dataset_id, status='unreviewed')
queue = DB_LOAD_NEXT(all_photos, limit=10)

// initial buffer
while (queue not empty or all_photos not empty):
    if (queue empty and all_photos not empty):
        queue = DB_LOAD_NEXT(all_photos, limit=10)

    for i in range(BUFFER_SIZE - 1):
        if (queue empty):
            break

        photo = queue.dequeue()
        action = Process(photo)

        // record action for undo
        PUSH(undo_stack, (photo, action))
        TRIM(undo_stack, UNDO_LIMIT)

        if (action == UNDO):
            (img, prev) = POP(undo_stack)
            img.status = 'unreviewed'
            DB_UPDATE(img)
            COUNTER = 4

// main loop
while (queue not empty or all_photos not empty):
    if (queue empty and all_photos not empty):
        queue = DB_LOAD_NEXT(all_photos, limit=10)

    // send batch every OFFSET photos
    if (COUNTER == OFFSET):
        batch = queue.dequeue(:5)
        DB_UPDATE_BATCH(batch)
        COUNTER = 0

    if (queue empty):
        break

    photo = queue.dequeue()
    action = Process(photo)

    // update photo status based on swipe
    if (action == RIGHT):
        photo.status = 'kept'
    if (action == LEFT):
        photo.status = 'discarded'

    DB_UPDATE(photo)

    // record action for undo
    PUSH(undo_stack, (photo, action))
    TRIM(undo_stack, UNDO_LIMIT)

    if (action == UNDO):
        (img, prev) = POP(undo_stack)
        img.status = 'unreviewed'
        DB_UPDATE(img)

    COUNTER += 1

// EDGE CASE: leftover items
if (queue not empty):
    show(confirm_screen)
    final_batch = queue.dequeue(:all)
    DB_UPDATE_BATCH(final_batch)
```

---

## Deployment Flow CI/CD Pipeline

![CI/CD Pipeline](media/image14.png)

### CI/CD Description

1. Team develops new code or makes improvements
2. Team commits to a testing repo (GitHub or equivalent)
3. Team will compile and run the updated program in a testing environment. During this test the team will document errors and unexpected behaviors.
   - If there are errors the team will go back to development
4. If there are no errors the test repo will be pushed to the production server. Team will shut down the server for a short period if necessary for a smooth update experience.

---

# Project Documentation III

## Development Strategy

### Chosen Strategy: Agile

**Reason for Choice:**
- Allows incremental development and frequent testing of features
- Supports collaboration and flexibility as tasks evolve or issues arise
- Ideal for our project because user feedback and iterative UI/UX improvements are important

### Implementation

- Work is divided into short sprints focusing on specific features (e.g., login, image collection, swipe interface, export panel)
- Regular team meetings at the end of each sprint to review progress, integrate feedback, and adjust priorities
- Continuous integration and version control (GitHub) ensure smooth collaboration and code management

---

## Development Timeline/Schedule

For all of the weeks, we will be testing the previous week's milestone as well.

| Week # | Milestone/Task |
|--------|----------------|
| 1-2 | Backend setup & AWS RDS schema |
| 3-4 | Mobile app login, account creation |
| 5-6 | Image collection & Wikimedia API integration |
| 7-8 | Swipe interface & buffer logic |
| 9-10 | Export panel & export API |
| 11-14 | Bug fixes, final testing, final integration |

---

## Work Delegation

| Team Member | Task(s) |
|-------------|---------|
| **Xavier Hampton** | ExpressJS Setup, Create API Endpoints, Ensure APIs are integrated with Frontend. Will review and test Eli's Tasks. |
| **Eli Holm** | Amazon RDS Infrastructure/Connection, AWS EC2 Infrastructure/Connection. Will review and test Xavier's Tasks. |
| **Keehin McCann** | Frontend-UI and Front-end Logic with Wyatt, Mobile app login, account creation, Swipe interface & buffer logic, Export panel. Will review and test Wyatt's Tasks. |
| **Wyatt Allinger** | Frontend-UI and Front-end Logic with Keehin. Mobile app login, account creation, Swipe interface & buffer logic, Export panel. Will review and test Keehin's Tasks. |

---

## Contingency Planning

### Potential Issue: API rate limits or failures from Wikimedia

**Backup:** Cache previously retrieved images; allow retry or smaller batch requests.

### Potential Issue: Mobile app crashes or performance issues with large datasets

**Backup:** Implement smaller buffers on the device & pagination to reduce memory load.

### Potential Issue: Server downtime

**Backup:** Use AWS auto-restart and deploy local dev server for temporary testing.

---

## Roadblocks

### Inexperience in Technologies Causing Slowdown

- Amazon EC2
- Amazon RDS
- React Native
- PostgreSQL

### Wikimedia API

Wikimedia has API rate limits which could slowdown user collection of images, causing a slower product.

### Unforeseen Development Bottlenecks

There could be many instances during development where one service relies on another service being partially built but we don't realize it until we are far into development, causing more development time.

### Possible Dependency Errors

We are not sure if some services are incompatible with each other. This could cause us to develop custom APIs with the data, increasing the amount of time in development.

### Reliance on Many External Services

Being reliant on multiple external services increases the probability that one of them doesn't act the way we want them to. This will create an immediate roadblock as we will have to find an alternate solution, costing time, and possibly halting development.

---

## Testing Plan

*This section is for Capstone II and will be implemented next semester.*
