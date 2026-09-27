import express, { json, urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'

import indexRouter from './routes/index'
import patientRouter from './routes/patients'
import bodyAssessmentRouter from './routes/bodyAssessments'

const app = express()

app.use(logger('dev'))
app.use(json())
app.use(urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/', indexRouter)

app.use('/patients', patientRouter)
app.use('/body-assessments', bodyAssessmentRouter)

export default app
