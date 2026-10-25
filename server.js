const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Se utilizar Node.js v18+, o fetch já é nativo

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir a página HTML

// As suas credenciais oficiais da QuantumPay[span_1](start_span)[span_1](end_span)
const ACCOUNT_ID = "cnvx7vhzt06xljqle6c53la8";
const API_SECRET = "03bdzdf596ea448a76d73b5329ad2b2a1f75b983a2b800e33fecef1a1c66194fa27c0b4f711f78dd3c56e42b875e69ebce7d7b6b5ae889e49dc33f439469a794ccea399803c7c82d6aaf06ee3a3b2169f7380700506e6a0a35ab48c0d9b3eb70e4c3d7c51af3b9eb9ff06e4776f127cd891e7dfe230dfdcc305d357ea71d2e59";

// 1. Rota para Criar o QR Code PIX (POST)
app.post('/api/criar-pix', async (req, res) => {
    try {
        const { amountInCents, description, customer } = req.body;

        const respostaQuantum = await fetch('https://api.quantumpay.com.br/api/v1/pix/in/qrcode', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_SECRET}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amountInCents: amountInCents, // Valor em cêntimos (ex: 5000 = R$ 50,00)[span_2](start_span)[span_2](end_span)
                description: description,     // Descrição da transação[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)
                postbackUrl: "https://seu-dominio.com/api/webhooks/pix-in",
                customer: {
                    name: customer.name,
                    email: customer.email,
                    documentType: "cpf",
                    document: customer.document,
                    phone: customer.phone
                }
            })
        });

        const dados = await respostaQuantum.json();
        return res.json(dados);
    } catch (erro) {
        console.error("Erro ao gerar PIX:", erro);
        return res.status(500).json({ success: false, message: "Erro de comunicação com a QuantumPay" });
    }
});

// 2. Rota para Verificar o Status da Transação (Polling GET)[span_5](start_span)[span_5](end_span)
app.get('/api/transacao/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;

        const respostaQuantum = await fetch(`https://api.quantumpay.com.br/api/v1/transactions/${transactionId}`, {
            headers: {
                'Authorization': `Bearer ${API_SECRET}`
            }
        });

        const dados = await respostaQuantum.json();
        return res.json(dados);
    } catch (erro) {
        console.error("Erro ao verificar status:", erro);
        return res.status(500).json({ success: false, message: "Erro ao consultar transação" });
    }
});

app.listen(3000, () => {
    console.log('Servidor de teste a correr em http://localhost:3000');
});
