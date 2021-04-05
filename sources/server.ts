import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

import * as express from 'express'
import * as formidable from 'express-formidable'

import db from './query-functions'

const app = express()
const port = process.env['PORT']

app.use('/public', express.static(path.join(__dirname, '../public')))
app.use(formidable())

app.get('/', (req, res) => res.status(200).send({
    info: `API | Express & PostgreSQL API using TypeScript`
}))

app.post('/register-regid', db.registerRegid)
app.get('/get-all-regid', db.getAllRegid)
app.post('/send-notification', db.sendNotification)

app.listen(port, () => console.log(`App running on port ${port}.`))