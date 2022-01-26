import router from './index'

describe('', () => {
  const routes = [
    { path: '/', method: 'get' }
  ]

  it('should have routes', () => {
    routes.forEach((route) => {
      const match = router.stack.find(
        (s) => s.route?.path === route.path && s.route?.methods[route.method]
      )
      expect(match).toBeTruthy()
    })
  })
})
