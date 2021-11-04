# basic-blog
This is an example blog site about music using 
> Node.js: Designed to build scalable network applications, used for non-blocking, event driven servers

> Express.js: Back end web application framework for Node.js

> MongoDB: NoSQL database program, uses JSON formatted documents with optional schemas

> Mongoose: Manages relationships between data, provides schema validation and is used to translate between objects in code and the representation of those objects in MongoDB

> EJS (Embedded JavaScript): Templating language that enables the user to generate HTML with JavaScript

> Passport: Authentication middleware for node

> Bootstrap: Front end framework used to design modern websites and web apps


## Motivation
I started this project to apply what I learned from my Undergraduate program and Full Stack Web Development courses I completed recently. Initially my understanding of databases, computer networks and data communication were flawed so this project helped me learn a lot by applying these concepts to an example web app like a blog site. Even though it is not formally published I am happy with how it turned out and what I have been able to accomplish although it is nowhere close to being done. 

## How It Works
The Authenticated User will be able to add posts to a database, make replies to posts, filter through topics and delete or update a post depending on if the user is the author of the post. These methods are processed through get and post request methods sent to the server. All posts are stored into their own collection depending on the section the user specified when submitting the post. This can be one of four sections: Albums, Artists, Songs and No Filter. Once added to the proper section the author, title and content is recorded to the database. Comments are added to the posts once a reply button is submitted by a user. The posts and comments will be displayed in the order they were added like a stack. Both the posts and comments will display their unique ids which will be used as the target for comments which is shown within the submitted comments.

The structure of the database follows MongoDB’s model for one-to-many relationships with embedded documents. Embedding connected data in a single document can reduce the number of read operations required to obtain the data. With one query to the topicDocument I am able to retrieve all the posts and comments of each post along with the author and time they were posted.

Embedded document model
```javascript
userSchema = {
    _id: userID, 
    googleId: String, 
    username: String
}
commentSchema = {
    _id: commentID, 
    author: userSchema, 
    target: String, 
    content: String, 
    stamp: {date: String, time: String}
}
postSchema = {
    _id: postID, 
    author: userSchema, 
    title: String, 
    content: String, 
    comment: [ commentSchema ], 
    stamp: {date: String, time: String}
}
topicSchema = {
    _id: topicID, 
    section: String, 
    posts: [ postSchema ]
}
```
## How To Use Locally
Make sure that you have MongoDB and Node installed.
You can download the code located in the master branch of this repository 
To run the code:
- Update google strategy in the index.js file following these instructions
    - [Passport](http://www.passportjs.org/packages/passport-google-oauth2/)
    - [Google client api](https://developers.google.com/identity/protocols/oauth2)
- npm install
- type mongod into cmd
- In the same window open a new tab
- type node index.js into the new tab to run the server
- go to chrome browser and type “localhost:3000” to connect to server
- login using a google email
- get to posting :)

## Future Plans
In the future I plan on expanding upon this project by improving the database model because I realize that it can lead to very large documents with the current structure since posts and comments are both unbounded. Additionally I would like to update it visually because it is very basic and dull. I would also add more functionality like a user page, adding review/rating system, and keeping up with trending topics like album and song releases to increase the number of ways a user can interact with the web app. 
