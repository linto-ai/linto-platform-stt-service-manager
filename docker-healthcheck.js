const request = require('request')

request(`http://localhost:${process.env.LINTO_STACK_STT_SERVICE_MANAGER_HTTP_PORT}`, error => {
  if (error) {
    throw error
  }
})