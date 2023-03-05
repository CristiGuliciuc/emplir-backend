var config = {}

config.endpoint = 'https://emplir-database.documents.azure.com:443/'
config.key = 'FioxX75uEG2bJuhh7bsymfZ4IyK7BwY2p1lDGBoaRgqwnpF1OFIvP9BOGmr6GRgTIBsx4DYlhI8lACDbpKm4Bw=='

config.database = {
  id: 'emplir-database'
}

config.testContainer = {
  id: 'TestContainer'
}

config.testItems = {
  test: {
    id: 'test-1',
    message: 'Hello User'
  }
}
  
module.exports = config