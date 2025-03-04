const { OpenAI } = require('openai');

// Initialize OpenAI client
// Using a function to initialize it only when needed
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not found in environment variables');
    return null;
  }
  return new OpenAI({ apiKey });
};

// Initialize OpenAI client at startup to validate the API key
const validateOpenAIKey = async () => {
  try {
    const openai = getOpenAIClient();
    if (openai) {
      console.log('OpenAI API key is configured.');
    } else {
      console.warn('OpenAI API key is not configured properly.');
    }
  } catch (error) {
    console.error('Error validating OpenAI API key:', error.message);
  }
};

// Validate the API key on startup
validateOpenAIKey();

/**
 * Handle webhook POST requests
 * This controller will process incoming webhook data and can integrate with OpenAI
 * to generate AI-related content in the future.
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Log the incoming webhook data
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));
    
    // Extract data from the webhook payload
    const { event, data } = req.body;
    
    if (!event) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required in the webhook payload'
      });
    }

    // Process different webhook event types
    switch (event) {
      case 'content_request':
        // This is where we would call OpenAI in the future
        const response = await processContentRequest(data);
        return res.status(200).json({
          success: true,
          message: 'Webhook processed successfully',
          data: response
        });
      
      // Handle other event types as needed
      default:
        return res.status(200).json({
          success: true,
          message: `Received webhook event: ${event}`,
          data: null
        });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

/**
 * Process content requests using OpenAI API
 */
async function processContentRequest(data) {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      throw new Error('OpenAI client not initialized. Check your API key.');
    }
    
    // Extract prompt from data or use default
    const userPrompt = data.prompt || "Tell me something interesting";
    
    // Set up system message based on data context if provided
    const systemMessage = data.context 
      ? `You are a helpful assistant. Context: ${data.context}` 
      : "You are a helpful assistant.";
    
    // Choose model based on data or default to gpt-3.5-turbo
    const model = data.model || "gpt-3.5-turbo";
    
    console.log(`Processing content request with model: ${model}`);
    console.log(`Prompt: ${userPrompt}`);
    
    // Make the API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: data.temperature || 0.7,
      max_tokens: data.max_tokens || 500
    });
    
    // Extract and return the generated content
    return {
      generated_content: completion.choices[0].message.content,
      model_used: model,
      prompt_tokens: completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      total_tokens: completion.usage?.total_tokens
    };
  } catch (error) {
    console.error('Error generating content with AI:', error);
    throw new Error(`Failed to generate AI content: ${error.message}`);
  }
}
