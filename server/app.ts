import express from "express";
import cors from "cors";
import {DatabaseType} from "./types";

const PORT = 8080;
const app = express();

const signature = 'd9c9e9bc71efaa54c0c0a27084ba0edcfb517221f8c3effa00b05d83f72f1c6f'

let database: DatabaseType = {data: "Hello World", hash: await sha256("Hello World")};
let backupDatabase: DatabaseType = {...database};

async function sha256(message: string): Promise<string> {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


app.use(cors());
app.use(express.json());

// Routes

app.get("/", async (req, res) => {
    if (await sha256(database.data) !== database.hash) {
        database = { ...backupDatabase }
    }
    res.json(database);
});

app.post("/", async (req, res) => {
    /*
    the following protection mechanism ensures that data can only be written to the
    db if it goes through this function (thus recalculating the hash).

    the server will verify that any outgoing data is intact and will automatically
    attempt a repair.

    regardless, we still provide a way for the client to check integrity themselves
     */

    if (req.body.hash !== signature) {
        res.sendStatus(400)
        return
    }

    database.data = req.body.data;
    database.hash = await sha256(database.data)

    backupDatabase = {...database}

    res.sendStatus(200);
});

app.post("/verify", async (req, res) => {
    /*
    the following protection mechanism ensures that data can only be written to the
    db if it goes through this function (thus recalculating the hash).

    the server will verify that any outgoing data is intact and will automatically
    attempt a repair.

    regardless, we still provide a way for the client to check integrity themselves
     */

    if (req.body.signature !== signature) {
        console.log(req.body.signature)
        res.sendStatus(400)
    } else {
        res.sendStatus(200);
    }
});


app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
