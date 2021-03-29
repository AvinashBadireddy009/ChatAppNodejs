//importings
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1178943",
    key: "bd0538c1ba4d45f54985",
    secret: "5d4e59f7bae9a99bbf4b",
    cluster: "ap2",
    useTLS: true
});

//Middleware
app.use(express.json());
app.use(cors());

//DB config
const connection_url = "mongodb+srv://Avinash143:Avinash@143@avinashcluster.h9e0o.mongodb.net/chatDb?retryWrites=true&w=majority"
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.once('open',() => {
    console.log('DB conntected');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();
    changeStream.on('change', (change) => {
        console.log(change);
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp
            })
        }else{
            console.log("Error triggering Pusher");
        }
    })
});

//??


// api routes
app.get('/',(req, res)=> res.status(200).send('Hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        } else{
            res.status(200).send(data)
        }
    })
});
app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    })
});


//listen
app.listen(port, ()=> console.log(`listening on localhost:${port}`));