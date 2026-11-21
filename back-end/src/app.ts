import express, { json, urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import cors from 'cors'

import indexRouter from './routes/index'
import authRouter from './routes/auth'
import patientRouter from './routes/patients'
import bodyAssessmentRouter from './routes/bodyAssessments'
import foodRouter from './routes/foods'
import dietRouter from './routes/diets'
import mealPlanRouter from './routes/mealPlans'

import { authenticate } from './middlewares/auth'
import { errorHandler } from './middlewares/errorHandler'

const app = express()

// Libera o acesso do front-end (endereços listados em ALLOWED_ORIGINS, separados por vírgula)
app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',')
}))

app.use(logger('dev'))
app.use(json())
app.use(urlencoded({ extended: false }))
app.use(cookieParser())

/* ROTAS PÚBLICAS */

app.use('/', indexRouter)
app.use('/auth', authRouter)

/* ROTAS PROTEGIDAS: exigem o token obtido no login */

app.use('/patients', authenticate, patientRouter)
app.use('/body-assessments', authenticate, bodyAssessmentRouter)
app.use('/foods', authenticate, foodRouter)
app.use('/diets', authenticate, dietRouter)
app.use('/meal-plans', authenticate, mealPlanRouter)

app.use(errorHandler)

export default app