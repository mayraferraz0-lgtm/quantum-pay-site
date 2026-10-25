const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Configurações da API Quantum Pay
const QUANTUMPAY_API_URL = 'https://api.quantumpay.com.br';
const CLIENT_ID = process.env.QUANTUMPAY_CLIENT_ID || 'cmvmzvh8t000ol3q6m0c530a0';
const CLIENT_SECRET = process.env.QUANTUMPAY_CLIENT_SECRET || '2ed27d1cc3ed43fa53a30c5c846ff265fa2c203b8b8ab1d323fea619705aa8043481832eb7db5c82cc555207dd2e6d1176c78855135112afd9e4190c6d38dc6fd188c3ce792421b62283f9c482d3155a4bd06ad4310170a5c88c9e10aa2ecb0c80776fad81584d63cc55da1fa688664a73cf771d08a4bf13c338fb5439cfd68c';

// Cache do Token
let cachedToken = null;
let tokenExpirationTime = 0;

async function getValidToken() {
  const currentTime = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutos de margem

  if (cachedToken && (currentTime + bufferTime) < tokenExpirationTime) {
    return cachedToken;
  }

  console.log('🔄 Gerando novo token Quantum Pay...');

  try {
    const response = await axios.post(`${QUANTUMPAY_API_URL}/auth/token`, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });

    cachedToken = response.data.access_token || response.data.token;
    const expiresIn = response.data.expires_in || 3600; 
    tokenExpirationTime = Date.now() + (expiresIn * 1000);

    console.log('✅ Token gerado com sucesso!');
    return cachedToken;
  } catch (error) {
    console.error('❌ Erro de autenticação Quantum Pay:', error.response?.data || error.message);
    throw new Error('Falha na autenticação com o gateway de pagamento.');
  }
}

// Rota para criar QR Code Pix
app.post('/api/v1/pix/in/qrcode', async (req, res) => {
  try {
    const { amountInCents, description, customer } = req.body;
    const token = await getValidToken();

    const response = await axios.post(`${QUANTUMPAY_API_URL}/api/v1/pix/in/qrcode`, {
      amountInCents,
      description,
      customer
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: "QR Code gerado com sucesso",
      data: response.data
    });
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code Pix:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Erro ao processar pagamento PIX.'
    });
  }
});

// Interface de Checkout (Frontend)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR" class="dark">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Checkout Quantum Pay</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: { extend: { colors: { darkbg: '#0f172a', cardbg: '#1e293b' } } }
        }
      </script>
    </head>
    <body class="bg-darkbg text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-cardbg p-8 rounded-2xl shadow-2xl border border-slate-800">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Quantum Checkout</h1>
          <p class="text-sm text-slate-400 mt-1">Pagamento Instantâneo via PIX</p>
        </div>

        <form id="checkoutForm" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Selecione o Plano</label>
            <select id="amount" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500">
              <option value="10000">Plano Básico - R$ 100,00</option>
              <option value="25000">Plano Avançado - R$ 250,00</option>
              <option value="50000">Plano Master - R$ 500,00</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Nome Completo</label>
            <input type="text" id="name" required value="Cliente Exemplo Silva" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">E-mail</label>
            <input type="email" id="email" required value="cliente@exemplo.com" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">CPF</label>
            <input type="text" id="document" required value="11122233344" maxlength="11" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500">
          </div>

          <button type="submit" id="payBtn" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg transition duration-200">
            Gerar QR Code PIX
          </button>
        </form>

        <div id="resultArea" class="hidden mt-6 text-center space-y-4">
          <div class="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400">Pix Copia e Cola:</p>
            <textarea id="pixCopyPaste" readonly class="w-full h-24 bg-slate-950 text-xs text-emerald-400 p-2 rounded border border-slate-800 resize-none mt-2"></textarea>
          </div>
          <button onclick="location.reload()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 rounded-lg transition duration-200">Gerar Nova Cobrança</button>
        </div>
      </div>

      <script>
        document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = document.getElementById('payBtn');
          btn.disabled = true;
          btn.innerText = 'Gerando PIX...';

          const payload = {
            amountInCents: parseInt(document.getElementById('amount').value),
            description: "Assinatura - Plano Checkout",
            customer: {
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              documentType: "cpf",
              document: document.getElementById('document').value
            }
          };

          try {
            const res = await fetch('/api/v1/pix/in/qrcode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
              document.getElementById('checkoutForm').classList.add('hidden');
              document.getElementById('resultArea').classList.remove('hidden');
              
              const qrData = data.data.qrCode || data.data.pixCopyPaste || data.data.emv || JSON.stringify(data.data, null, 2);
              document.getElementById('pixCopyPaste').value = qrData;
            } else {
              alert('Erro: ' + (data.message || 'Falha ao gerar cobrança'));
              btn.disabled = false;
              btn.innerText = 'Gerar QR Code PIX';
            }
          } catch (err) {
            alert('Erro de conexão com o servidor.');
            btn.disabled = false;
            btn.innerText = 'Gerar QR Code PIX';
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
