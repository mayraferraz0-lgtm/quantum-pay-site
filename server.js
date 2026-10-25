const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/criar-pix', async (req, res) => {
    try {
        const response = await fetch('https://api.quantumpay.com.br/api/v1/pix/in/qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_SECRET}`
            },
            body: JSON.stringify({
                amountInCents: 100000,
                description: "Pagamento - Marcos Ferraz",
                customer: {
                    name: "Marcos Gonçalo Medeiros Ferraz"
                }
            })
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));
