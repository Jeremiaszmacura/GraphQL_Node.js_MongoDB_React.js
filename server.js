require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event');

const app = express();
const port = process.env.PORT || 3000;  // eslint-disable-line

const events = [];

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        
        type RootQuery {
            events: [Event!]!
        }
        
        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }
        
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find().then(events => {
                return events.map(event => {
                    return { ...event._doc, _id: event.id };
                })
            }).catch(err => {
                console.log(err);
            });
        },
        createEvent: args => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date)
            });
             return event.save().then(result => {
                console.log(result);
                return { ...result._doc, _id: result._doc._id.toString() };
            }).catch(err => {
                console.log(err);
                throw err;
            });
        }
    },
    graphiql: true
}));

app.get('/', (req, res, next) => {
    res.send("Hello World!");
})

if(require.main === module) {
    mongoose.connect(process.env.DATABASE_URL,  // eslint-disable-line
        { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
        .then(() => app.listen(port, () => console.log(`[SERVER] listening on port ${port}...`))) // after successful connection with database, sever start listening
        .catch((err) => console.log(err));
}
