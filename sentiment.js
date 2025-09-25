const axios = require('axios');

async function analyzeSentiment(message) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
      { inputs: message },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
    );
    return response.data[0];
  } catch (err) {
    return { label: 'NEUTRAL', score: 0.5 };
  }
}
module.exports = { analyzeSentiment };