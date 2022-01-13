## Todo list to create your stack

### In `/stacks` folder create the stack
  - [ ] add table stack for `table`
    - [ ] add function definition for `dbConsumer.js`
    - [ ] add permissions for `dbConsumer.js` to access `topic`
    - [ ] add permissions for `dbConsumer.js` to access `failover-db-queue`
  - [ ] add queue stack for `cover-dlq-queue`
  - [ ] add auth stack for `auth`
    - [ ] add function definition for `createUser.js`
    - [ ] add permissions for `createUser.js` to access `table`
    - [ ] add function definition for `cognitoSync.js`
    - [ ] add permissions for `cognitoSync.js` to access `verification-email`
    - [ ] add function definition for `preSignup.js`
    - [ ] add permissions for `preSignup.js` to access `getInvite.js` in `calm-invites` service
    - [ ] add function definition for `postAuth.js`
    - [ ] add permissions for `postAuth.js` to access `table`
  - [ ] add API stack for `POST /user`
    - [ ] add function definition for `updateUser.js`
    - [ ] add permissions for `updateUser.js` to access `table`
  - [ ] add API stack for `DELETE /user`
    - [ ] add function definition for `deleteUser.js`
    - [ ] add permissions for `deleteUser.js` to access `table`
    - [ ] add permissions for `deleteUser.js` to access `auth`
  - [ ] Manually setup email in AWS console for `verification-email`
  - [ ] add topic stack for `topic`
    - [ ] add function definition for `updateCover.js`
    - [ ] add permissions for `updateCover.js` to access `table`
    - [ ] add permissions for `updateCover.js` to access `cover-dlq-queue`
  - [ ] add queue stack for `failover-db-queue`
  - [ ] add API stack for `GET /user`
    - [ ] add function definition for `get.js`
    - [ ] add permissions for `get.js` to access `table`

### In `/src` folder create the handler functions
  - [ ] create `getByEmail.js` handler
    - [ ] add query of `table`
  - [ ] create `updateCover.js` handler
    - [ ] add update for `table` to update cover
    - [ ] add update for `cover-dlq-queue` to failed cover calls
  - [ ] create `createUser.js` handler
    - [ ] add update for `table` to create new user
  - [ ] create `updateUser.js` handler to change name (not cover)
    - [ ] add update for `table` to update user name
  - [ ] create `deleteUser.js` handler to deletes user
    - [ ] add update for `table`
    - [ ] add update for `auth` to delete from cognito
  - [ ] create `cognitoSync.js` handler to Custom message
    - [ ] add update for `verification-email` to signup + forgot psw mails
  - [ ] create `preSignup.js` handler to Verify if invite exists
    - [ ] add query of `getInvite.js` in `calm-invites` service
  - [ ] create `postAuth.js` handler to update stats on visit
    - [ ] add update for `table` to update stats
  - [ ] create `dbConsumer.js` handler to db stream to publish changes
    - [ ] add update for `topic`
    - [ ] add update for `failover-db-queue`
  - [ ] create `get.js` handler to user details upon login
    - [ ] add query of `table`

### In `/npm` folder expose functions and arn info for client
  - [ ] expose arn of `get.js` for permission to invoke function `getUser.js`
  - [ ] expose arn of `getByEmail.js` for permission to invoke function `getUserByEmail.js`
  - [ ] expose endppint url for API `DELETE /user`
  - [ ] expose endppint url for API `GET /user`
  - [ ] expose endppint url for API `POST /user`
  - [ ] expose function `getUser.js` to query `get.js`
  - [ ] expose function `getUserByEmail.js` to query `getByEmail.js`