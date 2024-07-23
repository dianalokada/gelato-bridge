import express from 'express';
import bodyParser from 'body-parser';
import ky from 'ky-universal';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

//a POST route for '/send-tokens'
//this route will send a transaction to the Gelato API
app.post('/send-tokens', async (req, res) => {
  const { chainId, target, data } = req.body;

  if (!chainId || !target || !data === undefined) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    // Gelato Relay API endpoint for sponsored calls
    const gelatoApiUrl = 'https://api.gelato.digital/relays/v2/sponsored-call';

    // Make a POST request to Gelato API using ky
    const response = await ky.post(gelatoApiUrl, {
      json: {
        chainId: Number(chainId),
        target: target,
        data: data,
        sponsorApiKey: process.env.GELATO_API_KEY,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      throwHttpErrors: false
    }).json();

    console.log('Gelato API Response:', response);

    // Check if the response contains a taskId
    if (response.taskId) {
      res.status(200).send({ taskId: response.taskId });
    } else {
      res.status(400).send({ message: 'Failed to submit transaction', error: response });
    }
  } catch (error) {
    console.error('Error processing bridge transaction:', error);
    res.status(500).send(`Error processing bridge transaction: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:3000`);
});
