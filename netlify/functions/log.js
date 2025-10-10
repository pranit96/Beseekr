// netlify/functions/log.js
exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const logEntry = JSON.parse(event.body);
    
    // Log to Netlify's built-in logging (visible in Netlify dashboard)
    console.log('CLIENT_LOG:', {
      timestamp: new Date().toISOString(),
      component: logEntry.component,
      level: logEntry.level,
      message: logEntry.message,
      data: logEntry.data
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error processing log:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};