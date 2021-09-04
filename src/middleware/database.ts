import { Request, Response } from 'express'

const databaseMiddleware = async (req: Request, res: Response, next): Promise<void> => {
  next()
}
export default databaseMiddleware
