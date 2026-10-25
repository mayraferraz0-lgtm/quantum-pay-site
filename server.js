const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/criar-pix', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        const apiSecret = process.env.API_SECRET;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ success: false, message: "Credenciais em falta nas variáveis de ambiente." });
        }

        // 1. Gerar o token de acesso via Basic Auth com o corpo JSON vazio exigido
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        
        const authResponse = await fetch('https://api.quantumpay.com.br/api/auth', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const authData = await authResponse.json();

        if (!authResponse.ok || (!authData.token && !authData.accessToken && !authData.data?.token && !authData.data?.accessToken)) {
            return res.status(400).json({ 
                success: false, 
                message: "Falha na autenticação", 
                detalhesQuantum: authData 
            });
        }

        const token = authData.token || authData.accessToken || authData.data?.token || authData.data?.accessToken;

        // 2. Criar a cobrança Pix utilizando o token obtido
        const pixResponse = await fetch('https://api.quantumpay.com.br/api/v1/pix/in/qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amountInCents: 100000, // R$ 1.000,00
                description: "Pagamento - Marcos Ferraz",
                customer: {
                    name: "Marcos Gonçalo Medeiros Ferraz",
                    email: "marcos.ferraz@email.com",
                    documentType: "cpf",
                    document: "11122233344"
                }
            })
        });

        const result = await pixResponse.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));
