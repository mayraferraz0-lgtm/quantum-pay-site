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

        // 1. Gerar o token de acesso via Basic Auth no endpoint oficial /api/auth[span_2](start_span)[span_2](end_span)
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        
        const authResponse = await fetch('https://api.quantumpay.com.br/api/auth', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // Corpo JSON vazio obrigatório para evitar o erro de Content-Type
        });

        const authData = await authResponse.json();
        const token = authData.token || authData.accessToken || authData.data?.token || authData.data?.accessToken;

        if (!token) {
            return res.status(400).json({ 
                success: false, 
                message: "Falha na autenticação com a Quantum Pay", 
                detalhes: authData 
            });
        }

        // 2. Criar a cobrança Pix utilizando o token obtido e os dados validados[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)
        const pixResponse = await fetch('https://api.quantumpay.com.br/api/v1/pix/in/qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amountInCents: 5000, // R$ 50,00 para teste inicial (dentro do limite da conta)[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span)
                description: "Pagamento - Marcos Ferraz",
                customer: {
                    name: "Marcos Gonçalo Medeiros Ferraz",
                    email: "marcos.ferraz@email.com",
                    documentType: "cpf",
                    document: "57884781972",
                    phone: "42999675773"
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
