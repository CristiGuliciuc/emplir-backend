var config = {}

config.optionsSwagger = optionsSwagger = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Node JS API Project for Emplir',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:3000`
        }
      ]
    },
    apis: ['./index.js']
  }
  
module.exports = config