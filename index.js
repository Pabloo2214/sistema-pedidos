import express from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

;(async () => {
  try {
    await prisma.$connect()
    console.log('✅ Conectado ao banco de dados com sucesso!')
  } catch (e) {
    console.error('❌ Erro ao conectar ao banco de dados:', e.message)
    process.exit(1)
  }
})()

const app = express()
app.use(express.json())

// POST /orders — criar pedido com relacionamentos
app.post('/orders', async (req, res) => {
  const { ClienteId, RestauranteId, itens } = req.body

  // validações simuladas
  if (!ClienteId || !RestauranteId) {
    return res
      .status(400)
      .json({ erro: 'Cliente ou restaurante inválido.' })
  }

  // converte itens (array) para string JSON, pois no schema é String?
  const itensString = JSON.stringify(itens)
    
  try {
    const novoPedido = await prisma.pedidos.create({
      data: {
        status_pedido: 'em preparo',
        pagamento: 'pendente',
        itens: itensString, // armazena a string JSON no banco de dados
         // armazena a string JSON no banco de dados

        // relaciona ao usuário existente
        Users: {

          connect: { id: ClienteId }
        },

        // relaciona ao restaurante existente
        Restaurant: {
          connect: { id: RestauranteId }
        }
      }
    })
    return res.status(201).json(novoPedido)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ erro: 'Erro ao criar pedido.' })
  }
})

// PUT /orders/:id/status — atualizar apenas o status
app.put('/orders/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { status_pedido } = req.body

  try {
    const pedidoAtualizado = await prisma.pedidos.update({
      where: { id },
      data: { status_pedido }
    })
    return res.json(pedidoAtualizado)
  } catch {
    return res.status(404).json({ erro: 'Pedido não encontrado.' })
  }
})

// GET /orders/:id — buscar pedido com usuário e restaurante
app.get('/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const pedido = await prisma.pedidos.findUnique({
    where: { id },
    include: {
      Users: true,
      Restaurant: true
    }
  })
  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado.' })
  }
  // converta itens de volta para objeto se quiser
  try {
    pedido.itens = JSON.parse(pedido.itens)
  } catch {}
  return res.json(pedido)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () =>
  console.log(`Servidor rodando na porta ${PORT}`)
)
