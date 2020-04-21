# FizzioBuddy is a real time video chat app that integrates real time pose detection via Posenet (TensorFlow).
Due to COVID-19, all non-essential healthcare is cancelled or delayed. Most healthcare professionals have moved on to Telehealth inorder to continue to provide services.

This application is a proof of concept to show that existing technologies can be used in novel ways for Telehealth. More research is needed to validate the results derived from these technologies.

Through pose detection, we can calculate range of motion at each joint. Traditionally, healthcare providers such as Physiotherapist, Occupatinal therapist use tools such as Goniometer to measure range of motion.
These tools could be used during Teleconference (see https://www.ncbi.nlm.nih.gov/pubmed/32190478). 
However, these tools may not be readily available or may not be scalable with changing screen size or may require participants to be in a certain position for prolonged periods of time.
With Posenet, we can potentially eliminate the need for tools to measure range of motion, and it can be scalable for all screen sizes. Additionally, this tool allows the healthcare professional to measure range of motion while the client is relaxed. 

# npm install
- to install node modules required for the app

# npm start
- to start the app on a local machine

If running the application locally, the application requires to be loaded on 2 different browsers (sessions) in order to show both the client and physiotherapist positions. For example, a tab running the application on a regular session of Google Chrome (using local host) as well as another tab of the application running on Mozilla Firefox (Chrome Incogntio tab, etc.)

To activate real-time detection, click on PoseNet button (resNet buttion will load resNet which is more accurate but slower)
Once PoseNet loads, it requires 3 joints to be visible to calculate joint angles.
For shoulder -> hip, shoulder and elbow need to be visible
For elbow -> shoulder, elbow, and wrist need to be visible
For hip -> shoulder, hip, and knee need to be visible
for knee -> hip, knee, and ankle need to be visible

Use 'start' button to anchor the points and 'stop' button at the end range to calculate the range of motion between 'start' and 'stop' points 


The application is also deployed on Heroku at this link: https://fizziobuddy.herokuapp.com/, which again requires 2 different users to host an active session. This app only supports 2 people at a time. 
