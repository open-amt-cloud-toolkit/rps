import { query } from 'express-validator'

export const odataValidator = (): any => {
  return [
    query('$top')
      .optional()
      .isInt({ min: 0 })
      .withMessage('The number of items to return should be an integer'),
    query('$skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('The number of items to skip before starting to collect the result set should be an integer'),
    query('$count')
      .optional()
      .isBoolean()
      .withMessage('To return total number of records in result set should be boolean')
  ]
}
