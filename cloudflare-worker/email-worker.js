// Cloudflare Email Worker for English App
// This worker handles sending password reset emails

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    try {
      // Verify authorization
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response('Unauthorized - Missing token', { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      const token = authHeader.substring(7);
      if (token !== env.EMAIL_WORKER_TOKEN) {
        return new Response('Unauthorized - Invalid token', { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      // Parse email data
      const emailData = await request.json();
      const { to, from, subject, html, text } = emailData;

      // Validate required fields
      if (!to || !from || !subject || (!html && !text)) {
        return new Response('Missing required fields: to, from, subject, and html/text', { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      // Prepare email for MailChannels
      const emailRequest = {
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: { 
          email: from,
          name: "English App"
        },
        subject: subject,
        content: [],
      };

      // Add HTML content
      if (html) {
        emailRequest.content.push({
          type: 'text/html',
          value: html,
        });
      }

      // Add plain text content
      if (text) {
        emailRequest.content.push({
          type: 'text/plain',
          value: text,
        });
      }

      // Send via MailChannels (free for Cloudflare Workers)
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MailChannels error:', errorText);
        return new Response(`Email sending failed: ${errorText}`, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully' 
      }), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  },
};
