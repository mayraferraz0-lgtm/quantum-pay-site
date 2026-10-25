const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/criar-pix', async (req, res) => {
    try {
        const response = await fetch('https://api.quantumpay.com.br/v1/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_SECRET}`,
                'X-Account-Id': process.env.ACCOUNT_ID
            },
            body: JSON.stringify({
                amount: 100000,
                currency: 'BRL',
                paymentMethod: { type: 'PIX' },
                customer: { name: 'Marcos Gonçalo Medeiros Ferraz' }
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));
