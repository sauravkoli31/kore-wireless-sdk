 // Start Generation Here
 ## Usage

 ### Installation

 Install the SDK via npm:

 ```bash
 npm install kore-sdk
 ```

 ### Configuration

 Ensure you have your API credentials set in the `.env` file:

 ```
 KORE_CLIENT_ID=your_client_id
 KORE_CLIENT_SECRET=your_client_secret
 ```

 ### Initialization

 Initialize the KoreClient in your project:

 ```javascript
 import { KoreClient } from 'kore-sdk';
 import { configDotenv } from 'dotenv';

 configDotenv();

 const clientId = process.env.KORE_CLIENT_ID;
 const clientSecret = process.env.KORE_CLIENT_SECRET;

 const koreClient = new KoreClient(clientId, clientSecret);
 ```

 ### Example Usage

 #### Ping API

 ```javascript
 async function ping() {
   try {
     const pingResponse = await koreClient.clientApi.getPingStatus();
     console.log('Ping Response:', pingResponse);
   } catch (error) {
     console.error('Error:', error);
   }
 }

 ping();
 ```

 #### Listing Rate Plans

 ```javascript
 async function listRatePlans() {
   try {
     const ratePlans = await koreClient.wirelessApi.listRatePlans();
     console.log('Rate Plans:', ratePlans);
   } catch (error) {
     console.error('Error:', error);
   }
 }

 listRatePlans();
 ```

 ### Error Handling

 The SDK throws \`ApiError\` for API related errors. You can handle them as follows:

 ```javascript
 try {
   // Your API call
 } catch (error) {
   if (error instanceof ApiError) {
     console.error(\`API Error: \${error.message} (Status: \${error.status})\`);
   } else {
     console.error('Unexpected Error:', error);
   }
 }
 ```



