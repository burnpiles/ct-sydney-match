export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Your Beehiiv API credentials
    const subscriptionData = {
      email: email,
      publication_id: 'af855f40-23cd-4896-98f2-57d8960740e1',
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: 'contragames',
      utm_medium: 'sydney_vision',
      utm_campaign: 'game_subscription'
    };

    // Call Beehiiv API from server-side (no CORS issues)
    const response = await fetch(`https://api.beehiiv.com/v2/publications/af855f40-23cd-4896-98f2-57d8960740e1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer a7ROzXt8m5RiJWO9GRHDwWk7C0MNdbwyoxme0NYiCmUWaDzNkR1ulmdmdOT15r2U'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } else {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Beehiiv API error: ${errorText}` });
    }

  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: error.message });
  }
} 