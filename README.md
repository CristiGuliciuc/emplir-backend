# emplir-backend
This backend application is built using the Express.js framework for Node.js and uses Azure Cosmos DB as the database. The purpose of this application is to provide a RESTful API for client applications to interact with the database.

## Prerequisites:
Before running the application, you must have the following installed on your machine:
1. Node.js
2. NPM
3. Azure account with a Cosmos DB instance

## Getting Started
To get started with the application, follow these steps:
1. Clone the repository to your local machine and install the dependencies
```bash
git clone "https://github.com/CristiGuliciuc/emplir-backend"
cd emplir-backend
npm install
```
2. Create a .env file in the root directory of the project and add the following environment variables:
```css
COSMOS_DB_ENDPOINT=<cosmos_db_endpoint>
COSMOS_DB_KEY=<cosmos_db_key>
COSMOS_DB_DATABASE=<cosmos_db_database_name>
COSMOS_DB_CONTAINER=<cosmos_db_container_name>
PORT=<port_number_to_run_the_application_on>
```
Replace the placeholders with your Azure Cosmos DB URL, key, and database name.

3. Run the application by running
```bash
node index.js
```

## API Endpoints
The application provides the following API endpoints:

## Error Handling
The application handles errors by returning appropriate HTTP status codes and error messages in the response body. If an error occurs, the response body will contain a JSON object with the following structure:
```json
{
  "error": {
    "code": "<http_status_code>",
    "message": "<error_message>"
  }
}
```

## Conclusion
This backend application provides a simple and easy-to-use RESTful API for client applications to interact with Azure Cosmos DB. With this application, you can easily create, read, update, and delete items in the database using standard HTTP methods.
