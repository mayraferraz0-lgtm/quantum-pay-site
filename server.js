const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ACCOUNT_ID = process.env.ACCOUNT_ID;
const API_SECRET = process.env.API_SECRET;

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
                amountInCents,
                description,
                postbackUrl: "https://seu-servico.onrender.com/api/webhooks/pix-in",
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
