# Custom URL Shortener API

## Overview
This project focuses on creating a scalable Custom URL Shortener API with the following features: 🌐✨🔒

- **User Authentication**: Secure login using Google Sign-In.
- **Short URL Generation**: Simplify long URLs for easier sharing across platforms.
- **Advanced Analytics**: Track usage for both individual links and overall URL performance.
- **Link Grouping**: Organize links under categories like acquisition, activation, and retention.
- **Rate Limiting**: Prevent excessive requests to ensure system stability.

## Instructions to Run the Project

### Running the Project Locally with Docker Compose 🌟💻📦

1. **Ensure Prerequisites**: Make sure Docker and Docker Compose are installed on your system.

2. **Clone the Repository**: Download the code to your local machine:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```

3. **Start the Containers**: Launch the development environment:
   ```bash
   docker-compose up
   ```

4. **Access the Application**: Once the containers are running, visit:
   [http://localhost:3000](http://localhost:3000)

5. **Shut Down the Environment**: To stop the containers, run:
   ```bash
   docker-compose down
   ```

### Notes 📝🔍⚠️
- **Environment Variables**: Ensure all necessary variables are properly configured in the `.env` file.
- **Troubleshooting**: For any issues, check the logs:
  ```bash
  docker-compose logs
  ```

## Testing the APIs with Postman 🚀📮

1. **Load Postman Collection**: Download the provided Postman collection file from the repository and import it into Postman.

2. **Collection Structure**: All built endpoints are organized within the collection.

3. **Update Variables**: Go to the "Variables" tab in Postman and set the `API_URL` to the desired environment (e.g., Prod or Dev).

4. **Retrieve Cookie Session ID**:
   - Open a browser and navigate to `/auth/login`.
   - Use Chrome DevTools (or similar) to access cookies:
     - Open DevTools > Applications > Storage > Cookies.
   - Log in with your account credentials.
   - If successful, you will be redirected to the welcome page.
   - You should see two cookies: `connect.sid` and `sessionId`. If not, refresh the page.
![image](https://github.com/user-attachments/assets/6e43c7c3-f688-46ab-a649-06521c8b9635)

5. **Copy Session ID**:
   - Select the value of `sessionId`, right-click, and choose "Edit Value."
   - Copy the value.

6. **Paste Session ID into Postman**: Set the copied value as the `COOKIE_SESSION` variable in the Postman collection.

7. **Test APIs**: Now, all the APIs in the Postman collection are ready for use.

By following these steps, you can easily test all available endpoints and ensure smooth functionality! 🎉


# Overview of Implemented Features

## 🔒 User Authentication

User authentication is implemented with Google Sign-In and managed using **Passport.js**:

- **Session Management**: Persistent sessions are stored in MongoDB using `express-session` with `connect-mongo`.
- **Endpoint Security**: All endpoints validate user authentication.
- **Access Control**: Certain endpoints (e.g., analytics) are protected by authentication and ownership checks.
- **User Data**: Google ID, name, and email are securely stored in MongoDB.

---

## 📂 Database Configuration

The database is configured for performance and stability:

- **Auto-Reconnect**: Automatically reconnects to MongoDB in case of disconnections.
- **Indexing**: URL collection indexes improve query performance.

---

## ✂️ URL Shortener Logic

The URL shortening algorithm uses **Base62 encoding** with a counter-based approach:

- **Base62 Encoding**: Short (7-character) aliases are generated for URLs.
- **Efficient Hashing**: UUIDv4 values are hashed using FNV-1a to ensure unique aliases. This is an alternative approach of using counters and storing in DB.

This approach ensures short, user-friendly links without performance bottlenecks.

---

## 📊 URL Analytics

The API provides advanced analytics to monitor link performance:

- **By Alias**: Aggregates clicks by alias to show unique clicks and user counts.
- **User-Level Analytics**: Aggregates data across all user-created URLs by date, OS type, and device type.
- **Topic-Based Analytics**: Analyzes grouped links (e.g., acquisition) for clicks and unique users.
- **Geolocation**: IP-based geolocation using `geoip-lite` to track location data.

---

## ⏱️ Rate Limiting

Rate limiting is applied to key endpoints to:

- Prevent DDoS and flooding attacks.
- Ensure consistent and stable API performance.

---

## 🚢 Deployment

The application is deployed using AWS services:

- **Serverless Deployment**: Deployed as a serverless function on AWS Lambda.
- **Containerization**: The application is Dockerized and pushed to AWS ECR (Elastic Container Registry).
- **Lambda Integration**: AWS Lambda uses the Docker image for deployment.

This approach optimizes scalability while leveraging AWS's generous free tier for cost efficiency.

---

## 🧪 Integration Testing

Integration tests are written for `apiControllers` using **Jest**:

- **Mocking**: Mocks are created for database connections and Redis clients to avoid real service calls.
- **Supertest**: Used to run tests efficiently with mock data.

Tests ensure the controllers behave correctly under various scenarios.

---

## ⚠️ Challenges and Solutions

1. **Google Sign In mechanism:** I initially took sometime to figure out how can I efficiently do Google Sign In with just a Node Express API and maintain tokens for autorization. I finally then decided to go with the combination of passport.js with implementing Google Strtegy and then using express sessions with Mongo Store to keep persistent sessions in my Mongo DB database.

2. **Deployment:** The deployment of the solution was also a very thought-provoking problem for which i spent some hours to plan out. I figured out that we can use lambda functions by AWS as free tier is very generous with almost allowing a million of request of invocation per day. But, still the problem is not solved. Now, lambda function has size restrictions which was not fitting with the size of my application. So, then I dockerized the solution specifically to be able to run on lambda servers.Then, I pushed the image in the ECR repository which is a private repositroy given by AWS to keep you images and containers to be used in other servies(like lambda for this instance).I then deployed the lambda function using the image I pushed in the ECR repository.

3. **Integration Testing:** I was able to write tests for apiControllers. I used jest framework to write the test. Writing integration test was new to me and took some time to understand concepts like mocking of functions and data to replace them with actual db read calls. I still am figuring as to why some of my tests are failing but due to time constraints I am unable to figure it out yet.

4. **Dockerizing with Windows:** This is not much of a challenge but Docker with Windows is really not a great combination as there would lot of problem and errors coming in while creating images and containers or running the docker-compose command. I then used the WSL terminal with Ubuntu distro to run my docker containers and pushing images.

---

## 🌐 Deployment URL

**[Deployment URL Placeholder]**

Access the live application here once deployed!
