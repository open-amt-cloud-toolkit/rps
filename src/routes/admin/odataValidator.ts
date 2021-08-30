import { query } from 'express-validator'
import { DEFAULT_SKIP, DEFAULT_TOP } from '../../utils/constants'

export const odataValidator = (): any => {
  return [
    query('$top')
      .default(DEFAULT_TOP)
      .isInt({ min: 0 })
      .withMessage('The number of items to return should be a positive integer'),
    query('$skip')
      .default(DEFAULT_SKIP)
      .isInt({ min: 0 })
      .withMessage('The number of items to skip before starting to collect the result set should be a positive integer'),
    query('$count')
      .optional()
      .isBoolean()
      .withMessage('To return total number of records in result set should be boolean')
  ]
}
