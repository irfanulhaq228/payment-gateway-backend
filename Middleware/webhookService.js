const axios = require('axios');

const dataUrl = [
  {
    url: 'http://62.72.57.126:8001/test-payment-gateway',
    merchantId: '677fd85eed136f3c4df14dcd'
  },
]

const sendWebhook = async (url, data) => {
  try {
    await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log(`Webhook sent successfully to ${url}`);
  } catch (error) {
    console.error(`Failed to send webhook to ${url}:`, error.message);
  }
};

const notifySubscribers = async (event, data, merchantId) => {
  try {
    console.log("notifySubscribers ==========> ", merchantId);

    const webhookData = {
      event,
      resourceId: data._id,
      resourceType: data.constructor.modelName,
      timestamp: new Date(),
      data
    };

    // for (const subscriber of subscribers) {
    //   await sendWebhook(subscriber.url, webhookData);
    // }

    const foundObject = dataUrl.find((item) => item.merchantId == merchantId);
    await sendWebhook(foundObject.url, webhookData);

    
  } catch (error) {
    console.error('Webhook notification error:', error);
  }
};

module.exports = {
  notifySubscribers
};