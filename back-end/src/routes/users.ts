import { Request, Response, Router } from 'express'
const router = Router()

/* GET home page. */
router.get('/', (_req: Request, res: Response) => {
  res.send('Fetched all users')
})

/* POST a user */
router.post('/', (_req: Request, res: Response) => {
  res.send('Created a user')
})

/* PATCH a user */
router.patch('/', (_req: Request, res: Response) => {
  res.send('Updated a user')
})

/* DELETE a user */
router.delete('/', (_req: Request, res: Response) => {
  res.send('Deleted a user')
})

export default router
