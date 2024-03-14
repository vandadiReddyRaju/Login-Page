const express = require("express");

const bp = require("body-parser");
const cors = require("cors");

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, "goodreads.db");

let db;

app.use(express.json())

const initializeSeverAndDatabase = async () => {
  try {
    db = await open({
      filename : dbPath,
      driver : sqlite3.Database
    })

    app.listen(3000, () => {
      console.log("Server Running at https://localhost:3000/");
    });
  } catch (error) {
    console.error(`Error initializing server and database: ${error.message}`);
    process.exit(1);
  }
};

initializeSeverAndDatabase();

app.post("/signup", async (request, response) => {
  try {
    const { username, password, gender, location } = request.body;

    if (!username || !password || !gender || !location) {
      const missingFields = [];
      if (!username) missingFields.push("username");
      if (!password) missingFields.push("password");
      if (!gender) missingFields.push("gender");
      if (!location) missingFields.push("location");

      return response.status(400).send(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const getUser = `
    SELECT *
    FROM users
    WHERE username = '${username}';`;

    const userDetails = await db.get(getUser);

    if(userDetails === undefined){

        const hashedPassword = await bcrypt.hash(password , 10);

        const sqlQuery = `
            INSERT INTO users (username, password, gender, location)
            VALUES ('${username}', '${hashedPassword}', '${gender}', '${location}')
            `;

            await db.run(sqlQuery);

            response.send("User added Successfully");
                
    }else{
        response.send("User alreday exists");
    }
    
  } catch (error) {
    console.error("Error adding user:", error);
    response.status(500).send("Error adding user");
  }
});

/* 
app.get("/users", async (req, res) => {
  const sqlQuery = `
    SELECT * FROM users;
  `;

  const users = await db.all(sqlQuery);
  await db.run(sqlQuery);

  

  res.json(users);
})
*/

app.post("/login",async (request , response) => {

  const {username , password} = request.body;

  if(!username || !password){
    const missed = [];

    if( !username) missed.push("username");
    if(!password) missed.push("password");

    return response.status(400).send(`Missing fiels ${missed.join(",")}`);
  }

  const validateQuery = `
  SELECT *
  FROM users 
  WHERE username = '${username}'`;

  const userDetail = await db.get(validateQuery);

  if(userDetail === undefined){
    response.status(401).send("Invalid username")
  }else{
    const signedPassword = await bcrypt.compare(password, userDetail.password);

    if(signedPassword){
      // const jwtToken = await jwt.sign(username,"SECRET_KEY");

      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken })

    }else{
      response.send("Invalid password")
    }
  }
});




