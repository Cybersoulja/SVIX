# Svix App Creator

This project is a simple web interface to interact with the Svix webhook API.

## Features

- **Create App**: A web form to provide a Svix API token and an App name. Submitting the form will make a POST request to `https://api.eu.svix.com/api/v1/app/` to create the app.
- **Result Display**: The response from the Svix API will be displayed in the UI, indicating success or failure.

## Original Context
The original command provided was a `curl` command for making an HTTP POST request to create a new app named "Oneseco-IO" using the Svix API. Here's a breakdown of the command:

- **URL**: `https://api.eu.svix.com/api/v1/app/` - This is the endpoint where the request is sent.
- **Headers**:
  - `Accept: application/json`: Indicates that the client expects JSON in the response.
  - `Content-Type: application/json`: Specifies that the data sent to the server is in JSON format.
  - `Authorization: Bearer ••••••••••••••••••••••••••••`: This is a placeholder for the actual API token. Replace the `•••••••••••••••••••••••••••` with the actual token to authenticate the request.
- **Data**: `-d '{"name": "Oneseco-IO"}'` - The payload of the request, specifying the name of the app to be created.

Before using the UI, ensure that you have your actual Bearer token. This token is necessary for authenticating with the Svix API.
