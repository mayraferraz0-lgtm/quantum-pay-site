const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Endpoint responsável por:
 * 1. Autenticar em tempo real na Quantum Pay para obter um token fresco (evitando a expiração de 5 min)[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span).
 * 2. Utilizar esse token imediatamente para gerar o QR Code Pix[span_5](start_span)[span_5](end_span).
 */
app.post('/api/criar-pix', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        const apiSecret = process.env.API_SECRET;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ success: false, message: "Credenciais em falta nas variáveis de ambiente." });
        }

        // ==========================================
        // ETAPA 1: Geração Dinâmica do Token de Auth
        // ==========================================
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        
        const authResponse = await fetch('https://api.quantumpay.com.br/api/auth', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // Corpo JSON vazio exigido pela API para evitar erros de Content-Type
        });

        const authData = await authResponse.json();
        
        // Extrai o token independentemente da estrutura de retorno da API
        const token = authData.token || authData.accessToken || authData.data?.token || authData.data?.accessToken;

        if (!token) {
            return res.status(400).json({ 
                success: false, 
                message: "Falha na autenticação com a Quantum Pay", 
                detalhes: authData 
            });
        }

        // ==========================================
        // ETAPA 2: Criação da Cobrança Pix com o Token Fresco
        // ==========================================
        const pixResponse = await fetch('https://api.quantumpay.com.br/api/v1/pix/in/qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Token fresco gerado há poucos milissegundos
            },
            body: JSON.stringify({
                amountInCents: 5000, // R$ 50,00 (valor de teste seguro dentro do limite inicial da conta)[span_6](start_span)[span_6](end_span)
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
