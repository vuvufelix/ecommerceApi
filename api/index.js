const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const { Sequelize } = require("sequelize");
const Stripe = require("stripe");

const server = express();

server.use(express.json());
server.use(cors());

// Conecta o banco de dados
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "mysql",
        port: process.env.DB_PORT,
        dialectOptions: {
            connectTimeout: 10000,
        },
        logging: false
    }
)

sequelize.authenticate().then(() => {
    console.log("Banco de dados conectado com sucesso");
})


// ==================



const Products = sequelize.define("product", {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    price: {
        type: Sequelize.DOUBLE,
        allowNull: false
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

// Forçar a criação do banco de dados
Products.sync({force: false});

//=================================



server.get("/", (req, res) => {
    res.send("API funcionando!")
})

server.post("/create-checkout-session", async (req, res) => {

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        try {
            const { AllProducts } = req.body;
            
            //const products = JSON.parse(AllProducts)

            // Lista os produtos adicionados ao carrinho
            const lineItems = AllProducts.map((product) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                    },
                    unit_amount: product.price * 100,
                },
                quantity: product.quantity || 1
            }));

            // Cria uma nova sessão de pagamento!
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items: lineItems,
                success_url: 'https://nenet.vercel.app/success',
                cancel_url: 'https://nenet.vercel.app/cancel'
            });

            res.json({ url: session.url })
        } catch {
            res.status(500).json({message: "Erro ao criar pagamento"});
        }
})

server.get("/products", (req, res) => {
    // Buscar todos os Produtos
        Products.findAll().then((product) => {
            res.json(product);
        }).catch((error) => {
            res.json({message: "Erro ao Listar os produtos " + error});
        });
})

server.get("/product/:id", (req, res) => {

        const { id } = req.params;

        Products.findOne({where: {"id": id}}).then((product) => {
            res.json(product);
        }).catch((error) => {
            res.json({message: "Erro ao buscar produto " + error});
        });
})

server.get("/product/search/:name", (req, res) => {
        const { name } = req.params;

        Products.findAll({where: {"name": name}}).then((products) => {
            res.json(products);
        }).catch((error) => {
            res.json({message: "Houve um erro ao pesquisar produto"});
        });
})

server.get("/products/:category", (req, res) => {
        const { category } = req.params;

        Products.findAll({where: {"category": category}}).then((product) => {
            res.json(product);
        }).catch((error) => {
            res.json("Erro ao Listar categoria " + error);
        });
})

server.listen(3306, () => console.log("servidor rodando!"));