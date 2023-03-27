//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbmessages.js';
import Pusher from 'pusher';
import cors from 'cors';


//app config
const app = express()
const port = process.env.PORT || 9000 

const pusher = new Pusher({
    appId: "1573877",
    key: "fbe3e6378ca37aee7bbd",
    secret: "48d8e8c0b6273dfd544a",
    cluster: "ap2",
    useTLS: true
});

//middleware
app.use(express.json());
app.use(cors())

//DB config
const connection_url = 'mongodb+srv://lepha_22:Lepha_123@whatsapp-api.fgdgu9u.mongodb.net/?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents")
    const changeStream = msgCollection.watch();
    // console.log(changeStream);

    changeStream.on("change", (change) => {
        console.log("Change occured", change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
});

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    });
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    });
});

//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`))