const express = require('express') // 3rd party pkg from NPM Website
const sqlite3 = require('sqlite3') // 3rd party pkg from NPM Website
const {open} = require('sqlite') // 3rd party pkg from NPM Website
const bcrypt = require('bcrypt') // 3rd party pkg from NPM Website

const path = require('path') // inbuild file or core module of node js
const app = express() // server instance created
app.use(express.json())
const dpPath = path.join(__dirname, 'userData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server started at URL')
    })
  } catch (error) {
    console.log(`DB Error: ${error}`)
    process.exit(1)
  }
}

initializeDBAndServer()
// URL: http://localhost:3000

//API-1 Path: /register URL: http://localhost:3000/register
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const userCheckQuery = `SELECT * FROM user WHERE username = "${username}";`
  const userCheck = await db.get(userCheckQuery)
  if (userCheck !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    if (password.length <= 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const encryptPassword = await bcrypt.hash(password, 10)
      const createNewUserQuery = `
        INSERT INTO 
          user(username, name, password, gender, location)
        VALUES ("${username}", "${name}", "${encryptPassword}", "${gender}", "${location}");`
      const createNewUser = await db.run(createNewUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  }
})

//API-2 Path: /login URL: http://localhost:3000/login
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const userCheckQuery = `SELECT * FROM user WHERE username = "${username}";`
  const userCheck = await db.get(userCheckQuery)
  if (userCheck === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, userCheck.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API-3 Path: /change-password URL: http://localhost:3000/change-password
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const userCheckQuery = `SELECT * FROM user WHERE username = "${username}";`
  const userCheck = await db.get(userCheckQuery)
  if (userCheck.password !== oldPassword) {
    response.status(400)
    response.send('Invalid current password')
  } else {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const encryptPassword = await bcrypt.hash(newPassword, 10)
      const passwordUpdateQuery = `
           UPDATE user 
           SET password = "${encryptPassword}"
           WHERE username = "${username}";
           `
      const passwordUpdate = await db.run(passwordUpdateQuery)
      response.status(200)
      response.send('Password updated')
    }
  }
})

module.exports = app
