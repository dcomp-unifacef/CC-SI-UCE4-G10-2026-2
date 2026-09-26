import { Request, Response, Router } from 'express'
const router = Router()

/* GET home page. */
router.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!')
})

export default router
