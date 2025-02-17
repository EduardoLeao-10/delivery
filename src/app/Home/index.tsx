import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Container,
  Title,
  CategoryContainer,
  CategoryButton,
  CategoryText,
  ProductButton,
  ProductText,
  TableHeader,
  TableInput,
  NextButton,
  NextButtonText,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TotalText,
} from "./styles";
import { database } from "../../services/firebaseConfig";
import { ref, set, push, get, remove, update } from "firebase/database";
import { RootStackParamList } from "../types";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
    orderId: string;
    items: OrderItem[];
    total: number;
}

export default function Home() {
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedUnitPrice, setSelectedUnitPrice] = useState<number>(0);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedTotal, setSelectedTotal] = useState<number>(0);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null); // ID do pedido atual
  const [fixedProducts, setFixedProducts] = useState<Product[]>([
    { id: "1", name: "Curriculo", category: "Trabalho", price: 15.0 },
    { id: "2", name: "Curriculo PDF", category: "Trabalho", price: 5.0 },
    { id: "3", name: "Xerox", category: "Impressão", price: 1.0 },
    { id: "4", name: "Impressão Curriculo 1 folha", category: "Impressão", price: 3.0 },
    { id: "5", name: "Impressão Curriculo 2 folhas", category: "Impressão", price: 4.0 },
    { id: "6", name: "Musica Selecionar", category: "Musica", price: 2.0 },
    { id: "7", name: "Detran", category: "Veiculo", price: 10.0 },
  ]);
  const router = useRouter();

  // Função para formatar o valor como "0,00"
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
  const parseCurrency = (value: string) => {
    const cleanedValue = value.replace(/\D/g, ""); // Remove tudo que não for número
    const numericValue = parseFloat(cleanedValue) / 100; // Divide por 100 para ajustar casas decimais
    return isNaN(numericValue) ? 0 : numericValue;
  };

    // Atualiza o total sempre que a quantidade ou o preço unitário mudar
    useEffect(() => {
      setSelectedTotal(selectedQuantity * selectedUnitPrice);
    }, [selectedQuantity, selectedUnitPrice]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, "menu");
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data: Record<string, Product> = snapshot.val();
          const productList = Object.entries(data).map(([id, item]) => ({
            ...item,
            id,
          }));
          setProducts(productList);
          setCategories([...new Set(productList.map((item) => item.category))]);
        } else {
          console.log("Nenhum dado encontrado no Firebase.");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do Firebase:", error);
      }
    };
    fetchData();
  }, []);

    const createNewOrder = async () => {
        const pedidosRef = ref(database, "pedidos");
        const newOrderRef = push(pedidosRef);
        const newOrderId = newOrderRef.key;

        if (newOrderId) {
            setCurrentOrderId(newOrderId);
            setOrderItems([]); // Limpar os itens do pedido anterior
            alert("Novo pedido iniciado!");
            return newOrderId;
        } else {
            console.error("Erro ao criar novo pedido.");
            return null;
        }
    };

  // Adicionar produto ao pedido
  const addToOrder = async (product: Product) => {
    let orderId = currentOrderId;

    if (!orderId) {
        orderId = await createNewOrder();
        if (!orderId) {
            alert("Erro ao iniciar novo pedido.");
            return;
        }
    }

    const newOrderItem: OrderItem = {
      id: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
    };

    const itemRef = ref(database, `pedidos/${orderId}/itens/${product.id}`);

    set(itemRef, newOrderItem)
        .then(() => {
            // alert("Item adicionado ao pedido!");
            // Atualizar o estado local
            setOrderItems((prevItems) => {
                const existingItem = prevItems.find((item) => item.id === product.id);
                if (existingItem) {
                    return prevItems.map((item) =>
                        item.id === product.id
                            ? {
                                ...item,
                                quantity: item.quantity + 1,
                                total: (item.quantity + 1) * item.unitPrice,
                            }
                            : item
                    );
                } else {
                    return [...prevItems, newOrderItem];
                }
            });
        })
        .catch((error) => {
            console.error("Erro ao adicionar item ao pedido:", error);
            alert("Erro ao adicionar item. Tente novamente.");
        });
  };

  // Adicionar nova linha de lançamento manual
  const addManualEntry = async () => {
    if (!selectedItem || selectedUnitPrice <= 0 || selectedQuantity <= 0) {
      alert("Preencha todos os campos corretamente!");
      return;
    }
  
      let orderId = currentOrderId;

      if (!orderId) {
          orderId = await createNewOrder();
          if (!orderId) {
              alert("Erro ao iniciar novo pedido.");
              return;
          }
      }

    const newItemId = Math.random().toString(36).substr(2, 9);
    const newOrderItem: OrderItem = {
      id: newItemId,
      name: selectedItem,
      quantity: selectedQuantity,
      unitPrice: selectedUnitPrice,
      total: selectedQuantity * selectedUnitPrice,
    };

      const itemRef = ref(database, `pedidos/${orderId}/itens/${newItemId}`);

    set(itemRef, newOrderItem)
        .then(() => {
            // alert("Item adicionado ao pedido!");
            setOrderItems((prevItems) => [...prevItems, newOrderItem]);
        })
        .catch((error) => {
            console.error("Erro detalhado ao salvar no Firebase:", error); // Log do erro completo
            alert("Erro ao salvar o item. Tente novamente.");
        });
  
    // Reiniciar os campos
    setSelectedItem("");
    setSelectedUnitPrice(0);
    setSelectedQuantity(1);
  };

  // Atualizar quantidade de um item
  const updateQuantity = async (id: string, quantity: number) => {
    let orderId = currentOrderId;

      if (!orderId) {
          alert("Nenhum pedido foi iniciado.");
          return;
      }

    const itemRef = ref(database, `pedidos/${orderId}/itens/${id}`);

    // Encontre o item no estado local para obter o preço unitário
    const itemToUpdate = orderItems.find(item => item.id === id);
    if (!itemToUpdate) {
        console.error("Item não encontrado no estado local.");
        return;
    }

    const updatedItem = {
        ...itemToUpdate,
        quantity: quantity,
        total: quantity * itemToUpdate.unitPrice
    };

    set(itemRef, updatedItem)
        .then(() => {
            // Atualizar o estado local
            setOrderItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === id ? updatedItem : item
                )
            );
        })
        .catch((error) => {
            console.error("Erro ao atualizar a quantidade do item:", error);
            alert("Erro ao atualizar a quantidade. Tente novamente.");
        });
  };

  // Calcular total do pedido
  const totalPrice = orderItems.reduce((sum, item) => sum + item.total, 0);

  const removeFromOrder = async (id: string) => {
      let orderId = currentOrderId;

      if (!orderId) {
          alert("Nenhum pedido foi iniciado.");
          return;
      }

      const itemRef = ref(database, `pedidos/${orderId}/itens/${id}`);

      remove(itemRef)
          .then(() => {
              // Atualizar o estado local
              setOrderItems((prevItems) => prevItems.filter((item) => item.id !== id));
          })
          .catch((error) => {
              console.error("Erro ao remover o item:", error);
              alert("Erro ao remover o item. Tente novamente.");
          });
  };

  const removeAllItems = async () => {
    if (!currentOrderId) {
        alert("Nenhum pedido foi iniciado.");
        return;
    }

    try {
        const orderRef = ref(database, `pedidos/${currentOrderId}/itens`);
        await remove(orderRef);

        setOrderItems([]);
        alert("Todos os itens foram removidos com sucesso!");
    } catch (error) {
        console.error("Erro ao remover os itens do Firebase:", error);
        alert("Erro ao remover os itens. Tente novamente.");
    }
  };
  

  const goToOrderView = () => {
    router.push({
      pathname: "/OrderView", // Certifique-se de que o nome da rota está correto
      params: {
        orderItems: JSON.stringify(orderItems), // Passa todos os itens do pedido
      },
    });
  };

  const goToOrders = () => {
    router.push({ pathname: "/Orders" as any }); // Navega para a tela de Orders
  };
    const goToQuiz = () => {
        router.push({ pathname: "/Quiz" as any }); // Navega para a tela de Quiz
    };

  return (
    <Container>
      <Title>Lançamento do Pedido</Title>

      <NextButton onClick={createNewOrder}>
        <NextButtonText>Novo Pedido</NextButtonText>
      </NextButton>

        <NextButton onClick={goToOrders}>
            <NextButtonText>Pedidos Anteriores</NextButtonText>
        </NextButton>

        <NextButton onClick={goToQuiz}>
            <NextButtonText>Fazer o Questionário</NextButtonText>
        </NextButton>
      {/* Categorias */}
      <CategoryContainer>
        {categories.map((category) => (
          <CategoryButton
            key={category}
            selected={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          >
            <CategoryText>{category}</CategoryText>
          </CategoryButton>
        ))}
      </CategoryContainer>

      {/* Itens fixos adicionados */}
      <CategoryContainer>
        {fixedProducts.map((product) => (
          <CategoryButton
            key={product.id}
            selected={selectedCategory === product.name}
            onClick={() => addToOrder(product)}
          >
            <CategoryText>{product.name}</CategoryText>
          </CategoryButton>
        ))}
      </CategoryContainer>

      {/* Lista de Produtos */}
      <div>
        {products
          .filter((p) => p.category === selectedCategory)
          .map((item) => (
            <ProductButton key={item.id} onClick={() => addToOrder(item)}>
              <ProductText>
                {item.name} - R$ {item.price.toFixed(2)}
              </ProductText>
            </ProductButton>
          ))}
      </div>

      {/* Tabela de Itens do Pedido */}
      <TableHeader>
        <div>
          <span>Item</span>
          <TableInput
        type="text"
        placeholder="Nome do item"
        value={selectedItem}
        onChange={(e) => setSelectedItem(e.target.value)}
      />
        </div>
        <div>
          <span>Qtde</span>
          <TableInput
        type="number"
        placeholder="Quantidade"
        value={selectedQuantity}
        onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
      />
        </div>
        <div>
          <span>Unit.</span>
          <TableInput
          type="text"
          placeholder="Preço unitário"
          value={formatCurrency(selectedUnitPrice)}
          onChange={(e) => setSelectedUnitPrice(parseCurrency(e.target.value))}
        />
        </div>
        <div>
          <span>Total</span>
          <TableInput
          type="text"
          placeholder="Total"
          value={formatCurrency(selectedTotal)}
          readOnly // O campo Total é somente leitura
        />
        </div>
      </TableHeader>

      {/* Itens Adicionados */}
      <TableBody>
        {orderItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <TableInput
                type="text"
                value={item.name}
                onChange={(e) => {
                  const updatedItems = orderItems.map((orderItem) =>
                    orderItem.id === item.id
                      ? { ...orderItem, name: e.target.value }
                      : orderItem
                  );
                  setOrderItems(updatedItems);
                }}
              />
            </TableCell>
            <TableCell>
              <TableInput
                type="number"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
              />
            </TableCell>
            <TableCell>
              <TableInput
                type="text"
                value={item.unitPrice.toFixed(2).replace(".", ",")}
                onChange={(e) => {
                  const updatedItems = orderItems.map((orderItem) =>
                    orderItem.id === item.id
                      ? {
                          ...orderItem,
                          unitPrice: parseFloat(e.target.value.replace(",", ".")) || 0,
                          total: orderItem.quantity * (parseFloat(e.target.value.replace(",", ".")) || 0),
                        }
                      : orderItem
                  );
                  setOrderItems(updatedItems);
                }}
              />
            </TableCell>
            <TableCell>R$ {item.total.toFixed(2).replace(".", ",")}</TableCell>
          </TableRow>
        ))}
      </TableBody>

      {/* Total do Pedido */}
      <TableFooter>
        <TotalText>Total: R$ {totalPrice.toFixed(2).replace(".", ",")}</TotalText>
      </TableFooter>

      {/* Botão para Adicionar Nova Linha */}
      <NextButton onClick={addManualEntry}>
        <NextButtonText>ADICIONAR LINHA</NextButtonText>
      </NextButton>

      {/* Botão Próximo */}
      <NextButton onClick={goToOrderView}>
        <NextButtonText>PRÓXIMO</NextButtonText>
      </NextButton>

      {/* Botão para Remover Todos os Itens */}
      <button onClick={removeAllItems}>🗑️ Excluir Todos</button>
    </Container>
  );
}