import router from './index'

describe('Check index from admin', () => {
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
  const routers = [
    { path: '/admin', method: 'use' }
  ]

  it('should have routers', () => {
    routers.forEach((route) => {
      console.log(router.stack)
      const match = router.stack.find(
        (s) => (s?.regexp as RegExp).exec(route.path)?.length > 0 && s.path == null
      )
      expect(match).toBeTruthy()
    })
  })
})
